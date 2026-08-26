// Explicit named re-exports, not `export *` — the barrel-via-export-star
// pattern compiles to a dynamic __exportStar(require(...)) call in
// CommonJS, which Rollup's CJS-to-ESM interop (used when Vite bundles
// apps/ops-portal and apps/client-portal) cannot statically resolve into
// named imports ("X is not exported by dist/index.js"). Named re-exports
// compile to direct property getters instead, which Rollup can follow.
export { loginSchema, refreshTokenSchema } from './auth';
export type { LoginInput, RefreshTokenInput } from './auth';

export {
  workOrderStatusSchema,
  createWorkOrderSchema,
  updateWorkOrderStatusSchema,
  addWorkOrderMaterialSchema,
  recordProcessedMaterialSchema,
  vehicleTypeSchema,
  fuelTypeSchema,
  createTransportTripSchema,
} from './work-orders';
export type {
  WorkOrderStatus,
  CreateWorkOrderInput,
  UpdateWorkOrderStatusInput,
  AddWorkOrderMaterialInput,
  RecordProcessedMaterialInput,
  CreateTransportTripInput,
} from './work-orders';

export { emissionFactorCategorySchema, createEmissionFactorVersionSchema } from './emission-factors';
export type { EmissionFactorCategory, CreateEmissionFactorVersionInput } from './emission-factors';

export { createReportingPeriodSchema, recordMetricValueSchema } from './esg-metrics';
export type { CreateReportingPeriodInput, RecordMetricValueInput } from './esg-metrics';

export { deviceReadingSchema, registerDeviceSchema } from './ingestion';
export type { DeviceReadingInput, RegisterDeviceInput } from './ingestion';

export { generateReportSchema } from './reports';
export type { GenerateReportInput } from './reports';
