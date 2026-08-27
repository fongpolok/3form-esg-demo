import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from 'recharts';
import { Recycle, Cloud, TrendingUp, Package, Download } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@esg/ui';
import { useAuth } from '../auth/AuthContext';
import { getClientImpactSummary, generateSelfServiceReport, getReportDownloadUrl, listReports, listReportTemplates } from '../api/reports';
import { listWorkOrders } from '../api/work-orders';

const FACILITY_ID = '1'; // single-facility PoC; a facility picker is a Phase-6+ multi-tenant concern.
const PIE_COLORS = ['#00a878', '#0d6efd', '#f59e0b', '#1b355a', '#de3545', '#64748b'];
const materialChartConfig = { kg: { label: 'kg' } } satisfies ChartConfig;

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
  const breakdown = summaryQuery.data?.materialsBreakdown ?? [];

  return (
    <div>
      <h1 className="mb-1 text-[28px] font-bold text-[#1e293b]">Your ESG Performance Dashboard</h1>
      <p className="mb-6 text-sm text-[#627288]">Live ecological metrics and waste recovery tracking.</p>

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Recycle} iconColor="#00a878" label="Total Waste Recycled" value={`${(summaryQuery.data?.totalRecycledKg ?? 0).toLocaleString('en-HK')} kg`} note="This quarter" />
        <StatTile
          icon={Cloud}
          iconColor="#0d6efd"
          label="Carbon Offset"
          value={`${((summaryQuery.data?.co2SavedKg ?? 0) / 1000).toLocaleString('en-HK', { maximumFractionDigits: 2 })} t CO2e`}
          note={`Equivalent to ${summaryQuery.data?.treesSaved ?? 0} trees`}
        />
        <StatTile icon={TrendingUp} iconColor="#00a878" label="Recycling Rate" value={recyclingRate !== null ? `${recyclingRate}%` : '—'} note="Recycled ÷ received" />
        <StatTile icon={Package} iconColor="#f59e0b" label="Active Work Orders" value={activeWorkOrders.length} note="Currently in process" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Materials Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length === 0 ? (
              <p className="text-sm text-[#627288]">No recycled materials recorded for this quarter yet.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-6">
                <div role="img" aria-label={`Materials breakdown: ${breakdown.map((d) => `${d.wasteType} ${d.percent}%`).join(', ')}`}>
                  <ChartContainer config={materialChartConfig} className="h-[180px] w-[180px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie data={breakdown} dataKey="kg" nameKey="wasteType" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {breakdown.map((entry, i) => (
                          <Cell key={entry.wasteType} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <ul className="flex-1 min-w-[180px]">
                  {breakdown.map((m, i) => (
                    <li key={m.wasteType} className="flex items-center justify-between border-t border-[#f0f0f0] py-2 text-sm first:border-t-0">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} aria-hidden="true" />
                        {m.wasteType}
                      </span>
                      <span>
                        {m.kg.toLocaleString('en-HK')} kg ({m.percent}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Active Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {activeWorkOrders.length === 0 && <p className="text-sm text-[#627288]">None right now.</p>}
            <ul>
              {activeWorkOrders.map((w) => (
                <li key={w.id} className="border-t border-[#f0f0f0] py-2.5 text-sm first:border-t-0">
                  <strong>#{w.wipNo}</strong> — {w.materials.map((m) => m.materialType.nameEn).join(', ') || 'Pending materials'}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {breakdown.length > 0 && (
        <Card className="mb-6 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recycled Weight by Material</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={materialChartConfig} className="h-[200px] w-full">
              <BarChart data={breakdown}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="wasteType" tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="kg" radius={4}>
                  {breakdown.map((entry, i) => (
                    <Cell key={entry.wasteType} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Available Audit Reports (PDF)</CardTitle>
          <Button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !templatesQuery.data?.length}
          >
            {generateMutation.isPending ? 'Generating…' : 'Generate This Quarter’s Report'}
          </Button>
        </CardHeader>
        <CardContent>
          <ul>
            {reportsQuery.data?.map((r) => (
              <li key={r.id} className="flex items-center justify-between border-t border-[#f0f0f0] py-3 text-sm first:border-t-0">
                <div>
                  <div className="font-semibold">
                    {r.templateNameEn}
                    {r.audience === 'CLIENT_SELF_SERVICE' ? ' (Provisional)' : ''}
                  </div>
                  <div className="text-xs text-[#627288]">
                    {new Date(r.periodStart).toLocaleDateString('en-HK')} – {new Date(r.periodEnd).toLocaleDateString('en-HK')}
                  </div>
                </div>
                {r.generationStatus === 'READY' && (
                  <Button type="button" size="sm" variant="outline" onClick={() => download(r.id)} className="gap-1.5">
                    <Download className="size-3.5" aria-hidden="true" />
                    Download PDF
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {reportsQuery.data?.length === 0 && <p className="py-2 text-sm text-[#627288]">No reports yet — generate one above.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon: Icon,
  iconColor,
  label,
  value,
  note,
}: {
  icon: typeof Recycle;
  iconColor: string;
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-[#1e293b]">{label}</p>
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#f8fafc]">
            <Icon className="size-3.5" style={{ color: iconColor }} aria-hidden="true" />
          </div>
        </div>
        <p className="text-[32px] font-bold text-[#1e293b]">{value}</p>
        {note && <p className="text-xs text-[#627288]">{note}</p>}
      </CardContent>
    </Card>
  );
}
