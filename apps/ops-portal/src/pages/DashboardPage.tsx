import { useQuery } from '@tanstack/react-query';
import { listWorkOrders } from '../api/work-orders';
import { StatusBadge } from '../components/StatusBadge';

// A real (not mocked) summary built from the same work-orders API the
// Work Orders screen uses — Phase 5 scope note: this is the functional
// core of the dashboard-overview Figma screen (stat tiles + recent work
// orders), not the chart widgets (waste-processing trend, energy line
// chart) or the ESG compliance-score gauge, which need a charting library
// pass that wasn't in scope for this build.
export function DashboardPage() {
  const { data: workOrders, isLoading } = useQuery({ queryKey: ['work-orders', ''], queryFn: () => listWorkOrders() });

  const total = workOrders?.length ?? 0;
  const active = workOrders?.filter((w) => !['COMPLETED', 'CANCELLED'].includes(w.status)).length ?? 0;
  const completed = workOrders?.filter((w) => w.status === 'COMPLETED').length ?? 0;
  const totalWeightKg = workOrders?.reduce((sum, w) => sum + w.materials.reduce((s, m) => s + Number(m.weightKg), 0), 0) ?? 0;

  return (
    <div>
      <h1>Dashboard</h1>
      {isLoading && <p role="status">Loading…</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatTile label="Total Work Orders" value={total} />
        <StatTile label="Active Jobs" value={active} />
        <StatTile label="Completed" value={completed} />
        <StatTile label="Total Material Logged" value={`${totalWeightKg.toLocaleString('en-HK')} kg`} />
      </div>

      <h2>Recent Work Orders</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-placeholder)' }}>
            <th scope="col" style={{ padding: '0.6rem' }}>WO#</th>
            <th scope="col" style={{ padding: '0.6rem' }}>Client</th>
            <th scope="col" style={{ padding: '0.6rem' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {workOrders?.slice(0, 5).map((w) => (
            <tr key={w.id} style={{ borderBottom: '1px solid var(--color-border-placeholder)' }}>
              <td style={{ padding: '0.6rem' }}>#{w.wipNo}</td>
              <td style={{ padding: '0.6rem' }}>{w.clientName ?? '—'}</td>
              <td style={{ padding: '0.6rem' }}><StatusBadge status={w.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--color-surface-card)', borderRadius: 8, padding: '1.25rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
