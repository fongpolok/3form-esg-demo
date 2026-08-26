import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantScope } from '../../common/types/authenticated-user';
import {
  workOrderStatusSchema,
  type AddWorkOrderMaterialInput,
  type CreateTransportTripInput,
  type CreateWorkOrderInput,
  type RecordProcessedMaterialInput,
  type UpdateWorkOrderStatusInput,
} from '@esg/shared-validation';
import type { WorkOrderDetailDto, WorkOrderListItemDto } from '@esg/shared-types';
import { WorkOrderCompletedEvent, WORK_ORDER_COMPLETED_EVENT } from './work-order-completed.event';

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

const listItemInclude = {
  client: true,
  materials: { include: { material_type: true } },
} satisfies Prisma.WorkOrderInclude;

const detailInclude = {
  ...listItemInclude,
  stage_events: { orderBy: { occurred_at: 'asc' as const } },
  processed_material: true,
} satisfies Prisma.WorkOrderInclude;

type ListItemRow = Prisma.WorkOrderGetPayload<{ include: typeof listItemInclude }>;
type DetailRow = Prisma.WorkOrderGetPayload<{ include: typeof detailInclude }>;

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async list(scope: TenantScope, filters: { status?: string; clientId?: string }): Promise<WorkOrderListItemDto[]> {
    const statusResult = filters.status ? workOrderStatusSchema.safeParse(filters.status) : undefined;
    if (statusResult && !statusResult.success) {
      throw new BadRequestException({ code: 'VALIDATION.INVALID_STATUS' });
    }
    const status = statusResult?.data;
    const rows = await this.prisma.workOrder.findMany({
      where: {
        ...this.scopeWhere(scope),
        ...(status ? { status } : {}),
        ...(filters.clientId ? { client_id: BigInt(filters.clientId) } : {}),
      },
      include: listItemInclude,
      orderBy: { created_at: 'desc' },
    });
    return rows.map((row) => this.toListItemDto(row));
  }

  async getById(id: string, scope: TenantScope): Promise<WorkOrderDetailDto> {
    const row = await this.prisma.workOrder.findUnique({
      where: { id: BigInt(id) },
      include: detailInclude,
    });
    if (!row || !this.isInScope(row, scope)) {
      throw new NotFoundException({ code: 'WORK_ORDER.NOT_FOUND' });
    }
    return this.toDetailDto(row);
  }

  async create(input: CreateWorkOrderInput, facilityIdInput: string | undefined, scope: TenantScope, userId: string) {
    const facilityId = this.resolveFacilityForWrite(facilityIdInput, scope);

    if (input.clientId && !scope.isGlobal) {
      // A supplier user may only attach a work order to a client that
      // actually belongs to their own facility's supplier — cheap sanity
      // check now rather than trusting client-supplied IDs blindly.
      const client = await this.prisma.client.findUnique({ where: { id: BigInt(input.clientId) } });
      const facility = await this.prisma.facility.findUnique({ where: { id: BigInt(facilityId) } });
      if (!client || !facility || client.supplier_id !== facility.supplier_id) {
        throw new ForbiddenException({ code: 'WORK_ORDER.CLIENT_OUTSIDE_SUPPLIER' });
      }
    }

    const wipNo = await this.generateWipNo();

    const workOrder = await this.prisma.workOrder.create({
      data: {
        facility_id: BigInt(facilityId),
        client_id: input.clientId ? BigInt(input.clientId) : null,
        wip_no: wipNo,
        wip_date: new Date(input.wipDate),
        wip_time: new Date(`1970-01-01T${input.wipTime}:00Z`),
        status: 'ORDER_RECEIVED',
        created_by_user_id: BigInt(userId),
        stage_events: {
          create: { stage: 'ORDER_RECEIVED', actor_user_id: BigInt(userId) },
        },
      },
      include: detailInclude,
    });
    return this.toDetailDto(workOrder);
  }

  async updateStatus(id: string, input: UpdateWorkOrderStatusInput, scope: TenantScope, userId: string) {
    const existing = await this.requireInScope(id, scope);
    if (TERMINAL_STATUSES.has(existing.status)) {
      throw new BadRequestException({ code: 'WORK_ORDER.ALREADY_TERMINAL' });
    }

    await this.prisma.workOrder.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        stage_events: {
          create: { stage: input.status, actor_user_id: BigInt(userId), note: input.note },
        },
      },
    });
    return this.getById(id, scope);
  }

  async addMaterial(id: string, input: AddWorkOrderMaterialInput, scope: TenantScope) {
    const existing = await this.requireInScope(id, scope);
    if (TERMINAL_STATUSES.has(existing.status)) {
      throw new BadRequestException({ code: 'WORK_ORDER.ALREADY_TERMINAL' });
    }

    await this.prisma.workOrderMaterial.create({
      data: {
        work_order_id: existing.id,
        material_type_id: BigInt(input.materialTypeId),
        weight_kg: input.weightKg,
        product_type: input.productType,
        source: 'MANUAL',
      },
    });
    return this.getById(id, scope);
  }

  // "Processed Material" — the WIP Completion step (plan §3b / the PPT's
  // flow diagram): recording this always finalizes the work order.
  async recordProcessedMaterial(id: string, input: RecordProcessedMaterialInput, scope: TenantScope, userId: string) {
    const existing = await this.requireInScope(id, scope);
    if (TERMINAL_STATUSES.has(existing.status)) {
      throw new BadRequestException({ code: 'WORK_ORDER.ALREADY_TERMINAL' });
    }

    await this.prisma.$transaction([
      this.prisma.processedMaterial.upsert({
        where: { work_order_id: existing.id },
        create: {
          work_order_id: existing.id,
          output_weight_kg: input.outputWeightKg,
          scrap_weight_kg: input.scrapWeightKg,
        },
        update: {
          output_weight_kg: input.outputWeightKg,
          scrap_weight_kg: input.scrapWeightKg,
        },
      }),
      this.prisma.workOrder.update({
        where: { id: existing.id },
        data: {
          status: 'COMPLETED',
          stage_events: {
            create: { stage: 'COMPLETED', actor_user_id: BigInt(userId) },
          },
        },
      }),
    ]);

    this.events.emit(
      WORK_ORDER_COMPLETED_EVENT,
      new WorkOrderCompletedEvent(id, existing.facility_id.toString(), existing.client_id?.toString() ?? null),
    );

    return this.getById(id, scope);
  }

  async addTransportTrip(id: string, input: CreateTransportTripInput, scope: TenantScope) {
    const existing = await this.requireInScope(id, scope);
    await this.prisma.transportTrip.create({
      data: {
        work_order_id: existing.id,
        facility_id: existing.facility_id,
        vehicle_type: input.vehicleType,
        fuel_type: input.fuelType,
        distance_km: input.distanceKm,
        fuel_consumption_litres: input.fuelConsumptionLitres,
        pickup_location: input.pickupLocation,
        dropoff_location: input.dropoffLocation,
        further_destination: input.furtherDestination,
        trip_date: new Date(input.tripDate),
      },
    });
    return this.getById(id, scope);
  }

  async listMaterialTypes() {
    const rows = await this.prisma.materialType.findMany({ orderBy: { name_en: 'asc' } });
    return rows.map((r) => ({ id: r.id.toString(), code: r.code, nameEn: r.name_en, nameZh: r.name_zh }));
  }

  // --- internals ---

  private scopeWhere(scope: TenantScope): Prisma.WorkOrderWhereInput {
    if (scope.isGlobal) return {};
    return {
      OR: [
        { facility_id: { in: scope.facilityIds.map(BigInt) } },
        { client_id: { in: scope.clientIds.map(BigInt) } },
      ],
    };
  }

  private isInScope(row: { facility_id: bigint; client_id: bigint | null }, scope: TenantScope): boolean {
    if (scope.isGlobal) return true;
    const facilityMatch = scope.facilityIds.includes(row.facility_id.toString());
    const clientMatch = row.client_id !== null && scope.clientIds.includes(row.client_id.toString());
    return facilityMatch || clientMatch;
  }

  private async requireInScope(id: string, scope: TenantScope) {
    const row = await this.prisma.workOrder.findUnique({ where: { id: BigInt(id) } });
    if (!row || !this.isInScope(row, scope)) {
      throw new NotFoundException({ code: 'WORK_ORDER.NOT_FOUND' });
    }
    return row;
  }

  // AUDITOR (global scope) has no implicit facility, so must say which one;
  // a supplier user with access to exactly one facility gets it as the
  // default so the create form doesn't need a facility picker for the
  // common case (plan §7: ops-portal is used by supplier staff scoped to
  // their own single facility).
  private resolveFacilityForWrite(facilityIdInput: string | undefined, scope: TenantScope): string {
    if (facilityIdInput) {
      if (!scope.isGlobal && !scope.facilityIds.includes(facilityIdInput)) {
        throw new ForbiddenException({ code: 'ORG.OUTSIDE_SCOPE' });
      }
      return facilityIdInput;
    }
    if (scope.isGlobal) {
      throw new BadRequestException({ code: 'WORK_ORDER.FACILITY_ID_REQUIRED' });
    }
    if (scope.facilityIds.length !== 1) {
      throw new BadRequestException({ code: 'WORK_ORDER.FACILITY_ID_REQUIRED' });
    }
    return scope.facilityIds[0]!;
  }

  private async generateWipNo(): Promise<string> {
    const count = await this.prisma.workOrder.count();
    const candidate = `WO-${9000 + count + 1}`;
    const clash = await this.prisma.workOrder.findUnique({ where: { wip_no: candidate } });
    // Extremely unlikely at PoC scale, but count()-based generation isn't
    // safe under real concurrency — fall back to a timestamp suffix rather
    // than let a genuine race surface as an opaque unique-constraint 500.
    return clash ? `WO-${9000 + count + 1}-${Date.now().toString(36)}` : candidate;
  }

  private toListItemDto(row: ListItemRow): WorkOrderListItemDto {
    return {
      id: row.id.toString(),
      wipNo: row.wip_no,
      wipDate: row.wip_date.toISOString(),
      status: row.status,
      clientName: row.client?.name_en ?? null,
      materials: row.materials.map((m) => ({
        id: m.id.toString(),
        materialType: {
          id: m.material_type.id.toString(),
          code: m.material_type.code,
          nameEn: m.material_type.name_en,
          nameZh: m.material_type.name_zh,
        },
        weightKg: m.weight_kg.toString(),
        productType: m.product_type,
        recordedAt: m.recorded_at.toISOString(),
      })),
    };
  }

  private toDetailDto(row: DetailRow): WorkOrderDetailDto {
    return {
      ...this.toListItemDto(row),
      facilityId: row.facility_id.toString(),
      clientId: row.client_id?.toString() ?? null,
      wipTime: row.wip_time.toISOString(),
      stageEvents: row.stage_events.map((e) => ({
        id: e.id.toString(),
        stage: e.stage,
        occurredAt: e.occurred_at.toISOString(),
        note: e.note,
      })),
      processedMaterial: row.processed_material
        ? {
            id: row.processed_material.id.toString(),
            outputWeightKg: row.processed_material.output_weight_kg.toString(),
            scrapWeightKg: row.processed_material.scrap_weight_kg.toString(),
            recordedAt: row.processed_material.recorded_at.toISOString(),
          }
        : null,
    };
  }
}
