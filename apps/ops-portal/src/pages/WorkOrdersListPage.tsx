import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';
import type { WorkOrderStatus } from '@esg/shared-types';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@esg/ui';
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
  const [search, setSearch] = useState('');
  const { data: workOrders, isLoading, isError } = useQuery({
    queryKey: ['work-orders', status],
    queryFn: () => listWorkOrders({ status: status || undefined }),
  });

  const filtered = workOrders?.filter(
    (wo) =>
      !search ||
      wo.wipNo.toLowerCase().includes(search.toLowerCase()) ||
      (wo.clientName ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1e293b]">Active Shipments &amp; MES Logs</h1>
          <p className="text-sm text-[#627288]">Audited tracking for industrial recycling workflows</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/work-orders/new">
            <PlusCircle className="size-4" aria-hidden="true" />
            Create New Work Order
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
          <label htmlFor="wo-search" className="sr-only">
            Search by work order number or client
          </label>
          <input
            id="wo-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search WO# or Client"
            className="rounded-md border border-[#d1d6e0] bg-[#f8fafc] py-1.5 pl-8 pr-3 text-sm"
          />
        </div>
        <label htmlFor="status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as WorkOrderStatus | '')}
          className="rounded-md border border-[#d1d6e0] px-3 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <p role="status" className="text-sm text-[#627288]">
          Loading work orders…
        </p>
      )}
      {isError && (
        <p role="alert" className="text-sm text-[var(--color-status-danger-fg)]">
          Could not load work orders.
        </p>
      )}

      {filtered && filtered.length === 0 && <p className="text-sm text-[#627288]">No work orders match.</p>}

      {filtered && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <Table>
            <caption className="sr-only">List of work orders with their client, material, weight, and status</caption>
            <TableHeader>
              <TableRow>
                <TableHead>WO#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Material Type</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell className="font-semibold">
                    <Link to={`/work-orders/${wo.id}`} className="text-[#0c63e4] hover:underline">
                      #{wo.wipNo}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(wo.wipDate).toLocaleDateString('en-HK')}</TableCell>
                  <TableCell>{wo.clientName ?? '—'}</TableCell>
                  <TableCell>{wo.materials.map((m) => m.materialType.nameEn).join(', ') || '—'}</TableCell>
                  <TableCell className="font-semibold">
                    {wo.materials.reduce((sum, m) => sum + Number(m.weightKg), 0).toLocaleString('en-HK')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={wo.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
