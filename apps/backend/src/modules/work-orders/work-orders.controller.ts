import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  addWorkOrderMaterialSchema,
  createTransportTripSchema,
  createWorkOrderSchema,
  recordProcessedMaterialSchema,
  updateWorkOrderStatusSchema,
  type AddWorkOrderMaterialInput,
  type CreateTransportTripInput,
  type CreateWorkOrderInput,
  type RecordProcessedMaterialInput,
  type UpdateWorkOrderStatusInput,
} from '@esg/shared-validation';
import { CurrentScope } from '../../common/decorators/current-scope.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser, TenantScope } from '../../common/types/authenticated-user';
import { WorkOrdersService } from './work-orders.service';

// Data-entry roles only — CLIENT_USER never gets a write endpoint here at
// all (plan §3a), matching how OrgController gates its writes.
const WRITE_ROLES = ['AUDITOR', 'SUPPLIER_ADMIN', 'SUPPLIER_STAFF'] as const;

@ApiTags('work-orders')
@ApiBearerAuth()
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrders: WorkOrdersService) {}

  @Get()
  list(@CurrentScope() scope: TenantScope, @Query('status') status?: string, @Query('clientId') clientId?: string) {
    return this.workOrders.list(scope, { status, clientId });
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentScope() scope: TenantScope) {
    return this.workOrders.getById(id, scope);
  }

  // Each ZodValidationPipe is bound to its @Body() parameter specifically —
  // a method-level @UsePipes() here would run the same schema against
  // every parameter (facilityId, scope, user too), not just the body, and
  // reject the request as missing fields that were never meant to be in it.
  @Post()
  @Roles(...WRITE_ROLES)
  create(
    @Body(new ZodValidationPipe(createWorkOrderSchema)) body: CreateWorkOrderInput,
    @Query('facilityId') facilityId: string | undefined,
    @CurrentScope() scope: TenantScope,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.create(body, facilityId, scope, user.id);
  }

  @Patch(':id/status')
  @Roles(...WRITE_ROLES)
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWorkOrderStatusSchema)) body: UpdateWorkOrderStatusInput,
    @CurrentScope() scope: TenantScope,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.updateStatus(id, body, scope, user.id);
  }

  @Post(':id/materials')
  @Roles(...WRITE_ROLES)
  addMaterial(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addWorkOrderMaterialSchema)) body: AddWorkOrderMaterialInput,
    @CurrentScope() scope: TenantScope,
  ) {
    return this.workOrders.addMaterial(id, body, scope);
  }

  @Post(':id/processed-material')
  @Roles(...WRITE_ROLES)
  recordProcessedMaterial(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordProcessedMaterialSchema)) body: RecordProcessedMaterialInput,
    @CurrentScope() scope: TenantScope,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.recordProcessedMaterial(id, body, scope, user.id);
  }

  @Post(':id/transport-trips')
  @Roles(...WRITE_ROLES)
  addTransportTrip(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createTransportTripSchema)) body: CreateTransportTripInput,
    @CurrentScope() scope: TenantScope,
  ) {
    return this.workOrders.addTransportTrip(id, body, scope);
  }
}

@ApiTags('work-orders')
@ApiBearerAuth()
@Controller('material-types')
export class MaterialTypesController {
  constructor(private readonly workOrders: WorkOrdersService) {}

  @Get()
  list() {
    return this.workOrders.listMaterialTypes();
  }
}
