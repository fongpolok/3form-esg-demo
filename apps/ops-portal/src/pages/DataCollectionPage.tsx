import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createReportingPeriod,
  listCategories,
  listDimensionValues,
  listReportingPeriods,
  listValues,
  recordValue,
  type DimensionValueDto,
  type MetricDefinitionDto,
} from '../api/esg-metrics';

// One <details> per category = the 9-accordion-section pattern from the
// data-collection Figma screen, using the browser's native disclosure
// widget — keyboard-operable and screen-reader-announced with zero extra
// ARIA wiring needed, unlike a hand-rolled accordion.
export function DataCollectionPage() {
  const queryClient = useQueryClient();
  const [periodId, setPeriodId] = useState<string>('');
  const [showNewPeriod, setShowNewPeriod] = useState(false);

  const periodsQuery = useQuery({ queryKey: ['reporting-periods'], queryFn: () => listReportingPeriods('1') });
  const categoriesQuery = useQuery({ queryKey: ['esg-categories'], queryFn: listCategories });
  const dimensionsQuery = useQuery({ queryKey: ['dimension-values'], queryFn: listDimensionValues });
  const valuesQuery = useQuery({
    queryKey: ['metric-values', periodId],
    queryFn: () => listValues(periodId),
    enabled: !!periodId,
  });

  const effectivePeriodId = periodId || periodsQuery.data?.[0]?.id || '';

  // Defaults to the most recent period once periods load, without forcing
  // the user to pick one for the common case.
  useEffect(() => {
    if (!periodId && periodsQuery.data?.[0]?.id) {
      setPeriodId(periodsQuery.data[0].id);
    }
  }, [periodId, periodsQuery.data]);

  const newPeriodMutation = useMutation({
    mutationFn: (input: { periodCode: string; startDate: string; endDate: string }) => createReportingPeriod('1', input),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['reporting-periods'] });
      setPeriodId(created.id);
      setShowNewPeriod(false);
    },
  });

  const valuesByDefinitionCode = new Map((valuesQuery.data ?? []).map((v) => [v.metricDefinitionCode, v]));

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Input ESG Metrics</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            Ensure all records match verified utility bills &amp; logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div>
            <label htmlFor="period-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
              Reporting Period
            </label>
            <select
              id="period-select"
              value={effectivePeriodId}
              onChange={(e) => setPeriodId(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--color-border-placeholder)' }}
            >
              {periodsQuery.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.periodCode}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={() => setShowNewPeriod((s) => !s)} style={{ padding: '0.5rem 0.8rem', borderRadius: 6, border: '1px solid var(--color-border-placeholder)', background: 'var(--color-surface-card)', cursor: 'pointer' }}>
            + New Period
          </button>
        </div>
      </div>

      {showNewPeriod && (
        <NewPeriodForm onSubmit={(input) => newPeriodMutation.mutate(input)} isPending={newPeriodMutation.isPending} />
      )}

      {!effectivePeriodId && <p>Create a reporting period to start entering data.</p>}

      {effectivePeriodId &&
        categoriesQuery.data?.map((category) => (
          <details
            key={category.code}
            open
            style={{ background: 'var(--color-surface-card)', borderRadius: 8, marginBottom: '0.75rem', padding: '0.25rem 1rem' }}
          >
            <summary style={{ cursor: 'pointer', padding: '0.75rem 0', fontWeight: 700 }}>
              {category.nameEn} / {category.nameZh}
            </summary>
            <div style={{ paddingBottom: '1rem' }}>
              {category.metricDefinitions.map((def) => (
                <MetricRow
                  key={def.code}
                  definition={def}
                  current={valuesByDefinitionCode.get(def.code)}
                  dimensionCatalog={dimensionsQuery.data ?? []}
                  reportingPeriodId={effectivePeriodId}
                  onSaved={() => queryClient.invalidateQueries({ queryKey: ['metric-values', effectivePeriodId] })}
                />
              ))}
            </div>
          </details>
        ))}
    </div>
  );
}

function NewPeriodForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (input: { periodCode: string; startDate: string; endDate: string }) => void;
  isPending: boolean;
}) {
  const [periodCode, setPeriodCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ periodCode, startDate, endDate });
      }}
      style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', background: 'var(--color-surface-card)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}
    >
      <div>
        <label htmlFor="np-code" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Period Code</label>
        <input id="np-code" value={periodCode} onChange={(e) => setPeriodCode(e.target.value)} placeholder="Q4 2026" required style={{ padding: '0.4rem' }} />
      </div>
      <div>
        <label htmlFor="np-start" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Start Date</label>
        <input id="np-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ padding: '0.4rem' }} />
      </div>
      <div>
        <label htmlFor="np-end" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>End Date</label>
        <input id="np-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ padding: '0.4rem' }} />
      </div>
      <button type="submit" disabled={isPending} style={{ padding: '0.5rem 1rem', borderRadius: 6, background: 'var(--color-action-green)', color: 'var(--color-text-on-dark)', border: 'none', cursor: 'pointer' }}>
        Create
      </button>
    </form>
  );
}

function MetricRow({
  definition,
  current,
  dimensionCatalog,
  reportingPeriodId,
  onSaved,
}: {
  definition: MetricDefinitionDto;
  current: { numericValue: string | null; textValue: string | null; dimensions: Array<{ type: string; value: string }> } | undefined;
  dimensionCatalog: DimensionValueDto[];
  reportingPeriodId: string;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(current?.numericValue ?? current?.textValue ?? '');
  const [dimensionSelections, setDimensionSelections] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      recordValue(reportingPeriodId, {
        metricDefinitionCode: definition.code,
        ...(definition.valueType === 'TEXT' ? { textValue: value } : { numericValue: Number(value) }),
        dimensions: definition.dimensionTypes
          .filter((t) => dimensionSelections[t])
          .map((t) => ({ dimensionType: t, dimensionValue: dimensionSelections[t]! })),
      }),
    onSuccess: onSaved,
  });

  const codeChips = [definition.griCode, definition.hkexCode].filter(Boolean);

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', padding: '0.6rem 0', borderTop: '1px solid var(--color-border-placeholder)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          {definition.nameEn}{' '}
          {codeChips.map((c) => (
            <span key={c} style={{ background: 'var(--color-status-success-bg)', color: 'var(--color-status-success-fg)', borderRadius: 4, padding: '0 5px', fontSize: '0.7rem', marginLeft: 4 }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{definition.nameZh}</div>
      </div>
      {definition.dimensionTypes.map((dimType) => {
        const options = dimensionCatalog.find((d) => d.type === dimType)?.values ?? [];
        return (
          <div key={dimType}>
            <label htmlFor={`${definition.code}-${dimType}`} style={{ display: 'block', fontSize: '0.75rem' }}>
              {dimType.replace(/_/g, ' ')}
            </label>
            <select
              id={`${definition.code}-${dimType}`}
              value={dimensionSelections[dimType] ?? ''}
              onChange={(e) => setDimensionSelections((s) => ({ ...s, [dimType]: e.target.value }))}
              style={{ padding: '0.4rem', fontSize: '0.85rem' }}
            >
              <option value="">—</option>
              {options.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.nameEn}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      <div>
        <label htmlFor={`${definition.code}-value`} style={{ display: 'block', fontSize: '0.75rem' }}>
          {definition.defaultUnit ?? 'Value'}
        </label>
        {definition.valueType === 'TEXT' ? (
          <input id={`${definition.code}-value`} value={value} onChange={(e) => setValue(e.target.value)} style={{ padding: '0.4rem', width: 220 }} />
        ) : (
          <input id={`${definition.code}-value`} type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} style={{ padding: '0.4rem', width: 140 }} />
        )}
      </div>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={!value || mutation.isPending}
        style={{ padding: '0.45rem 0.9rem', borderRadius: 6, background: 'var(--color-navy-800)', color: 'var(--color-text-on-dark)', border: 'none', cursor: 'pointer' }}
      >
        Save
      </button>
    </div>
  );
}
