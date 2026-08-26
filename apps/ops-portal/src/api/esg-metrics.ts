import type { RecordMetricValueInput } from '@esg/shared-validation';
import { apiFetch } from './client';

export interface MetricDefinitionDto {
  code: string;
  griCode: string | null;
  hkexCode: string | null;
  nameEn: string;
  nameZh: string;
  valueType: 'NUMERIC' | 'TEXT' | 'COUNT';
  defaultUnit: string | null;
  isDerived: boolean;
  dimensionTypes: string[];
}

export interface MetricCategoryDto {
  code: string;
  nameEn: string;
  nameZh: string;
  metricDefinitions: MetricDefinitionDto[];
}

export interface DimensionValueDto {
  type: string;
  values: Array<{ code: string; nameEn: string; nameZh: string }>;
}

export interface ReportingPeriodDto {
  id: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface MetricValueDto {
  id: string;
  metricDefinitionCode: string;
  categoryCode: string;
  nameEn: string;
  nameZh: string;
  numericValue: string | null;
  textValue: string | null;
  unit: string | null;
  source: string;
  dimensions: Array<{ type: string; value: string }>;
  enteredAt: string;
  notes: string | null;
}

export function listCategories(): Promise<MetricCategoryDto[]> {
  return apiFetch('/esg-metrics/categories');
}

export function listDimensionValues(): Promise<DimensionValueDto[]> {
  return apiFetch('/esg-metrics/dimension-values');
}

export function listReportingPeriods(facilityId: string): Promise<ReportingPeriodDto[]> {
  return apiFetch(`/esg-metrics/reporting-periods?facilityId=${facilityId}`);
}

export function createReportingPeriod(
  facilityId: string,
  input: { periodCode: string; startDate: string; endDate: string },
): Promise<{ id: string }> {
  return apiFetch(`/esg-metrics/reporting-periods?facilityId=${facilityId}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listValues(reportingPeriodId: string): Promise<MetricValueDto[]> {
  return apiFetch(`/esg-metrics/reporting-periods/${reportingPeriodId}/values`);
}

export function recordValue(reportingPeriodId: string, input: RecordMetricValueInput) {
  return apiFetch(`/esg-metrics/reporting-periods/${reportingPeriodId}/values`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
