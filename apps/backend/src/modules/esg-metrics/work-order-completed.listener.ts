import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { WORK_ORDER_COMPLETED_EVENT, WorkOrderCompletedEvent } from '../work-orders/work-order-completed.event';
import { EsgMetricsService } from './esg-metrics.service';

// The recycling facility's own material_type codes -> the ESG catalog's
// WASTE_TYPE dimension codes. MIXED_EWASTE deliberately has no mapping —
// the client's spreadsheet's non-hazardous waste breakdown only covers
// paper/metal/plastic; e-waste doesn't fit that dimension and is left for
// an auditor to record manually under the appropriate category instead of
// this listener guessing.
const MATERIAL_TO_WASTE_TYPE: Record<string, string> = {
  PAPER_CARDBOARD: 'PAPER',
  INDUSTRIAL_METALS: 'METAL',
  LDPE_PLASTICS: 'PLASTIC',
};

// Listens for WorkOrdersModule's completion event and writes ONE new
// CALCULATED metric_values row per completion — deliberately not an
// accumulating running total (plan §3c's append-only model applies here
// too): each work order contributes its own independently-traceable row
// (source_work_order_id links back to it), and totals are summed at
// report-generation time (Phase 4) rather than maintained as mutable state
// here. This keeps this listener simple and avoids read-modify-write races
// between two work orders completing close together.
@Injectable()
export class WorkOrderCompletedListener {
  private readonly logger = new Logger(WorkOrderCompletedListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly esgMetrics: EsgMetricsService,
  ) {}

  @OnEvent(WORK_ORDER_COMPLETED_EVENT)
  async handle(event: WorkOrderCompletedEvent) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: BigInt(event.workOrderId) },
      include: { materials: { include: { material_type: true } }, processed_material: true },
    });
    if (!workOrder || !workOrder.processed_material) return;

    // Simplification (documented, not silent): a work order's
    // processed_material only records one combined output/scrap weight for
    // the whole order, not a per-material-type breakdown, so when multiple
    // material types were logged this listener attributes the full output
    // to the first one. Most demo/PoC work orders log exactly one material
    // type, where this is exact rather than approximate.
    const primaryMaterial = workOrder.materials[0];
    if (!primaryMaterial) return;

    const wasteTypeCode = MATERIAL_TO_WASTE_TYPE[primaryMaterial.material_type.code];
    if (!wasteTypeCode) {
      this.logger.debug(
        `No WASTE_TYPE mapping for material ${primaryMaterial.material_type.code} — skipping auto-derivation for work order ${event.workOrderId}`,
      );
      return;
    }

    const definition = await this.prisma.metricDefinition.findUnique({ where: { code: 'WASTE_NONHAZ_QUANTITY' } });
    const kgUnit = await this.prisma.unit.findUnique({ where: { code: 'KG' } });
    const wasteTypeValue = await this.resolveDimensionValue('WASTE_TYPE', wasteTypeCode);
    const recycledHandling = await this.resolveDimensionValue('HANDLING_METHOD', 'RECYCLED');
    if (!definition || !kgUnit || !wasteTypeValue || !recycledHandling) {
      this.logger.warn('ESG metric catalog is missing an expected row — skipping auto-derivation');
      return;
    }

    const reportingPeriod = await this.esgMetrics.findOrCreateCurrentReportingPeriod(BigInt(event.facilityId));

    await this.prisma.$transaction(async (tx) => {
      const metricValue = await tx.metricValue.create({
        data: {
          reporting_period_id: reportingPeriod.id,
          facility_id: BigInt(event.facilityId),
          client_id: event.clientId ? BigInt(event.clientId) : null,
          metric_definition_id: definition.id,
          numeric_value: workOrder.processed_material!.output_weight_kg,
          unit_id: kgUnit.id,
          source: 'CALCULATED',
          source_work_order_id: BigInt(event.workOrderId),
          entered_by_user_id: workOrder.created_by_user_id,
        },
      });
      await tx.metricValueDimension.createMany({
        data: [
          { metric_value_id: metricValue.id, dimension_type_id: wasteTypeValue.dimension_type_id, dimension_value_id: wasteTypeValue.id },
          { metric_value_id: metricValue.id, dimension_type_id: recycledHandling.dimension_type_id, dimension_value_id: recycledHandling.id },
        ],
      });
    });

    this.logger.log(`Derived ${definition.code} metric from completed work order ${event.workOrderId}`);
  }

  private async resolveDimensionValue(dimensionTypeCode: string, valueCode: string) {
    const dimType = await this.prisma.dimensionType.findUnique({ where: { code: dimensionTypeCode } });
    if (!dimType) return null;
    return this.prisma.dimensionValue.findUnique({
      where: { dimension_type_id_code: { dimension_type_id: dimType.id, code: valueCode } },
    });
  }
}
