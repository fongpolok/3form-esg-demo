import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getClientImpactSummary, generateSelfServiceReport, getReportDownloadUrl, listReports, listReportTemplates } from '../api/reports';
import { listWorkOrders } from '../api/work-orders';

// Matches the client-view Figma frame's content (stat tiles, materials
// breakdown, active work-order status, downloadable reports) — read-only
// by construction, no forms with side effects except "generate my own
// provisional report" and "download," neither of which mutates facility
// data (plan §7).
const FACILITY_ID = '1'; // single-facility PoC; a facility picker is a Phase-6+ multi-tenant concern.

function currentQuarterRange() {
  const now = new Date();
  const quarter = Math.floor(now.getUTCMonth() / 3);
  const start = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3 + 3, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function DashboardPage() {
  const { clientId } = useAuth();
  const queryClient = useQueryClient();
  const { start, end } = currentQuarterRange();

  const summaryQuery = useQuery({
    queryKey: ['client-impact-summary', clientId],
    queryFn: () => getClientImpactSummary({ facilityId: FACILITY_ID, clientId: clientId!, periodStart: start, periodEnd: end }),
    enabled: !!clientId,
  });
  const workOrdersQuery = useQuery({
    queryKey: ['work-orders', clientId],
    queryFn: () => listWorkOrders(clientId!),
    enabled: !!clientId,
  });
  const reportsQuery = useQuery({
    queryKey: ['reports', clientId],
    queryFn: () => listReports(clientId!),
    enabled: !!clientId,
  });
  const templatesQuery = useQuery({ queryKey: ['report-templates'], queryFn: listReportTemplates });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateSelfServiceReport({
        facilityId: FACILITY_ID,
        clientId: clientId!,
        reportTemplateId: templatesQuery.data![0]!.id,
        periodStart: start,
        periodEnd: end,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports', clientId] }),
  });

  async function download(id: string) {
    const { url } = await getReportDownloadUrl(id);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const activeWorkOrders = workOrdersQuery.data?.filter((w) => !['COMPLETED', 'CANCELLED'].includes(w.status)) ?? [];
  const totalInputKg = workOrdersQuery.data?.reduce((sum, w) => sum + w.materials.reduce((s, m) => s + Number(m.weightKg), 0), 0) ?? 0;
  const recyclingRate = totalInputKg > 0 && summaryQuery.data ? Math.round((summaryQuery.data.totalRecycledKg / totalInputKg) * 1000) / 10 : null;

  return (
    <div>
      <h1 style={{ marginBottom: '0.25rem' }}>Your ESG Performance Dashboard</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>Live ecological metrics and waste recovery tracking.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
        <StatTile label="Total Waste Recycled" value={`${(summaryQuery.data?.totalRecycledKg ?? 0).toLocaleString('en-HK')} kg`} note="This quarter" />
        <StatTile label="Carbon Offset" value={`${((summaryQuery.data?.co2SavedKg ?? 0) / 1000).toLocaleString('en-HK', { maximumFractionDigits: 2 })} t CO2e`} note={`Equivalent to ${summaryQuery.data?.treesSaved ?? 0} trees`} />
        <StatTile label="Recycling Rate" value={recyclingRate !== null ? `${recyclingRate}%` : '—'} note="Recycled ÷ received" />
        <StatTile label="Active Work Orders" value={activeWorkOrders.length} note="Currently in process" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <section style={{ background: 'var(--color-surface-card)', borderRadius: 8, padding: '1.25rem' }}>
          <h2 style={{ marginTop: 0 }}>Materials Breakdown</h2>
          {summaryQuery.data && summaryQuery.data.materialsBreakdown.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {summaryQuery.data.materialsBreakdown.map((m) => (
                <li key={m.wasteType} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border-placeholder)' }}>
                  <span>{m.wasteType}</span>
                  <span>{m.kg.toLocaleString('en-HK')} kg ({m.percent}%)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recycled materials recorded for this quarter yet.</p>
          )}
        </section>

        <section style={{ background: 'var(--color-surface-card)', borderRadius: 8, padding: '1.25rem' }}>
          <h2 style={{ marginTop: 0 }}>Active Work Orders</h2>
          {activeWorkOrders.length === 0 && <p>None right now.</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {activeWorkOrders.map((w) => (
              <li key={w.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--color-border-placeholder)' }}>
                <strong>#{w.wipNo}</strong> — {w.materials.map((m) => m.materialType.nameEn).join(', ') || 'Pending materials'}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section style={{ background: 'var(--color-surface-card)', borderRadius: 8, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Available Audit Reports (PDF)</h2>
          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !templatesQuery.data?.length}
            style={{ padding: '0.5rem 1rem', borderRadius: 6, background: 'var(--color-action-green)', color: 'var(--color-text-on-dark)', border: 'none', cursor: 'pointer' }}
          >
            {generateMutation.isPending ? 'Generating…' : 'Generate This Quarter’s Report'}
          </button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {reportsQuery.data?.map((r) => (
            <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border-placeholder)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.templateNameEn}{r.audience === 'CLIENT_SELF_SERVICE' ? ' (Provisional)' : ''}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {new Date(r.periodStart).toLocaleDateString('en-HK')} – {new Date(r.periodEnd).toLocaleDateString('en-HK')}
                </div>
              </div>
              {r.generationStatus === 'READY' && (
                <button type="button" onClick={() => download(r.id)} style={{ cursor: 'pointer' }}>Download PDF</button>
              )}
            </li>
          ))}
        </ul>
        {reportsQuery.data?.length === 0 && <p>No reports yet — generate one above.</p>}
      </section>
    </div>
  );
}

function StatTile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div style={{ background: 'var(--color-surface-card)', borderRadius: 8, padding: '1.25rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontSize: '1.9rem', fontWeight: 700 }}>{value}</div>
      {note && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{note}</div>}
    </div>
  );
}
