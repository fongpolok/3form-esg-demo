import { z } from 'zod';

export const emissionFactorCategorySchema = z.enum([
  'GRID_EMISSION_FACTOR',
  'FUEL_EMISSION_FACTOR',
  'GWP_REFRIGERANT',
  'UNIT_CONVERSION',
  'ENVIRONMENTAL_EQUIVALENCY',
]);
export type EmissionFactorCategory = z.infer<typeof emissionFactorCategorySchema>;

// Admin-only (plan §3d, §7: Auditor-only Settings screen). Creating a
// version never overwrites an existing row — see EmissionFactorsService.
export const createEmissionFactorVersionSchema = z.object({
  category: emissionFactorCategorySchema,
  code: z.string().min(1),
  utilityCode: z.string().optional(),
  fuelTypeCode: z.string().optional(),
  refrigerantTypeCode: z.string().optional(),
  vehicleTypeCode: z.string().optional(),
  materialTypeCode: z.string().optional(),
  scopeExtra: z.record(z.string()).optional(),
  factorValue: z.coerce.number(),
  factorUnit: z.string().min(1),
  effectiveFrom: z.string().min(1),
  sourceReference: z.string().max(2000).optional(),
});
export type CreateEmissionFactorVersionInput = z.infer<typeof createEmissionFactorVersionSchema>;
