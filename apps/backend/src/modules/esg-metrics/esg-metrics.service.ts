import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecordMetricValueInput } from '@esg/shared-validation';

@Injectable()
export class EsgMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  // The 9-section data-collection form (plan §7) is built from this: every
  // category with its metric definitions and the GRI/HKEX code chips.
  async listCategories() {
    const categories = await this.prisma.metricCategory.findMany({
      orderBy: { sort_order: 'asc' },
      include: {
        metric_definitions: {
          include: { default_unit: true, dimensions: { include: { dimension_type: true } } },
        },
      },
    });
    return categories.map((cat) => ({
      code: cat.code,
      nameEn: cat.name_en,
      nameZh: cat.name_zh,
      metricDefinitions: cat.metric_definitions.map((def) => ({
        code: def.code,
        griCode: def.gri_code,
        hkexCode: def.hkex_code,
        nameEn: def.name_en,
        nameZh: def.name_zh,
        valueType: def.value_type,
        defaultUnit: def.default_unit?.code ?? null,
        isDerived: def.is_derived,
        dimensionTypes: def.dimensions.map((d) => d.dimension_type.code),
      })),
    }));
  }

  async listDimensionValues() {
    const types = await this.prisma.dimensionType.findMany({ include: { values: true } });
    return types.map((t) => ({
      type: t.code,
      values: t.values.map((v) => ({ code: v.code, nameEn: v.name_en, nameZh: v.name_zh })),
    }));
  }

  async listReportingPeriods(facilityId: string) {
    const rows = await this.prisma.reportingPeriod.findMany({
      where: { facility_id: BigInt(facilityId) },
      orderBy: { start_date: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id.toString(),
      periodCode: r.period_code,
      startDate: r.start_date.toISOString(),
      endDate: r.end_date.toISOString(),
      status: r.status,
    }));
  }

  async createReportingPeriod(facilityId: string, input: { periodCode: string; startDate: string; endDate: string }) {
    const row = await this.prisma.reportingPeriod.create({
      data: {
        facility_id: BigInt(facilityId),
        period_code: input.periodCode,
        start_date: new Date(input.startDate),
        end_date: new Date(input.endDate),
        status: 'DRAFT',
      },
    });
    return { id: row.id.toString(), periodCode: row.period_code };
  }

  async listValues(reportingPeriodId: string) {
    const rows = await this.prisma.metricValue.findMany({
      where: { reporting_period_id: BigInt(reportingPeriodId), is_current: true },
      include: {
        metric_definition: { include: { category: true } },
        unit: true,
        dimensions: { include: { dimension_type: true, dimension_value: true } },
      },
      orderBy: { entered_at: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id.toString(),
      metricDefinitionCode: r.metric_definition.code,
      categoryCode: r.metric_definition.category.code,
      nameEn: r.metric_definition.name_en,
      nameZh: r.metric_definition.name_zh,
      numericValue: r.numeric_value?.toString() ?? null,
      textValue: r.text_value,
      unit: r.unit?.code ?? null,
      source: r.source,
      dimensions: r.dimensions.map((d) => ({ type: d.dimension_type.code, value: d.dimension_value.code })),
      enteredAt: r.entered_at.toISOString(),
      notes: r.notes,
    }));
  }

  // MANUAL entry/correction path (plan §3c). Never UPDATEs an existing row
  // — finds the current row for the same period+metric+dimension-set (if
  // any), flips its is_current to false, and inserts a new row pointing
  // back at it via supersedes_id. This is what gives auditors a full,
  // queryable correction trail instead of silently overwritten history.
  async recordValue(reportingPeriodId: string, input: RecordMetricValueInput, userId: string) {
    const definition = await this.prisma.metricDefinition.findUnique({
      where: { code: input.metricDefinitionCode },
      include: { default_unit: true },
    });
    if (!definition) throw new NotFoundException({ code: 'ESG_METRIC.DEFINITION_NOT_FOUND' });

    if (definition.value_type === 'TEXT' && !input.textValue) {
      throw new BadRequestException({ code: 'ESG_METRIC.TEXT_VALUE_REQUIRED' });
    }
    if (definition.value_type !== 'TEXT' && input.numericValue === undefined) {
      throw new BadRequestException({ code: 'ESG_METRIC.NUMERIC_VALUE_REQUIRED' });
    }

    const reportingPeriod = await this.prisma.reportingPeriod.findUnique({ where: { id: BigInt(reportingPeriodId) } });
    if (!reportingPeriod) throw new NotFoundException({ code: 'ESG_METRIC.REPORTING_PERIOD_NOT_FOUND' });

    let unitId = definition.default_unit_id;
    if (input.unitCode) {
      const unit = await this.prisma.unit.findUnique({ where: { code: input.unitCode } });
      if (!unit) throw new BadRequestException({ code: 'ESG_METRIC.UNKNOWN_UNIT' });
      unitId = unit.id;
    }

    const dimensionValueIds: bigint[] = [];
    for (const tag of input.dimensions ?? []) {
      const dimType = await this.prisma.dimensionType.findUnique({ where: { code: tag.dimensionType } });
      if (!dimType) throw new BadRequestException({ code: 'ESG_METRIC.UNKNOWN_DIMENSION_TYPE' });
      const dimValue = await this.prisma.dimensionValue.findUnique({
        where: { dimension_type_id_code: { dimension_type_id: dimType.id, code: tag.dimensionValue } },
      });
      if (!dimValue) throw new BadRequestException({ code: 'ESG_METRIC.UNKNOWN_DIMENSION_VALUE' });
      dimensionValueIds.push(dimValue.id);
    }

    const priorCurrent = await this.findMatchingCurrentValue(
      BigInt(reportingPeriodId),
      definition.id,
      dimensionValueIds,
    );

    const created = await this.prisma.$transaction(async (tx) => {
      if (priorCurrent) {
        await tx.metricValue.update({ where: { id: priorCurrent.id }, data: { is_current: false } });
      }
      const row = await tx.metricValue.create({
        data: {
          reporting_period_id: BigInt(reportingPeriodId),
          facility_id: reportingPeriod.facility_id,
          metric_definition_id: definition.id,
          numeric_value: input.numericValue,
          text_value: input.textValue,
          unit_id: unitId,
          source: 'MANUAL',
          notes: input.notes,
          entered_by_user_id: BigInt(userId),
          supersedes_id: priorCurrent?.id,
          correction_reason: priorCurrent ? input.correctionReason : undefined,
        },
      });
      for (const dimValueId of dimensionValueIds) {
        const dimValue = await tx.dimensionValue.findUniqueOrThrow({ where: { id: dimValueId } });
        await tx.metricValueDimension.create({
          data: { metric_value_id: row.id, dimension_type_id: dimValue.dimension_type_id, dimension_value_id: dimValueId },
        });
      }
      return row;
    });

    return { id: created.id.toString(), wasCorrection: !!priorCurrent };
  }

  // Finds/creates the reporting period covering "now" for a facility, keyed
  // by calendar quarter (e.g. "Q3 2026") — used by the work-order-completed
  // listener so auto-derived metrics always land in a real period without
  // requiring one to have been created by hand first.
  async findOrCreateCurrentReportingPeriod(facilityId: bigint) {
    const now = new Date();
    const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
    const periodCode = `Q${quarter} ${now.getUTCFullYear()}`;
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), startMonth, 1));
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), startMonth + 3, 0));

    const existing = await this.prisma.reportingPeriod.findUnique({
      where: { facility_id_period_code: { facility_id: facilityId, period_code: periodCode } },
    });
    if (existing) return existing;

    return this.prisma.reportingPeriod.create({
      data: { facility_id: facilityId, period_code: periodCode, start_date: startDate, end_date: endDate, status: 'DRAFT' },
    });
  }

  private async findMatchingCurrentValue(reportingPeriodId: bigint, metricDefinitionId: bigint, dimensionValueIds: bigint[]) {
    const candidates = await this.prisma.metricValue.findMany({
      where: { reporting_period_id: reportingPeriodId, metric_definition_id: metricDefinitionId, is_current: true },
      include: { dimensions: true },
    });
    const targetSet = new Set(dimensionValueIds.map((id) => id.toString()));
    return candidates.find((c) => {
      const candidateSet = new Set(c.dimensions.map((d) => d.dimension_value_id.toString()));
      return candidateSet.size === targetSet.size && [...targetSet].every((id) => candidateSet.has(id));
    });
  }
}
