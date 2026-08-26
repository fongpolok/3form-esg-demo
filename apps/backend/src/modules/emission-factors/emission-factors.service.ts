import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateEmissionFactorVersionInput } from '@esg/shared-validation';

@Injectable()
export class EmissionFactorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.emissionFactor.findMany({
      include: { category: true },
      orderBy: [{ code: 'asc' }, { effective_from: 'desc' }],
    });
    return rows.map((r) => ({
      id: r.id.toString(),
      category: r.category.code,
      code: r.code,
      utilityCode: r.utility_code,
      fuelTypeCode: r.fuel_type_code,
      refrigerantTypeCode: r.refrigerant_type_code,
      vehicleTypeCode: r.vehicle_type_code,
      materialTypeCode: r.material_type_code,
      scopeExtra: r.scope_extra,
      factorValue: r.factor_value.toString(),
      factorUnit: r.factor_unit,
      effectiveFrom: r.effective_from.toISOString(),
      effectiveTo: r.effective_to?.toISOString() ?? null,
      sourceReference: r.source_reference,
      isActive: r.is_active,
    }));
  }

  // Never mutates factor_value on an existing row (plan §3d): ends the
  // currently-open row (if any) for the same category+code+scope the day
  // before the new one takes effect, then inserts the new row — so a
  // report generated for a past period is always reproducible against the
  // factor that was actually in force then.
  async createVersion(input: CreateEmissionFactorVersionInput, userId: string) {
    const categoryRow = await this.prisma.parameterCategory.findUnique({ where: { code: input.category } });
    if (!categoryRow) throw new NotFoundException({ code: 'EMISSION_FACTOR.CATEGORY_NOT_FOUND' });

    const effectiveFrom = new Date(input.effectiveFrom);
    const dayBefore = new Date(effectiveFrom);
    dayBefore.setDate(dayBefore.getDate() - 1);

    const openRow = await this.prisma.emissionFactor.findFirst({
      where: {
        category_id: categoryRow.id,
        code: input.code,
        utility_code: input.utilityCode ?? undefined,
        fuel_type_code: input.fuelTypeCode ?? undefined,
        refrigerant_type_code: input.refrigerantTypeCode ?? undefined,
        vehicle_type_code: input.vehicleTypeCode ?? undefined,
        material_type_code: input.materialTypeCode ?? undefined,
        effective_to: null,
        is_active: true,
      },
    });

    await this.prisma.$transaction([
      ...(openRow
        ? [this.prisma.emissionFactor.update({ where: { id: openRow.id }, data: { effective_to: dayBefore } })]
        : []),
      this.prisma.emissionFactor.create({
        data: {
          category_id: categoryRow.id,
          code: input.code,
          utility_code: input.utilityCode,
          fuel_type_code: input.fuelTypeCode,
          refrigerant_type_code: input.refrigerantTypeCode,
          vehicle_type_code: input.vehicleTypeCode,
          material_type_code: input.materialTypeCode,
          scope_extra: input.scopeExtra,
          factor_value: input.factorValue,
          factor_unit: input.factorUnit,
          effective_from: effectiveFrom,
          source_reference: input.sourceReference,
          created_by_user_id: BigInt(userId),
        },
      }),
    ]);

    return this.list();
  }
}
