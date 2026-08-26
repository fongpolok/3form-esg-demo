import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createWorkOrderSchema, type CreateWorkOrderInput } from '@esg/shared-validation';
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
    <div style={{ maxWidth: 560 }}>
      <h1>Create New Work Order</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        WIP Generation — client, date, and time. A work order number is assigned automatically.
      </p>

      <form onSubmit={handleSubmit((input) => mutation.mutate(input))} noValidate>
        {serverError && (
          <div role="alert" style={{ color: 'var(--color-status-danger-fg)', marginBottom: '1rem' }}>
            Could not create the work order. Please check the form and try again.
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="clientId" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
            Client (optional)
          </label>
          <select
            id="clientId"
            {...register('clientId')}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              border: '1px solid var(--color-border-placeholder)',
              borderRadius: 6,
            }}
          >
            <option value="">— No client on record —</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="wipDate" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
              Date
            </label>
            <input
              id="wipDate"
              type="date"
              aria-invalid={errors.wipDate ? 'true' : undefined}
              aria-describedby={errors.wipDate ? 'wipDate-error' : undefined}
              {...register('wipDate')}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-border-placeholder)',
                borderRadius: 6,
              }}
            />
            {errors.wipDate && (
              <p id="wipDate-error" style={{ color: 'var(--color-status-danger-fg)', fontSize: '0.85rem' }}>
                {errors.wipDate.message}
              </p>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="wipTime" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
              Time
            </label>
            <input
              id="wipTime"
              type="time"
              aria-invalid={errors.wipTime ? 'true' : undefined}
              aria-describedby={errors.wipTime ? 'wipTime-error' : undefined}
              {...register('wipTime')}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-border-placeholder)',
                borderRadius: 6,
              }}
            />
            {errors.wipTime && (
              <p id="wipTime-error" style={{ color: 'var(--color-status-danger-fg)', fontSize: '0.85rem' }}>
                {errors.wipTime.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          style={{
            background: 'var(--color-action-green)',
            color: 'var(--color-text-on-dark)',
            border: 'none',
            borderRadius: 6,
            padding: '0.7rem 1.4rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {mutation.isPending ? 'Creating…' : 'Create Work Order'}
        </button>
      </form>
    </div>
  );
}
