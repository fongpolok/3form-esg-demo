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
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>#{workOrder.wipNo}</h1>
        <StatusBadge status={workOrder.status} />
      </div>
      <p style={{ color: 'var(--color-text-muted)' }}>
        {new Date(workOrder.wipDate).toLocaleDateString('en-HK')} · {workOrder.clientName ?? 'No client on record'}
      </p>

      {!isTerminal && nextStage && (
        <button
          type="button"
          onClick={() => statusMutation.mutate(nextStage)}
          disabled={statusMutation.isPending}
          style={{
            background: 'var(--color-action-green)',
            color: 'var(--color-text-on-dark)',
            border: 'none',
            borderRadius: 6,
            padding: '0.6rem 1.2rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1.5rem',
          }}
        >
          Advance to {nextStage.replace(/_/g, ' ').toLowerCase()}
        </button>
      )}

      <section style={{ marginBottom: '2rem' }}>
        <h2>Stage History</h2>
        <ol style={{ listStyle: 'none', padding: 0 }}>
          {workOrder.stageEvents.map((event) => (
            <li key={event.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border-placeholder)' }}>
              <StatusBadge status={event.stage} /> <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-muted)' }}>
                {new Date(event.occurredAt).toLocaleString('en-HK')}
              </span>
              {event.note && <div style={{ marginTop: '0.25rem' }}>{event.note}</div>}
            </li>
          ))}
        </ol>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Received Materials</h2>
        {workOrder.materials.length === 0 && <p>No materials recorded yet.</p>}
        {workOrder.materials.length > 0 && (
          <ul style={{ paddingLeft: '1.2rem' }}>
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
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginTop: '1rem' }}
          >
            <div>
              <label htmlFor="materialTypeId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
                Material Type
              </label>
              <select
                id="materialTypeId"
                {...materialForm.register('materialTypeId')}
                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--color-border-placeholder)' }}
              >
                <option value="">Select…</option>
                {materialTypesQuery.data?.map((mt) => (
                  <option key={mt.id} value={mt.id}>
                    {mt.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="weightKg" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
                Weight (kg)
              </label>
              <input
                id="weightKg"
                type="number"
                step="0.001"
                {...materialForm.register('weightKg')}
                style={{
                  padding: '0.5rem',
                  borderRadius: 6,
                  border: '1px solid var(--color-border-placeholder)',
                  width: 140,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={materialMutation.isPending}
              style={{
                background: 'var(--color-navy-800)',
                color: 'var(--color-text-on-dark)',
                border: 'none',
                borderRadius: 6,
                padding: '0.55rem 1rem',
                cursor: 'pointer',
              }}
            >
              Add Material
            </button>
          </form>
        )}
      </section>

      <section>
        <h2>Processed Material (WIP Completion)</h2>
        {workOrder.processedMaterial ? (
          <p>
            Output: {Number(workOrder.processedMaterial.outputWeightKg).toLocaleString('en-HK')} kg · Scrap:{' '}
            {Number(workOrder.processedMaterial.scrapWeightKg).toLocaleString('en-HK')} kg
          </p>
        ) : isTerminal ? (
          <p>This work order was cancelled before processing completed.</p>
        ) : (
          <ProcessedMaterialForm
            onSubmit={(input) => processedMutation.mutate(input)}
            isPending={processedMutation.isPending}
          />
        )}
      </section>
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
      <div>
        <label htmlFor="outputWeightKg" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
          Output Weight (kg)
        </label>
        <input
          id="outputWeightKg"
          type="number"
          step="0.001"
          {...register('outputWeightKg')}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--color-border-placeholder)', width: 160 }}
        />
      </div>
      <div>
        <label htmlFor="scrapWeightKg" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
          Scrap Weight (kg)
        </label>
        <input
          id="scrapWeightKg"
          type="number"
          step="0.001"
          {...register('scrapWeightKg')}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--color-border-placeholder)', width: 160 }}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        style={{
          background: 'var(--color-action-green)',
          color: 'var(--color-text-on-dark)',
          border: 'none',
          borderRadius: 6,
          padding: '0.55rem 1.2rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Complete Work Order
      </button>
    </form>
  );
}
