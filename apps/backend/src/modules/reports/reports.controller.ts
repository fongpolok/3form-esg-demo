import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { generateReportSchema, type GenerateReportInput } from '@esg/shared-validation';
import { CurrentScope } from '../../common/decorators/current-scope.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser, TenantScope } from '../../common/types/authenticated-user';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('templates')
  listTemplates() {
    return this.reports.listTemplates();
  }

  @Get()
  list(@CurrentScope() scope: TenantScope, @Query('facilityId') facilityId?: string, @Query('clientId') clientId?: string) {
    return this.reports.list(scope, { facilityId, clientId });
  }

  // Must be declared before @Get(':id') — otherwise Nest's route matching
  // would treat "client-impact-summary" as an :id value.
  @Get('client-impact-summary')
  getClientImpactSummary(
    @Query('facilityId') facilityId: string,
    @Query('clientId') clientId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
    @CurrentScope() scope: TenantScope,
  ) {
    return this.reports.getClientImpactSummary(facilityId, clientId, periodStart, periodEnd, scope);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentScope() scope: TenantScope) {
    return this.reports.getById(id, scope);
  }

  @Get(':id/download')
  getDownloadUrl(@Param('id') id: string, @CurrentScope() scope: TenantScope) {
    return this.reports.getDownloadUrl(id, scope);
  }

  // Only AUDITOR and CLIENT_USER can reach this at all — SUPPLIER staff
  // don't generate reports in this design (plan §6: OFFICIAL is
  // Auditor-triggered, CLIENT_SELF_SERVICE is client-triggered). Which of
  // the two a given request produces is decided inside the service from
  // whether clientId was supplied and who the caller actually is, not
  // trusted blindly from the request body.
  @Post()
  @Roles('AUDITOR', 'CLIENT_USER')
  generate(
    @Body(new ZodValidationPipe(generateReportSchema)) body: GenerateReportInput,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentScope() scope: TenantScope,
  ) {
    return this.reports.generate(body, user, scope);
  }

  @Post(':id/finalize')
  @Roles('AUDITOR')
  finalize(@Param('id') id: string, @CurrentScope() scope: TenantScope) {
    return this.reports.finalize(id, scope);
  }
}
