import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmissionFactorCategory } from '@esg/shared-validation';
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
        <h1>Settings</h1>
        <p>Only Auditors can manage emission factors. Other settings land in a later phase.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Settings — Emission Factors</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Tunable parameters used across every report and derived metric (plan §3d) — versioned, never overwritten in place.
      </p>

      <section style={{ background: 'var(--color-surface-card)', padding: '1.25rem', borderRadius: 8, marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Add New Version</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <div>
            <label htmlFor="ef-category" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
            <select id="ef-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as EmissionFactorCategory }))} style={{ padding: '0.4rem' }}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ef-code" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Code</label>
            <input id="ef-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required style={{ padding: '0.4rem', width: 160 }} />
          </div>
          <div>
            <label htmlFor="ef-value" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Value</label>
            <input id="ef-value" type="number" step="any" value={form.factorValue} onChange={(e) => setForm((f) => ({ ...f, factorValue: e.target.value }))} required style={{ padding: '0.4rem', width: 120 }} />
          </div>
          <div>
            <label htmlFor="ef-unit" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Unit</label>
            <input id="ef-unit" value={form.factorUnit} onChange={(e) => setForm((f) => ({ ...f, factorUnit: e.target.value }))} placeholder="kgCO2e/kWh" required style={{ padding: '0.4rem', width: 140 }} />
          </div>
          <div>
            <label htmlFor="ef-from" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Effective From</label>
            <input id="ef-from" type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} required style={{ padding: '0.4rem' }} />
          </div>
          <div style={{ flex: '1 1 260px' }}>
            <label htmlFor="ef-source" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Source Reference</label>
            <input id="ef-source" value={form.sourceReference} onChange={(e) => setForm((f) => ({ ...f, sourceReference: e.target.value }))} style={{ padding: '0.4rem', width: '100%' }} />
          </div>
          <button type="submit" disabled={mutation.isPending} style={{ padding: '0.5rem 1rem', borderRadius: 6, background: 'var(--color-action-green)', color: 'var(--color-text-on-dark)', border: 'none', cursor: 'pointer' }}>
            Save New Version
          </button>
        </form>
      </section>

      <section>
        <h2>Current &amp; Historical Factors</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-placeholder)' }}>
              <th scope="col" style={{ padding: '0.5rem' }}>Code</th>
              <th scope="col" style={{ padding: '0.5rem' }}>Value</th>
              <th scope="col" style={{ padding: '0.5rem' }}>Effective From</th>
              <th scope="col" style={{ padding: '0.5rem' }}>Effective To</th>
              <th scope="col" style={{ padding: '0.5rem' }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {factorsQuery.data?.map((f) => (
              <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border-placeholder)', opacity: f.effectiveTo ? 0.55 : 1 }}>
                <td style={{ padding: '0.5rem' }}>{f.code}</td>
                <td style={{ padding: '0.5rem' }}>{f.factorValue} {f.factorUnit}</td>
                <td style={{ padding: '0.5rem' }}>{new Date(f.effectiveFrom).toLocaleDateString('en-HK')}</td>
                <td style={{ padding: '0.5rem' }}>{f.effectiveTo ? new Date(f.effectiveTo).toLocaleDateString('en-HK') : 'current'}</td>
                <td style={{ padding: '0.5rem', maxWidth: 320 }}>{f.sourceReference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
