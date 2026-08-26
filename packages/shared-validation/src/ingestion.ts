import { z } from 'zod';

// Mirrors apps/simulator/src/device-source.ts's DeviceReadingDTO — the one
// contract both the mock simulator and any future real weight-scale/camera
// device POST to (plan §5). Kept here so the simulator and backend share
// the exact same validation instead of two hand-maintained copies drifting.
export const deviceReadingSchema = z.object({
  readingUuid: z.string().uuid(),
  deviceCode: z.string().min(1),
  readingType: z.enum(['INLET_WEIGHT', 'OUTLET_WEIGHT', 'CV_OBJECT_DETECTED']),
  workOrderId: z.string().optional(),
  value: z.coerce.number(),
  unit: z.enum(['KG', 'COUNT']),
  confidence: z.coerce.number().min(0).max(1).optional(),
  objectClass: z.string().optional(),
  imageRef: z.string().optional(),
  capturedAt: z.string().min(1),
});
export type DeviceReadingInput = z.infer<typeof deviceReadingSchema>;

export const registerDeviceSchema = z.object({
  facilityId: z.string().min(1),
  deviceType: z.enum(['WEIGHT_SCALE', 'CV_CAMERA']),
  purpose: z.enum(['INLET', 'OUTLET', 'PROCESS_MONITOR']),
  deviceCode: z.string().min(1),
  isSimulated: z.boolean().default(true),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
