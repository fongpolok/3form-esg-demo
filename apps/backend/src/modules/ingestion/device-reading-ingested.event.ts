export const DEVICE_READING_INGESTED_EVENT = 'device-reading.ingested';

export class DeviceReadingIngestedEvent {
  constructor(
    public readonly readingUuid: string,
    public readonly deviceId: string,
    public readonly facilityId: string,
    public readonly readingType: 'INLET_WEIGHT' | 'OUTLET_WEIGHT' | 'CV_OBJECT_DETECTED',
    public readonly workOrderId: string | null,
  ) {}
}
