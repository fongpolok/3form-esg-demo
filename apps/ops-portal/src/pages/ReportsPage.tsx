import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { finalizeReport, generateReport, getReportDownloadUrl, listReportTemplates, listReports } from '../api/reports';
import { useAuth } from '../auth/AuthContext';

const STATUS_LABEL: Record<string, string> = {
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
};

export function ReportsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAuditor = user?.memberships.some((m) => m.role === 'AUDITOR') ?? false;

  const templatesQuery = useQuery({ queryKey: ['report-templates'], queryFn: listReportTemplates });
  const reportsQuery = useQuery({ queryKey: ['reports'], queryFn: () => listReports() });

  const [templateId, setTemplateId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const generateMutation = useMutation({
    mutationFn: () => generateReport({ facilityId: '1', reportTemplateId: templateId, periodStart, periodEnd }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => finalizeReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  async function download(id: string) {
    const { url } = await getReportDownloadUrl(id);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>ESG Reports</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Corporate Compliance &amp; Disclosure Engine</p>

      {isAuditor && (
        <section style={{ background: 'var(--color-surface-card)', padding: '1.25rem', borderRadius: 8, marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Generate New Report</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              generateMutation.mutate();
            }}
            style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
          >
            <div>
              <label htmlFor="template" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Report Type</label>
              <select id="template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} required style={{ padding: '0.5rem' }}>
                <option value="">Select…</option>
                {templatesQuery.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pstart" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Period Start</label>
              <input id="pstart" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required style={{ padding: '0.5rem' }} />
            </div>
            <div>
              <label htmlFor="pend" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Period End</label>
              <input id="pend" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required style={{ padding: '0.5rem' }} />
            </div>
            <button
              type="submit"
              disabled={generateMutation.isPending}
              style={{ padding: '0.6rem 1.2rem', borderRadius: 6, background: 'var(--color-action-green)', color: 'var(--color-text-on-dark)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              {generateMutation.isPending ? 'Generating…' : 'Generate ESG Report'}
            </button>
          </form>
          {generateMutation.isError && (
            <p role="alert" style={{ color: 'var(--color-status-danger-fg)' }}>Could not generate the report — check the period and try again.</p>
          )}
        </section>
      )}

      <section>
        <h2>Generated Reports History</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-placeholder)' }}>
              <th scope="col" style={{ padding: '0.6rem' }}>Type</th>
              <th scope="col" style={{ padding: '0.6rem' }}>Period</th>
              <th scope="col" style={{ padding: '0.6rem' }}>Status</th>
              <th scope="col" style={{ padding: '0.6rem' }}>Generated</th>
              <th scope="col" style={{ padding: '0.6rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reportsQuery.data?.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-placeholder)' }}>
                <td style={{ padding: '0.6rem' }}>{r.audience === 'OFFICIAL' ? r.templateNameEn : `${r.templateNameEn} (Client)`}</td>
                <td style={{ padding: '0.6rem' }}>
                  {new Date(r.periodStart).toLocaleDateString('en-HK')} – {new Date(r.periodEnd).toLocaleDateString('en-HK')}
                </td>
                <td style={{ padding: '0.6rem' }}>
                  {STATUS_LABEL[r.generationStatus] ?? r.generationStatus}
                  {r.reviewStatus ? ` / ${r.reviewStatus}` : ''}
                </td>
                <td style={{ padding: '0.6rem' }}>{new Date(r.generatedAt).toLocaleString('en-HK')}</td>
                <td style={{ padding: '0.6rem', display: 'flex', gap: '0.5rem' }}>
                  {r.generationStatus === 'READY' && (
                    <button type="button" onClick={() => download(r.id)} style={{ cursor: 'pointer' }}>Download</button>
                  )}
                  {isAuditor && r.audience === 'OFFICIAL' && r.reviewStatus === 'DRAFT' && (
                    <button type="button" onClick={() => finalizeMutation.mutate(r.id)} disabled={finalizeMutation.isPending} style={{ cursor: 'pointer' }}>
                      Finalize &amp; Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reportsQuery.data?.length === 0 && <p>No reports generated yet.</p>}
      </section>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
        * Reports automatically align with the HKEX ESG Reporting Guide and GRI Standards framework.
      </p>
    </div>
  );
}
