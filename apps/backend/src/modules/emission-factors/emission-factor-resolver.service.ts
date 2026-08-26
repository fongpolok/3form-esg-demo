import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type EmissionFactorCategory =
  | 'GRID_EMISSION_FACTOR'
  | 'FUEL_EMISSION_FACTOR'
  | 'GWP_REFRIGERANT'
  | 'UNIT_CONVERSION'
  | 'ENVIRONMENTAL_EQUIVALENCY';

export interface EmissionFactorScope {
  utilityCode?: string;
  fuelTypeCode?: string;
  refrigerantTypeCode?: string;
  vehicleTypeCode?: string;
  materialTypeCode?: string;
  scopeExtra?: Record<string, string>;
}

// The one entry point every other module uses to turn a raw quantity into
// a derived figure (plan §3d) — never read emission_factors directly.
// Resolution always picks the row whose effective date range covers
// asOfDate, so a report generated for a past period always uses the factor
// that was actually in force then, even if the table has since been
// updated with a newer version.
@Injectable()
export class EmissionFactorResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(category: EmissionFactorCategory, scope: EmissionFactorScope, asOfDate: Date) {
    const categoryRow = await this.prisma.parameterCategory.findUnique({ where: { code: category } });
    if (!categoryRow) throw new NotFoundException({ code: 'EMISSION_FACTOR.CATEGORY_NOT_FOUND' });

    const candidates = await this.prisma.emissionFactor.findMany({
      where: {
        category_id: categoryRow.id,
        is_active: true,
        utility_code: scope.utilityCode ?? undefined,
        fuel_type_code: scope.fuelTypeCode ?? undefined,
        refrigerant_type_code: scope.refrigerantTypeCode ?? undefined,
        vehicle_type_code: scope.vehicleTypeCode ?? undefined,
        material_type_code: scope.materialTypeCode ?? undefined,
        effective_from: { lte: asOfDate },
      },
      orderBy: { effective_from: 'desc' },
    });

    // scope_extra (e.g. paper size) isn't a normalized column, so it's
    // matched in application code against the JSON blob rather than in SQL.
    const match = candidates.find((row) => {
      if (row.effective_to && row.effective_to < asOfDate) return false;
      if (scope.scopeExtra) {
        const stored = (row.scope_extra as Record<string, string> | null) ?? {};
        return Object.entries(scope.scopeExtra).every(([k, v]) => stored[k] === v);
      }
      return true;
    });

    if (!match) {
      throw new NotFoundException({
        code: 'EMISSION_FACTOR.NOT_FOUND',
        category,
        scope,
        asOfDate: asOfDate.toISOString(),
      });
    }
    return match;
  }
}
