import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createWorkOrderSchema, type CreateWorkOrderInput } from '@esg/shared-validation';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@esg/ui';
import { createWorkOrder } from '../api/work-orders';
import { listClients } from '../api/org';
import { ApiError } from '../api/client';

export function CreateWorkOrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: listClients });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      wipDate: new Date().toISOString().slice(0, 10),
      wipTime: new Date().toISOString().slice(11, 16),
    },
  });

  const mutation = useMutation({
    mutationFn: createWorkOrder,
    onSuccess: async (workOrder) => {
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      navigate(`/work-orders/${workOrder.id}`);
    },
    onError: (err) => {
      setServerError(err instanceof ApiError ? err.code : 'UNKNOWN_ERROR');
    },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-[22px] font-bold text-[#1e293b]">Create New Work Order</h1>
      <p className="mb-6 text-sm text-[#627288]">
        WIP Generation — client, date, and time. A work order number is assigned automatically.
      </p>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Work Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((input) => mutation.mutate(input))} noValidate className="flex flex-col gap-5">
            {serverError && (
              <div role="alert" className="rounded-md bg-[var(--color-status-danger-bg)] p-3 text-sm text-[var(--color-status-danger-fg)]">
                Could not create the work order. Please check the form and try again.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="clientId">Client (optional)</Label>
              <select
                id="clientId"
                {...register('clientId')}
                className="rounded-md border border-[#d1d6e0] bg-white px-3 py-2 text-sm"
              >
                <option value="">— No client on record —</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="wipDate">Date</Label>
                <Input
                  id="wipDate"
                  type="date"
                  aria-invalid={errors.wipDate ? 'true' : undefined}
                  aria-describedby={errors.wipDate ? 'wipDate-error' : undefined}
                  {...register('wipDate')}
                />
                {errors.wipDate && (
                  <p id="wipDate-error" className="text-sm text-[var(--color-status-danger-fg)]">
                    {errors.wipDate.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wipTime">Time</Label>
                <Input
                  id="wipTime"
                  type="time"
                  aria-invalid={errors.wipTime ? 'true' : undefined}
                  aria-describedby={errors.wipTime ? 'wipTime-error' : undefined}
                  {...register('wipTime')}
                />
                {errors.wipTime && (
                  <p id="wipTime-error" className="text-sm text-[var(--color-status-danger-fg)]">
                    {errors.wipTime.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || mutation.isPending} className="w-fit">
              {mutation.isPending ? 'Creating…' : 'Create Work Order'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
