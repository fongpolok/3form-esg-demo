import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Input,
  Label,
} from '@esg/ui';
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
  const categoriesWithData = categoriesQuery.data?.filter((c) => c.metricDefinitions.length > 0) ?? [];

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#1e293b]">Input ESG Metrics</h1>
          <p className="text-sm text-[#627288]">Ensure all records match verified utility bills &amp; logs.</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="period-select" className="text-xs">
              Reporting Period
            </Label>
            <select
              id="period-select"
              value={effectivePeriodId}
              onChange={(e) => setPeriodId(e.target.value)}
              className="rounded-md border border-[#d1d6e0] bg-white px-3 py-2 text-sm"
            >
              {periodsQuery.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.periodCode}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowNewPeriod((s) => !s)}>
            + New Period
          </Button>
        </div>
      </div>

      {showNewPeriod && (
        <NewPeriodForm onSubmit={(input) => newPeriodMutation.mutate(input)} isPending={newPeriodMutation.isPending} />
      )}

      {!effectivePeriodId && <p className="text-sm text-[#627288]">Create a reporting period to start entering data.</p>}

      {effectivePeriodId && (
        <Accordion type="multiple" defaultValue={categoriesWithData.map((c) => c.code)} className="flex flex-col gap-3">
          {categoriesWithData.map((category) => {
            const complete = category.metricDefinitions.every((d) => valuesByDefinitionCode.has(d.code));
            return (
              <AccordionItem key={category.code} value={category.code} className="rounded-lg border-none bg-white px-4 shadow-sm">
                <AccordionTrigger className="text-base font-bold hover:no-underline">
                  <span className="flex items-center gap-2">
                    {complete && <CheckCircle className="size-5 text-[#00a878]" aria-hidden="true" />}
                    {category.nameEn} / {category.nameZh}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col">
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
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
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
      className="mb-4 flex items-end gap-3 rounded-lg bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="np-code" className="text-xs">
          Period Code
        </Label>
        <Input id="np-code" value={periodCode} onChange={(e) => setPeriodCode(e.target.value)} placeholder="Q4 2026" required className="w-32" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="np-start" className="text-xs">
          Start Date
        </Label>
        <Input id="np-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="np-end" className="text-xs">
          End Date
        </Label>
        <Input id="np-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
      </div>
      <Button type="submit" disabled={isPending}>
        Create
      </Button>
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
    <div className="flex flex-wrap items-end gap-4 border-t border-[#f0f0f0] py-3 first:border-t-0">
      <div className="min-w-[200px] flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1e293b]">
          {definition.nameEn}
          {codeChips.map((c) => (
            <span key={c} className="rounded bg-[var(--color-status-success-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-status-success-fg)]">
              {c}
            </span>
          ))}
        </div>
        <div className="text-xs text-[#627288]">{definition.nameZh}</div>
      </div>
      {definition.dimensionTypes.map((dimType) => {
        const options = dimensionCatalog.find((d) => d.type === dimType)?.values ?? [];
        return (
          <div key={dimType} className="flex flex-col gap-1">
            <Label htmlFor={`${definition.code}-${dimType}`} className="text-[11px]">
              {dimType.replace(/_/g, ' ')}
            </Label>
            <select
              id={`${definition.code}-${dimType}`}
              value={dimensionSelections[dimType] ?? ''}
              onChange={(e) => setDimensionSelections((s) => ({ ...s, [dimType]: e.target.value }))}
              className="rounded-md border border-[#d1d6e0] px-2 py-1.5 text-sm"
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
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${definition.code}-value`} className="text-[11px]">
          {definition.defaultUnit ?? 'Value'}
        </Label>
        {definition.valueType === 'TEXT' ? (
          <Input id={`${definition.code}-value`} value={value} onChange={(e) => setValue(e.target.value)} className="w-56" />
        ) : (
          <Input id={`${definition.code}-value`} type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} className="w-36" />
        )}
      </div>
      <Button type="button" variant="secondary" onClick={() => mutation.mutate()} disabled={!value || mutation.isPending}>
        Save
      </Button>
    </div>
  );
}
