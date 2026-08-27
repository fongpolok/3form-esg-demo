import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { WorkOrderStatus } from '@esg/shared-types';
import {
  addWorkOrderMaterialSchema,
  recordProcessedMaterialSchema,
  type AddWorkOrderMaterialInput,
  type RecordProcessedMaterialInput,
} from '@esg/shared-validation';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@esg/ui';
import {
  addWorkOrderMaterial,
  getWorkOrder,
  listMaterialTypes,
  recordProcessedMaterial,
  updateWorkOrderStatus,
} from '../api/work-orders';
import { StatusBadge } from '../components/StatusBadge';

const FORWARD_STAGES: WorkOrderStatus[] = [
  'ORDER_RECEIVED',
  'PICKUP_SCHEDULED',
  'IN_TRANSIT',
  'PROCESSING',
  'COMPLETED',
];
const TERMINAL: WorkOrderStatus[] = ['COMPLETED', 'CANCELLED'];

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const workOrderQuery = useQuery({
    queryKey: ['work-orders', id],
    queryFn: () => getWorkOrder(id!),
    enabled: !!id,
  });
  const materialTypesQuery = useQuery({ queryKey: ['material-types'], queryFn: listMaterialTypes });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['work-orders', id] }),
      queryClient.invalidateQueries({ queryKey: ['work-orders'] }),
    ]);

  const statusMutation = useMutation({
    mutationFn: (status: WorkOrderStatus) => updateWorkOrderStatus(id!, { status }),
    onSuccess: invalidate,
  });

  const materialForm = useForm<AddWorkOrderMaterialInput>({ resolver: zodResolver(addWorkOrderMaterialSchema) });
  const materialMutation = useMutation({
    mutationFn: (input: AddWorkOrderMaterialInput) => addWorkOrderMaterial(id!, input),
    onSuccess: async () => {
      await invalidate();
      materialForm.reset();
    },
  });

  const processedMutation = useMutation({
    mutationFn: (input: RecordProcessedMaterialInput) => recordProcessedMaterial(id!, input),
    onSuccess: invalidate,
  });

  if (workOrderQuery.isLoading) return <p role="status">Loading work order…</p>;
  if (workOrderQuery.isError || !workOrderQuery.data) return <p role="alert">Could not load this work order.</p>;

  const workOrder = workOrderQuery.data;
  const isTerminal = TERMINAL.includes(workOrder.status);
  const currentStageIndex = FORWARD_STAGES.indexOf(workOrder.status);
  const nextStage = !isTerminal ? FORWARD_STAGES[currentStageIndex + 1] : undefined;

  return (
    <div className="max-w-3xl">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-[22px] font-bold text-[#1e293b]">#{workOrder.wipNo}</h1>
        <StatusBadge status={workOrder.status} />
      </div>
      <p className="mb-6 text-sm text-[#627288]">
        {new Date(workOrder.wipDate).toLocaleDateString('en-HK')} · {workOrder.clientName ?? 'No client on record'}
      </p>

      {!isTerminal && nextStage && (
        <Button onClick={() => statusMutation.mutate(nextStage)} disabled={statusMutation.isPending} className="mb-6">
          Advance to {nextStage.replace(/_/g, ' ').toLowerCase()}
        </Button>
      )}

      <Card className="mb-5 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Stage History</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-0">
            {workOrder.stageEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 border-t border-[#f0f0f0] py-2.5 first:border-t-0">
                <StatusBadge status={event.stage} />
                <span className="text-sm text-[#627288]">{new Date(event.occurredAt).toLocaleString('en-HK')}</span>
                {event.note && <span className="text-sm">{event.note}</span>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="mb-5 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Received Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {workOrder.materials.length === 0 && <p className="text-sm text-[#627288]">No materials recorded yet.</p>}
          {workOrder.materials.length > 0 && (
            <ul className="mb-4 list-disc pl-5 text-sm">
              {workOrder.materials.map((m) => (
                <li key={m.id}>
                  {m.materialType.nameEn} — {Number(m.weightKg).toLocaleString('en-HK')} kg
                  {m.productType ? ` (${m.productType})` : ''}
                </li>
              ))}
            </ul>
          )}

          {!isTerminal && (
            <form
              onSubmit={materialForm.handleSubmit((input) => materialMutation.mutate(input))}
              noValidate
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="materialTypeId" className="text-xs">
                  Material Type
                </Label>
                <select
                  id="materialTypeId"
                  {...materialForm.register('materialTypeId')}
                  className="rounded-md border border-[#d1d6e0] px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {materialTypesQuery.data?.map((mt) => (
                    <option key={mt.id} value={mt.id}>
                      {mt.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="weightKg" className="text-xs">
                  Weight (kg)
                </Label>
                <Input id="weightKg" type="number" step="0.001" {...materialForm.register('weightKg')} className="w-36" />
              </div>
              <Button type="submit" variant="secondary" disabled={materialMutation.isPending}>
                Add Material
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Processed Material (WIP Completion)</CardTitle>
        </CardHeader>
        <CardContent>
          {workOrder.processedMaterial ? (
            <p className="text-sm">
              Output: {Number(workOrder.processedMaterial.outputWeightKg).toLocaleString('en-HK')} kg · Scrap:{' '}
              {Number(workOrder.processedMaterial.scrapWeightKg).toLocaleString('en-HK')} kg
            </p>
          ) : isTerminal ? (
            <p className="text-sm text-[#627288]">This work order was cancelled before processing completed.</p>
          ) : (
            <ProcessedMaterialForm onSubmit={(input) => processedMutation.mutate(input)} isPending={processedMutation.isPending} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessedMaterialForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (input: RecordProcessedMaterialInput) => void;
  isPending: boolean;
}) {
  const { register, handleSubmit } = useForm<RecordProcessedMaterialInput>({
    resolver: zodResolver(recordProcessedMaterialSchema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="outputWeightKg" className="text-xs">
          Output Weight (kg)
        </Label>
        <Input id="outputWeightKg" type="number" step="0.001" {...register('outputWeightKg')} className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="scrapWeightKg" className="text-xs">
          Scrap Weight (kg)
        </Label>
        <Input id="scrapWeightKg" type="number" step="0.001" {...register('scrapWeightKg')} className="w-40" />
      </div>
      <Button type="submit" disabled={isPending}>
        Complete Work Order
      </Button>
    </form>
  );
}
