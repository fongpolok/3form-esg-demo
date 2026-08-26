import { z } from 'zod';

// Mirrors work_orders.status in schema.prisma — the WIP flow from the PPT
// (WIP Generation -> Received -> Processing -> Processed -> Completion) as
// concretely named on the work-order-mes Figma screen's kanban strip.
export const workOrderStatusSchema = z.enum([
  'ORDER_RECEIVED',
  'PICKUP_SCHEDULED',
  'IN_TRANSIT',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
]);
export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>;

// "WIP Generation" — client info, date, time; wip_no is server-generated.
export const createWorkOrderSchema = z.object({
  clientId: z.string().min(1).optional(),
  wipDate: z.string().min(1, 'Date is required'),
  wipTime: z.string().min(1, 'Time is required'),
});
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const updateWorkOrderStatusSchema = z.object({
  status: workOrderStatusSchema,
  note: z.string().max(2000).optional(),
});
export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusSchema>;

// "Received Material to be Processed"
export const addWorkOrderMaterialSchema = z.object({
  materialTypeId: z.string().min(1, 'Material type is required'),
  weightKg: z.coerce.number().positive('Weight must be greater than zero'),
  productType: z.string().max(200).optional(),
});
export type AddWorkOrderMaterialInput = z.infer<typeof addWorkOrderMaterialSchema>;

// "Processed Material" — completes the work order.
export const recordProcessedMaterialSchema = z.object({
  outputWeightKg: z.coerce.number().nonnegative(),
  scrapWeightKg: z.coerce.number().nonnegative(),
});
export type RecordProcessedMaterialInput = z.infer<typeof recordProcessedMaterialSchema>;

export const vehicleTypeSchema = z.enum([
  'MOTORCYCLE',
  'PASSENGER_CAR',
  'PRIVATE_VAN',
  'PUBLIC_LIGHT_BUS',
  'LIGHT_GOODS_VEHICLE',
  'HEAVY_GOODS_VEHICLE',
  'MEDIUM_GOODS_VEHICLE',
]);
export const fuelTypeSchema = z.enum(['PETROL', 'DIESEL', 'LPG']);

export const createTransportTripSchema = z.object({
  vehicleType: vehicleTypeSchema,
  fuelType: fuelTypeSchema,
  distanceKm: z.coerce.number().nonnegative().optional(),
  fuelConsumptionLitres: z.coerce.number().nonnegative().optional(),
  pickupLocation: z.string().max(300).optional(),
  dropoffLocation: z.string().max(300).optional(),
  furtherDestination: z.string().max(300).optional(),
  tripDate: z.string().min(1, 'Trip date is required'),
});
export type CreateTransportTripInput = z.infer<typeof createTransportTripSchema>;
