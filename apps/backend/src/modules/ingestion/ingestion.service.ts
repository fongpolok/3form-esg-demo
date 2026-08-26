import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { DeviceReadingInput, RegisterDeviceInput } from '@esg/shared-validation';
import { DeviceReadingIngestedEvent, DEVICE_READING_INGESTED_EVENT } from './device-reading-ingested.event';

@Injectable()
export class IngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async registerDevice(input: RegisterDeviceInput) {
    const apiKey = crypto.randomBytes(24).toString('base64url');
    const apiKeyHash = await argon2.hash(apiKey);

    const device = await this.prisma.device.create({
      data: {
        facility_id: BigInt(input.facilityId),
        device_type: input.deviceType,
        device_code: input.deviceCode,
        purpose: input.purpose,
        is_simulated: input.isSimulated,
        api_key_hash: apiKeyHash,
      },
    });

    // The plaintext key is shown exactly once, at creation — same pattern
    // as a GitHub PAT or AWS access key. Only the hash is ever persisted.
    return { id: device.id.toString(), deviceCode: device.device_code, apiKey };
  }

  async listDevices(facilityId: string) {
    const rows = await this.prisma.device.findMany({ where: { facility_id: BigInt(facilityId) } });
    return rows.map((d) => ({
      id: d.id.toString(),
      deviceCode: d.device_code,
      deviceType: d.device_type,
      purpose: d.purpose,
      isSimulated: d.is_simulated,
      status: d.status,
    }));
  }

  // Authenticates the device by its plaintext key against the stored hash
  // (device-token auth, plan §5 — deliberately separate from JwtAuthGuard's
  // user-session auth, since this endpoint is called by hardware/the
  // simulator, never a logged-in person).
  async authenticateDevice(deviceCode: string, apiKey: string) {
    const device = await this.prisma.device.findUnique({ where: { device_code: deviceCode } });
    if (!device || device.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'INGESTION.UNKNOWN_DEVICE' });
    }
    const valid = await argon2.verify(device.api_key_hash, apiKey);
    if (!valid) throw new UnauthorizedException({ code: 'INGESTION.INVALID_DEVICE_KEY' });
    return device;
  }

  async ingestReading(deviceCode: string, apiKey: string, input: DeviceReadingInput) {
    const device = await this.authenticateDevice(deviceCode, apiKey);

    if (device.device_type === 'WEIGHT_SCALE' && input.readingType !== 'INLET_WEIGHT' && input.readingType !== 'OUTLET_WEIGHT') {
      throw new BadRequestException({ code: 'INGESTION.READING_TYPE_MISMATCH' });
    }
    if (device.device_type === 'CV_CAMERA' && input.readingType !== 'CV_OBJECT_DETECTED') {
      throw new BadRequestException({ code: 'INGESTION.READING_TYPE_MISMATCH' });
    }

    const workOrderId = input.workOrderId ? BigInt(input.workOrderId) : null;

    if (device.device_type === 'WEIGHT_SCALE') {
      // Upsert-by-readingUuid: a device retrying a failed POST must not
      // create a duplicate reading (plan §5's idempotency requirement).
      await this.prisma.weightReading.upsert({
        where: { reading_uuid: input.readingUuid },
        create: {
          reading_uuid: input.readingUuid,
          work_order_id: workOrderId,
          device_id: device.id,
          reading_type: input.readingType === 'INLET_WEIGHT' ? 'INLET' : 'OUTLET',
          weight_kg: input.value,
          reading_at: new Date(input.capturedAt),
          source: device.is_simulated ? 'SIMULATED' : 'REAL',
        },
        update: {},
      });
    } else {
      await this.prisma.cvReading.upsert({
        where: { reading_uuid: input.readingUuid },
        create: {
          reading_uuid: input.readingUuid,
          work_order_id: workOrderId,
          device_id: device.id,
          object_class: input.objectClass,
          confidence: input.confidence,
          estimated_weight_kg: input.unit === 'KG' ? input.value : undefined,
          captured_at: new Date(input.capturedAt),
          source: device.is_simulated ? 'SIMULATED' : 'REAL',
        },
        update: {},
      });
    }

    this.events.emit(
      DEVICE_READING_INGESTED_EVENT,
      new DeviceReadingIngestedEvent(
        input.readingUuid,
        device.id.toString(),
        device.facility_id.toString(),
        input.readingType,
        workOrderId?.toString() ?? null,
      ),
    );

    return { accepted: true };
  }
}
