import { Injectable } from '@nestjs/common';
import type { Facility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser, TenantScope } from '../../common/types/authenticated-user';

// Resolves a user's memberships into the concrete set of facility/client/supplier
// ids they may access. AUDITOR (scope_type=GLOBAL) short-circuits to isGlobal=true,
// which callers must interpret as "apply no filter" rather than "empty set".
//
// SUPPLIER-scoped memberships are expanded to every facility under that supplier
// at resolve time (not cached) — correct-by-default for the PoC's data volumes;
// revisit with a cache if a single supplier ever has enough facilities to make
// this a hot path.
@Injectable()
export class TenantScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(user: AuthenticatedUser): Promise<TenantScope> {
    const isGlobal = user.memberships.some((m) => m.scopeType === 'GLOBAL');
    if (isGlobal) {
      return { isGlobal: true, supplierIds: [], facilityIds: [], clientIds: [] };
    }

    const supplierIds = user.memberships
      .filter((m) => m.scopeType === 'SUPPLIER' && m.scopeId)
      .map((m) => m.scopeId as string);
    const directFacilityIds = user.memberships
      .filter((m) => m.scopeType === 'FACILITY' && m.scopeId)
      .map((m) => m.scopeId as string);
    const clientIds = user.memberships
      .filter((m) => m.scopeType === 'CLIENT' && m.scopeId)
      .map((m) => m.scopeId as string);

    let facilityIds = directFacilityIds;
    if (supplierIds.length > 0) {
      const facilitiesUnderSuppliers = await this.prisma.facility.findMany({
        where: { supplier_id: { in: supplierIds.map(BigInt) } },
        select: { id: true },
      });
      facilityIds = [
        ...directFacilityIds,
        ...facilitiesUnderSuppliers.map((f: Pick<Facility, 'id'>) => f.id.toString()),
      ];
    }

    return { isGlobal: false, supplierIds, facilityIds, clientIds };
  }
}
