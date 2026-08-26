import * as crypto from 'node:crypto';

// The adapter contract from plan §5: a mock source and a future real device
// both implement this interface, so swapping hardware in later is a config
// change (devices.is_simulated=false + a real API key), not a rewrite.
// Mirrors packages/shared-validation/src/ingestion.ts's deviceReadingSchema
// on the backend.
export interface DeviceReadingDTO {
  readingUuid: string;
  deviceCode: string;
  readingType: 'INLET_WEIGHT' | 'OUTLET_WEIGHT' | 'CV_OBJECT_DETECTED';
  workOrderId?: string;
  value: number;
  unit: 'KG' | 'COUNT';
  confidence?: number;
  objectClass?: string;
  imageRef?: string;
  capturedAt: string;
}

export interface IDeviceSource {
  readonly deviceCode: string;
  generateReading(): DeviceReadingDTO;
}

// Weighing chemical/recycled-material input — a plausible weight in the
// range real work orders in the seed data use (hundreds to low thousands
// of kg), not a fixed constant, so a live dashboard shows visible movement.
export class MockWeightScaleSource implements IDeviceSource {
  constructor(
    public readonly deviceCode: string,
    private readonly readingType: 'INLET_WEIGHT' | 'OUTLET_WEIGHT',
  ) {}

  generateReading(): DeviceReadingDTO {
    const weightKg = Math.round((200 + Math.random() * 4800) * 100) / 100;
    return {
      readingUuid: crypto.randomUUID(),
      deviceCode: this.deviceCode,
      readingType: this.readingType,
      value: weightKg,
      unit: 'KG',
      capturedAt: new Date().toISOString(),
    };
  }
}

const OBJECT_CLASSES = ['paper_bale', 'metal_scrap', 'plastic_bale', 'e-waste_item'];

// Stands in for "identify presence of object + read weight via computer
// vision" (plan Context section's hardware list).
export class MockCvCameraSource implements IDeviceSource {
  constructor(public readonly deviceCode: string) {}

  generateReading(): DeviceReadingDTO {
    const objectClass = OBJECT_CLASSES[Math.floor(Math.random() * OBJECT_CLASSES.length)]!;
    const confidence = Math.round((0.75 + Math.random() * 0.24) * 1000) / 1000;
    const estimatedWeightKg = Math.round((50 + Math.random() * 950) * 100) / 100;
    return {
      readingUuid: crypto.randomUUID(),
      deviceCode: this.deviceCode,
      readingType: 'CV_OBJECT_DETECTED',
      value: estimatedWeightKg,
      unit: 'KG',
      confidence,
      objectClass,
      capturedAt: new Date().toISOString(),
    };
  }
}
