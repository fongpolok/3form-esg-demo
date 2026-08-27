import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@esg/ui';
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
    <div className="max-w-4xl">
      <h1 className="text-[22px] font-bold text-[#1e293b]">ESG Reports</h1>
      <p className="mb-6 text-sm text-[#627288]">Corporate Compliance &amp; Disclosure Engine</p>

      {isAuditor && (
        <Card className="mb-6 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Generate New Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateMutation.mutate();
              }}
              className="flex flex-wrap items-end gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="template">Report Type</Label>
                <select id="template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} required className="rounded-md border border-[#d1d6e0] px-3 py-2 text-sm">
                  <option value="">Select…</option>
                  {templatesQuery.data?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pstart">Period Start</Label>
                <Input id="pstart" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pend">Period End</Label>
                <Input id="pend" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
              </div>
              <Button type="submit" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Generating…' : 'Generate ESG Report'}
              </Button>
              <span className="text-xs text-[#627288]">Est. ~30 seconds</span>
            </form>
            {generateMutation.isError && (
              <p role="alert" className="mt-2 text-sm text-[var(--color-status-danger-fg)]">
                Could not generate the report — check the period and try again.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Generated Reports History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Wide content must scroll inside its own container, not clip
              against the Card — the same fix WorkOrdersListPage already
              has; this table needed it too (found by actually looking at
              a screenshot, not by lint/typecheck, which can't catch this). */}
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportsQuery.data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.audience === 'OFFICIAL' ? r.templateNameEn : `${r.templateNameEn} (Client)`}</TableCell>
                  <TableCell>
                    {new Date(r.periodStart).toLocaleDateString('en-HK')} – {new Date(r.periodEnd).toLocaleDateString('en-HK')}
                  </TableCell>
                  <TableCell>
                    {STATUS_LABEL[r.generationStatus] ?? r.generationStatus}
                    {r.reviewStatus ? ` / ${r.reviewStatus}` : ''}
                  </TableCell>
                  <TableCell>{new Date(r.generatedAt).toLocaleString('en-HK')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {r.generationStatus === 'READY' && (
                        <Button type="button" size="sm" variant="outline" onClick={() => download(r.id)} className="gap-1.5">
                          <Download className="size-3.5" aria-hidden="true" />
                          Download
                        </Button>
                      )}
                      {isAuditor && r.audience === 'OFFICIAL' && r.reviewStatus === 'DRAFT' && (
                        <Button type="button" size="sm" onClick={() => finalizeMutation.mutate(r.id)} disabled={finalizeMutation.isPending}>
                          Finalize &amp; Publish
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {reportsQuery.data?.length === 0 && <p className="py-4 text-sm text-[#627288]">No reports generated yet.</p>}
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-[#627288]">
        * Reports automatically align with the HKEX ESG Reporting Guide and GRI Standards framework.
      </p>
    </div>
  );
}
