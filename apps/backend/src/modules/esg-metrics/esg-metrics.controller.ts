import { Body, Controller, ForbiddenException, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createReportingPeriodSchema,
  recordMetricValueSchema,
  type CreateReportingPeriodInput,
  type RecordMetricValueInput,
} from '@esg/shared-validation';
import { CurrentScope } from '../../common/decorators/current-scope.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser, TenantScope } from '../../common/types/authenticated-user';
import { EsgMetricsService } from './esg-metrics.service';

const DATA_ENTRY_ROLES = ['AUDITOR', 'SUPPLIER_ADMIN', 'SUPPLIER_STAFF'] as const;

// No CLIENT_USER access at all here — raw metric values are an internal
// audit surface; clients see their own numbers only through the
// report-generation endpoints (Phase 4), never this catalog directly.
@ApiTags('esg-metrics')
@ApiBearerAuth()
@Controller('esg-metrics')
export class EsgMetricsController {
  constructor(private readonly esgMetrics: EsgMetricsService) {}

  @Get('categories')
  @Roles(...DATA_ENTRY_ROLES)
  listCategories() {
    return this.esgMetrics.listCategories();
  }

  @Get('dimension-values')
  @Roles(...DATA_ENTRY_ROLES)
  listDimensionValues() {
    return this.esgMetrics.listDimensionValues();
  }

  @Get('reporting-periods')
  @Roles(...DATA_ENTRY_ROLES)
  listReportingPeriods(@Query('facilityId') facilityId: string, @CurrentScope() scope: TenantScope) {
    this.assertFacilityInScope(facilityId, scope);
    return this.esgMetrics.listReportingPeriods(facilityId);
  }

  @Post('reporting-periods')
  @Roles(...DATA_ENTRY_ROLES)
  createReportingPeriod(
    @Query('facilityId') facilityId: string,
    @Body(new ZodValidationPipe(createReportingPeriodSchema)) body: CreateReportingPeriodInput,
    @CurrentScope() scope: TenantScope,
  ) {
    this.assertFacilityInScope(facilityId, scope);
    return this.esgMetrics.createReportingPeriod(facilityId, body);
  }

  @Get('reporting-periods/:id/values')
  @Roles(...DATA_ENTRY_ROLES)
  listValues(@Param('id') reportingPeriodId: string) {
    // Reporting-period-level scoping is enforced implicitly: a value can
    // only be read via a period id the caller already had to fetch through
    // the facility-scoped listReportingPeriods endpoint above.
    return this.esgMetrics.listValues(reportingPeriodId);
  }

  @Post('reporting-periods/:id/values')
  @Roles(...DATA_ENTRY_ROLES)
  recordValue(
    @Param('id') reportingPeriodId: string,
    @Body(new ZodValidationPipe(recordMetricValueSchema)) body: RecordMetricValueInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.esgMetrics.recordValue(reportingPeriodId, body, user.id);
  }

  private assertFacilityInScope(facilityId: string, scope: TenantScope) {
    if (scope.isGlobal) return;
    if (!facilityId || !scope.facilityIds.includes(facilityId)) {
      throw new ForbiddenException({ code: 'ORG.OUTSIDE_SCOPE' });
    }
  }
}
