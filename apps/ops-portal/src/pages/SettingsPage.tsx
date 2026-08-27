import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmissionFactorCategory } from '@esg/shared-validation';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@esg/ui';
import { createEmissionFactorVersion, listEmissionFactors } from '../api/emission-factors';
import { useAuth } from '../auth/AuthContext';

const CATEGORY_OPTIONS: EmissionFactorCategory[] = [
  'GRID_EMISSION_FACTOR',
  'FUEL_EMISSION_FACTOR',
  'GWP_REFRIGERANT',
  'UNIT_CONVERSION',
  'ENVIRONMENTAL_EQUIVALENCY',
];

// Auditor-only (plan §3d, §7) — every other role gets a 403 from the API
// even if they somehow reach this route, but the nav item is also hidden
// from them (see Layout) so this is defense in depth, not the only gate.
export function SettingsPage() {
  const { user } = useAuth();
  const isAuditor = user?.memberships.some((m) => m.role === 'AUDITOR') ?? false;
  const queryClient = useQueryClient();
  const factorsQuery = useQuery({ queryKey: ['emission-factors'], queryFn: listEmissionFactors, enabled: isAuditor });

  const [form, setForm] = useState({ category: 'GRID_EMISSION_FACTOR' as EmissionFactorCategory, code: '', utilityCode: '', factorValue: '', factorUnit: '', effectiveFrom: '', sourceReference: '' });

  const mutation = useMutation({
    mutationFn: () =>
      createEmissionFactorVersion({
        category: form.category,
        code: form.code,
        utilityCode: form.utilityCode || undefined,
        factorValue: Number(form.factorValue),
        factorUnit: form.factorUnit,
        effectiveFrom: form.effectiveFrom,
        sourceReference: form.sourceReference || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emission-factors'] }),
  });

  if (!isAuditor) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-[#1e293b]">Settings</h1>
        <p className="text-sm text-[#627288]">Only Auditors can manage emission factors. Other settings land in a later phase.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-[22px] font-bold text-[#1e293b]">Settings — Emission Factors</h1>
      <p className="mb-6 text-sm text-[#627288]">
        Tunable parameters used across every report and derived metric — versioned, never overwritten in place.
      </p>

      <Card className="mb-6 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Add New Version</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ef-category" className="text-xs">
                Category
              </Label>
              <select id="ef-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as EmissionFactorCategory }))} className="rounded-md border border-[#d1d6e0] px-2 py-2 text-sm">
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ef-code" className="text-xs">
                Code
              </Label>
              <Input id="ef-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required className="w-40" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ef-value" className="text-xs">
                Value
              </Label>
              <Input id="ef-value" type="number" step="any" value={form.factorValue} onChange={(e) => setForm((f) => ({ ...f, factorValue: e.target.value }))} required className="w-28" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ef-unit" className="text-xs">
                Unit
              </Label>
              <Input id="ef-unit" value={form.factorUnit} onChange={(e) => setForm((f) => ({ ...f, factorUnit: e.target.value }))} placeholder="kgCO2e/kWh" required className="w-36" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ef-from" className="text-xs">
                Effective From
              </Label>
              <Input id="ef-from" type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} required />
            </div>
            <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
              <Label htmlFor="ef-source" className="text-xs">
                Source Reference
              </Label>
              <Input id="ef-source" value={form.sourceReference} onChange={(e) => setForm((f) => ({ ...f, sourceReference: e.target.value }))} />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              Save New Version
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Current &amp; Historical Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factorsQuery.data?.map((f) => (
                <TableRow key={f.id} className={f.effectiveTo ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{f.code}</TableCell>
                  <TableCell>
                    {f.factorValue} {f.factorUnit}
                  </TableCell>
                  <TableCell>{new Date(f.effectiveFrom).toLocaleDateString('en-HK')}</TableCell>
                  <TableCell>{f.effectiveTo ? new Date(f.effectiveTo).toLocaleDateString('en-HK') : 'current'}</TableCell>
                  <TableCell className="max-w-[280px] text-xs text-[#627288]">{f.sourceReference}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
