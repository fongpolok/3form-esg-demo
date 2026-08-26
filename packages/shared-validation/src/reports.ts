import { z } from 'zod';

// clientId absent = OFFICIAL (Auditor-triggered, full-facility); clientId
// present = CLIENT_SELF_SERVICE, scoped to that client (plan §6). The
// controller decides which based on the caller's role, not a client-
// supplied "audience" field, so a client can never request an OFFICIAL report.
export const generateReportSchema = z.object({
  facilityId: z.string().min(1),
  clientId: z.string().optional(),
  reportTemplateId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
