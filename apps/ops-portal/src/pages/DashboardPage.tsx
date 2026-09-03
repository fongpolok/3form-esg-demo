import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { FileText, Layers, CloudLightning, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@esg/ui';
import { listWorkOrders } from '../api/work-orders';
import { StatusBadge } from '../components/StatusBadge';

// Two real charts built from actual work-order data — not the Figma
// mockup's "Waste Processing Trend" / "Energy Consumption" / "ESG
// Compliance Score" widgets, which show fixed illustrative numbers with no
// real computation behind them. Trend-over-time and an aggregate ESG score
// both need historical data this PoC doesn't have enough of yet to chart
// honestly; status/material breakdowns are real today.
const STATUS_LABELS: Record<string, string> = {
  ORDER_RECEIVED: 'Order Received',
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  IN_TRANSIT: 'In Transit',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PIE_COLORS = ['#00a878', '#0d6efd', '#f59e0b', '#1b355a', '#de3545', '#64748b'];

const statusChartConfig = { count: { label: 'Work Orders' } } satisfies ChartConfig;
const materialChartConfig = { kg: { label: 'Weight (kg)' } } satisfies ChartConfig;

export function DashboardPage() {
  const { data: workOrders, isLoading } = useQuery({ queryKey: ['work-orders', ''], queryFn: () => listWorkOrders() });

  const total = workOrders?.length ?? 0;
  const active = workOrders?.filter((w) => !['COMPLETED', 'CANCELLED'].includes(w.status)).length ?? 0;
  const completed = workOrders?.filter((w) => w.status === 'COMPLETED').length ?? 0;
  const totalWeightKg = workOrders?.reduce((sum, w) => sum + w.materials.reduce((s, m) => s + Number(m.weightKg), 0), 0) ?? 0;

  const statusData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const wo of workOrders ?? []) counts.set(wo.status, (counts.get(wo.status) ?? 0) + 1);
    return [...counts.entries()].map(([status, count]) => ({ status: STATUS_LABELS[status] ?? status, count }));
  }, [workOrders]);

  const materialData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const wo of workOrders ?? []) {
      for (const m of wo.materials) {
        totals.set(m.materialType.nameEn, (totals.get(m.materialType.nameEn) ?? 0) + Number(m.weightKg));
      }
    }
    return [...totals.entries()].map(([name, kg]) => ({ name, kg: Math.round(kg) }));
  }, [workOrders]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[#1e293b]">Hong Kong Recycling Co — ESG Dashboard</h1>
      <p className="mb-6 text-sm text-[#627288]">Hong Kong Processing Plant #1 (Tsing Yi)</p>
      {isLoading && (
        <p role="status" className="text-sm text-[#627288]">
          Loading…
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total Work Orders" value={total} />
        <StatCard icon={Layers} label="Active Jobs" value={active} />
        <StatCard icon={CloudLightning} label="Material Processed" value={`${totalWeightKg.toLocaleString('en-HK')} kg`} />
        <StatCard icon={Clock} label="Completed" value={completed} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Work Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-[#627288]">No work orders yet.</p>
            ) : (
              // role="img" + aria-label summary + the visually-hidden table
              // below give screen-reader users the real numbers, not a
              // canvas description (plan §8's chart-accessibility pattern).
              <div role="img" aria-label={`Work order counts by status: ${statusData.map((d) => `${d.status} ${d.count}`).join(', ')}`}>
                <ChartContainer config={statusChartConfig} className="h-[240px] w-full">
                  <BarChart data={statusData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#10233d" radius={4} />
                  </BarChart>
                </ChartContainer>
                <table className="sr-only">
                  <caption>Work order counts by status</caption>
                  <thead>
                    <tr>
                      <th scope="col">Status</th>
                      <th scope="col">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusData.map((d) => (
                      <tr key={d.status}>
                        <td>{d.status}</td>
                        <td>{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Materials Recycled by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {materialData.length === 0 ? (
              <p className="text-sm text-[#627288]">No materials logged yet.</p>
            ) : (
              <div role="img" aria-label={`Material weight by type: ${materialData.map((d) => `${d.name} ${d.kg}kg`).join(', ')}`}>
                <ChartContainer config={materialChartConfig} className="mx-auto h-[240px] w-full max-w-[320px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={materialData} dataKey="kg" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {materialData.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <ul className="sr-only">
                  {materialData.map((d) => (
                    <li key={d.name}>
                      {d.name}: {d.kg} kg
                    </li>
                  ))}
                </ul>
                <ul className="mt-2 flex flex-wrap justify-center gap-3">
                  {materialData.map((d, i) => (
                    <li key={d.name} className="flex items-center gap-1.5 text-xs text-[#627288]">
                      <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} aria-hidden="true" />
                      {d.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[#d1d6e0] text-left text-xs font-semibold uppercase text-[#627288]">
                <th scope="col" className="py-2">
                  WO#
                </th>
                <th scope="col" className="py-2">
                  Client
                </th>
                <th scope="col" className="py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {workOrders?.slice(0, 5).map((w) => (
                <tr key={w.id} className="border-b border-[#f0f0f0]">
                  <td className="py-2.5">#{w.wipNo}</td>
                  <td className="py-2.5">{w.clientName ?? '—'}</td>
                  <td className="py-2.5">
                    <StatusBadge status={w.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string | number }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex items-start justify-between pt-6">
        <div>
          <p className="text-[13px] font-semibold text-[#1e293b]">{label}</p>
          <p className="mt-1.5 text-[28px] font-bold text-[#1e293b]">{value}</p>
        </div>
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#f8fafc]">
          <Icon className="size-4 text-[#627288]" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
