import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createEmissionFactorVersionSchema, type CreateEmissionFactorVersionInput } from '@esg/shared-validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { EmissionFactorsService } from './emission-factors.service';

// Auditor-only end to end: these numbers affect every facility's
// compliance reporting, not just one supplier's own data (plan §3d).
@ApiTags('emission-factors')
@ApiBearerAuth()
@Controller('emission-factors')
export class EmissionFactorsController {
  constructor(private readonly emissionFactors: EmissionFactorsService) {}

  @Get()
  @Roles('AUDITOR')
  list() {
    return this.emissionFactors.list();
  }

  @Post()
  @Roles('AUDITOR')
  createVersion(
    @Body(new ZodValidationPipe(createEmissionFactorVersionSchema)) body: CreateEmissionFactorVersionInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emissionFactors.createVersion(body, user.id);
  }
}
