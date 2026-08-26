import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantScope } from '../../common/types/authenticated-user';

interface CreateSupplierInput {
  name_en: string;
  name_zh: string;
  brn?: string;
}

interface CreateFacilityInput {
  supplier_id: string;
  name_en: string;
  name_zh: string;
  address_en?: string;
  address_zh?: string;
  gfa_sqm?: number;
}

interface CreateClientInput {
  supplier_id: string;
  name_en: string;
  name_zh: string;
  contact_email?: string;
}

interface CreateMembershipInput {
  user_id: string;
  role: 'AUDITOR' | 'SUPPLIER_ADMIN' | 'SUPPLIER_STAFF' | 'CLIENT_USER';
  scope_type: 'GLOBAL' | 'SUPPLIER' | 'FACILITY' | 'CLIENT';
  scope_id?: string;
}

// Bounded to list + create for this build: enough to onboard tenants and
// verify TenantScopeGuard end-to-end. Update/archive flows are a Settings-
// screen feature to add alongside the auditor console work (plan §7), not
// needed to prove the org/RBAC model out.
@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async listSuppliers(scope: TenantScope) {
    if (scope.isGlobal) return this.prisma.supplier.findMany();
    return this.prisma.supplier.findMany({
      where: { id: { in: scope.supplierIds.map(BigInt) } },
    });
  }

  createSupplier(input: CreateSupplierInput) {
    return this.prisma.supplier.create({ data: input });
  }

  async listFacilities(scope: TenantScope) {
    if (scope.isGlobal) return this.prisma.facility.findMany();
    return this.prisma.facility.findMany({
      where: { id: { in: scope.facilityIds.map(BigInt) } },
    });
  }

  async createFacility(input: CreateFacilityInput, scope: TenantScope) {
    this.assertCanManageSupplier(input.supplier_id, scope);
    return this.prisma.facility.create({
      data: { ...input, supplier_id: BigInt(input.supplier_id) },
    });
  }

  async listClients(scope: TenantScope) {
    if (scope.isGlobal) return this.prisma.client.findMany();

    // scope.clientIds only covers the CLIENT_USER role's own record.
    // Supplier staff need to see every client *their* supplier serves (e.g.
    // to attach a work order to one) — derived from their facilities'
    // supplier_id, not from clientIds, which stays empty for them.
    const supplierIds = await this.resolveSupplierIdsForFacilities(scope.facilityIds);

    return this.prisma.client.findMany({
      where: {
        OR: [
          { id: { in: scope.clientIds.map(BigInt) } },
          { supplier_id: { in: supplierIds } },
        ],
      },
    });
  }

  async createClient(input: CreateClientInput, scope: TenantScope) {
    this.assertCanManageSupplier(input.supplier_id, scope);
    return this.prisma.client.create({
      data: { ...input, supplier_id: BigInt(input.supplier_id) },
    });
  }

  // Membership grants are AUDITOR-only, enforced at the controller via
  // @Roles('AUDITOR') — no scope check needed here since a global role
  // check already covers it.
  createMembership(input: CreateMembershipInput) {
    return this.prisma.membership.create({
      data: {
        user_id: BigInt(input.user_id),
        role: input.role,
        scope_type: input.scope_type,
        scope_id: input.scope_id ? BigInt(input.scope_id) : null,
      },
    });
  }

  private assertCanManageSupplier(supplierId: string, scope: TenantScope) {
    if (scope.isGlobal) return;
    if (!scope.supplierIds.includes(supplierId)) {
      throw new ForbiddenException({ code: 'ORG.OUTSIDE_SCOPE' });
    }
  }

  private async resolveSupplierIdsForFacilities(facilityIds: string[]): Promise<bigint[]> {
    if (facilityIds.length === 0) return [];
    const facilities = await this.prisma.facility.findMany({
      where: { id: { in: facilityIds.map(BigInt) } },
      select: { supplier_id: true },
    });
    return [...new Set(facilities.map((f) => f.supplier_id))];
  }
}
