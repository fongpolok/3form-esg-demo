import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { WorkOrderStatus } from '@esg/shared-types';
import { listWorkOrders } from '../api/work-orders';
import { StatusBadge } from '../components/StatusBadge';

const STATUS_OPTIONS: Array<{ value: WorkOrderStatus | ''; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'ORDER_RECEIVED', label: 'Order Received' },
  { value: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function WorkOrdersListPage() {
  const [status, setStatus] = useState<WorkOrderStatus | ''>('');
  const { data: workOrders, isLoading, isError } = useQuery({
    queryKey: ['work-orders', status],
    queryFn: () => listWorkOrders({ status: status || undefined }),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Work Orders</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            Audited tracking for industrial recycling workflows
          </p>
        </div>
        <Link
          to="/work-orders/new"
          style={{
            background: 'var(--color-action-green)',
            color: 'var(--color-text-on-dark)',
            padding: '0.6rem 1.1rem',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          + Create New Work Order
        </Link>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="status-filter" style={{ marginRight: '0.5rem', fontWeight: 600 }}>
          Status:
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as WorkOrderStatus | '')}
          style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid var(--color-border-placeholder)' }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p role="status">Loading work orders…</p>}
      {isError && <p role="alert">Could not load work orders.</p>}

      {workOrders && workOrders.length === 0 && <p>No work orders yet — create the first one above.</p>}

      {workOrders && workOrders.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-surface-card)' }}>
          <caption className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
            List of work orders with their client, material, weight, and status
          </caption>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-placeholder)' }}>
              <th scope="col" style={{ padding: '0.75rem' }}>
                WO#
              </th>
              <th scope="col" style={{ padding: '0.75rem' }}>
                Date
              </th>
              <th scope="col" style={{ padding: '0.75rem' }}>
                Client
              </th>
              <th scope="col" style={{ padding: '0.75rem' }}>
                Material
              </th>
              <th scope="col" style={{ padding: '0.75rem' }}>
                Weight (kg)
              </th>
              <th scope="col" style={{ padding: '0.75rem' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((wo) => (
              <tr key={wo.id} style={{ borderBottom: '1px solid var(--color-border-placeholder)' }}>
                <td style={{ padding: '0.75rem' }}>
                  <Link to={`/work-orders/${wo.id}`}>#{wo.wipNo}</Link>
                </td>
                <td style={{ padding: '0.75rem' }}>{new Date(wo.wipDate).toLocaleDateString('en-HK')}</td>
                <td style={{ padding: '0.75rem' }}>{wo.clientName ?? '—'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {wo.materials.map((m) => m.materialType.nameEn).join(', ') || '—'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {wo.materials.reduce((sum, m) => sum + Number(m.weightKg), 0).toLocaleString('en-HK')}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <StatusBadge status={wo.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
