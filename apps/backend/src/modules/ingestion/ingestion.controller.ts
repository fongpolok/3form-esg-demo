import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { deviceReadingSchema, registerDeviceSchema, type DeviceReadingInput, type RegisterDeviceInput } from '@esg/shared-validation';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  @Get('devices')
  @ApiBearerAuth()
  @Roles('AUDITOR', 'SUPPLIER_ADMIN', 'SUPPLIER_STAFF')
  listDevices(@Query('facilityId') facilityId: string) {
    return this.ingestion.listDevices(facilityId);
  }

  @Post('devices')
  @ApiBearerAuth()
  @Roles('AUDITOR', 'SUPPLIER_ADMIN')
  registerDevice(@Body(new ZodValidationPipe(registerDeviceSchema)) body: RegisterDeviceInput) {
    return this.ingestion.registerDevice(body);
  }

  // Device-token auth, not user JWT — this is the endpoint a real weight
  // scale/CV camera (or apps/simulator standing in for one) POSTs to
  // (plan §5). @Public() skips JwtAuthGuard; the X-Device-Key header is
  // verified against the device's own stored key hash instead.
  @Public()
  @Post('readings')
  ingestReading(
    @Headers('x-device-key') deviceKey: string | undefined,
    @Body(new ZodValidationPipe(deviceReadingSchema)) body: DeviceReadingInput,
  ) {
    if (!deviceKey) {
      throw new UnauthorizedException({ code: 'INGESTION.MISSING_DEVICE_KEY' });
    }
    return this.ingestion.ingestReading(body.deviceCode, deviceKey, body);
  }
}
