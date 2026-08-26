import { z } from 'zod';

export const createReportingPeriodSchema = z.object({
  periodCode: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
export type CreateReportingPeriodInput = z.infer<typeof createReportingPeriodSchema>;

const dimensionTagSchema = z.object({
  dimensionType: z.string().min(1),
  dimensionValue: z.string().min(1),
});

// A metric value is either numeric or free text (metric_definitions.value_type
// decides which) — the API accepts both fields and the service validates
// the one matching the definition's declared type. reportingPeriodId is
// NOT here — it comes from the URL path (POST /reporting-periods/:id/values),
// not the body.
export const recordMetricValueSchema = z.object({
  metricDefinitionCode: z.string().min(1),
  numericValue: z.coerce.number().optional(),
  textValue: z.string().optional(),
  unitCode: z.string().optional(),
  dimensions: z.array(dimensionTagSchema).optional(),
  notes: z.string().max(2000).optional(),
  correctionReason: z.string().max(500).optional(),
});
export type RecordMetricValueInput = z.infer<typeof recordMetricValueSchema>;
