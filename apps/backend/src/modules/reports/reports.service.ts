import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReportBuilderService } from './report-builder.service';
import type { GenerateReportInput } from '@esg/shared-validation';
import type { AuthenticatedUser, TenantScope } from '../../common/types/authenticated-user';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly builder: ReportBuilderService,
    private readonly storage: StorageService,
  ) {}

  async getClientImpactSummary(
    facilityId: string,
    clientId: string,
    periodStart: string,
    periodEnd: string,
    scope: TenantScope,
  ) {
    if (!scope.isGlobal && !scope.clientIds.includes(clientId)) {
      throw new ForbiddenException({ code: 'REPORT.OUTSIDE_SCOPE' });
    }
    return this.builder.buildClientImpactSummary(facilityId, clientId, periodStart, periodEnd);
  }

  async listTemplates() {
    const rows = await this.prisma.reportTemplate.findMany();
    return rows.map((r) => ({
      id: r.id.toString(),
      code: r.code,
      nameEn: r.name_en,
      nameZh: r.name_zh,
      descriptionEn: r.description_en,
      descriptionZh: r.description_zh,
    }));
  }

  // Which audience a report belongs to is decided HERE, from the caller's
  // role — never from a client-supplied field — so a CLIENT_USER can only
  // ever produce a CLIENT_SELF_SERVICE report scoped to their own
  // client_id, and only an AUDITOR can produce an OFFICIAL one (plan §6).
  async generate(input: GenerateReportInput, user: AuthenticatedUser, scope: TenantScope) {
    const isAuditor = user.memberships.some((m) => m.role === 'AUDITOR');
    const isClientUser = user.memberships.some((m) => m.role === 'CLIENT_USER');

    if (input.clientId) {
      if (!isAuditor && !(isClientUser && scope.clientIds.includes(input.clientId))) {
        throw new ForbiddenException({ code: 'REPORT.OUTSIDE_SCOPE' });
      }
    } else if (!isAuditor) {
      throw new ForbiddenException({ code: 'REPORT.OFFICIAL_REQUIRES_AUDITOR' });
    }

    if (!isAuditor && !scope.isGlobal && !scope.facilityIds.includes(input.facilityId)) {
      // A client user's facility isn't in their own scope.facilityIds
      // (only their client_id is) — resolve the facility via their
      // client's supplier relationship instead of rejecting outright.
      const facility = await this.prisma.facility.findUnique({ where: { id: BigInt(input.facilityId) } });
      const client = input.clientId ? await this.prisma.client.findUnique({ where: { id: BigInt(input.clientId) } }) : null;
      if (!facility || !client || facility.supplier_id !== client.supplier_id) {
        throw new ForbiddenException({ code: 'REPORT.OUTSIDE_SCOPE' });
      }
    }

    const report = await this.builder.build({
      facilityId: input.facilityId,
      clientId: input.clientId,
      reportTemplateId: input.reportTemplateId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      generatedByUserId: user.id,
    });
    return this.toDto(report);
  }

  async list(scope: TenantScope, filters: { facilityId?: string; clientId?: string }) {
    const effectiveFacilityIds = await this.resolveEffectiveFacilityIds(scope);
    const rows = await this.prisma.report.findMany({
      where: {
        ...(scope.isGlobal
          ? {}
          : {
              OR: [
                { facility_id: { in: effectiveFacilityIds.map(BigInt) } },
                { client_id: { in: scope.clientIds.map(BigInt) } },
              ],
            }),
        ...(filters.facilityId ? { facility_id: BigInt(filters.facilityId) } : {}),
        ...(filters.clientId ? { client_id: BigInt(filters.clientId) } : {}),
      },
      include: { report_template: true },
      orderBy: { generated_at: 'desc' },
    });
    const visible = rows.filter((r) => this.isVisibleTo(r, scope, effectiveFacilityIds));
    return visible.map((r) => this.toDto(r));
  }

  async getById(id: string, scope: TenantScope) {
    const report = await this.prisma.report.findUnique({ where: { id: BigInt(id) }, include: { report_template: true } });
    const effectiveFacilityIds = await this.resolveEffectiveFacilityIds(scope);
    if (!report || !this.isVisibleTo(report, scope, effectiveFacilityIds)) {
      throw new NotFoundException({ code: 'REPORT.NOT_FOUND' });
    }
    return this.toDto(report);
  }

  async getDownloadUrl(id: string, scope: TenantScope) {
    const report = await this.prisma.report.findUnique({ where: { id: BigInt(id) } });
    const effectiveFacilityIds = await this.resolveEffectiveFacilityIds(scope);
    if (!report || !this.isVisibleTo(report, scope, effectiveFacilityIds) || !report.pdf_storage_key) {
      throw new NotFoundException({ code: 'REPORT.NOT_FOUND' });
    }
    const url = await this.storage.getSignedDownloadUrl(report.pdf_storage_key);
    return { url };
  }

  // Simplified from the plan's full DRAFT->PENDING_REVIEW->FINALIZED->
  // PUBLISHED workflow to a single Auditor action for this build — the
  // schema still carries all four states (reports.review_status) so the
  // intermediate PENDING_REVIEW step is a queue-screen addition later, not
  // a schema change.
  async finalize(id: string, scope: TenantScope) {
    const report = await this.prisma.report.findUnique({ where: { id: BigInt(id) } });
    const effectiveFacilityIds = await this.resolveEffectiveFacilityIds(scope);
    if (!report || !this.isVisibleTo(report, scope, effectiveFacilityIds)) throw new NotFoundException({ code: 'REPORT.NOT_FOUND' });
    if (report.audience !== 'OFFICIAL') throw new BadRequestException({ code: 'REPORT.NOT_OFFICIAL' });
    if (report.review_status === 'FINALIZED' || report.review_status === 'PUBLISHED') {
      throw new BadRequestException({ code: 'REPORT.ALREADY_FINALIZED' });
    }
    const updated = await this.prisma.report.update({
      where: { id: report.id },
      data: { review_status: 'PUBLISHED', finalized_at: new Date() },
      include: { report_template: true },
    });
    return this.toDto(updated);
  }

  // scope.facilityIds is empty for a CLIENT_USER (TenantScopeService only
  // populates it from FACILITY/SUPPLIER-scoped memberships — plan §3a) —
  // but a client still needs to see a facility-wide PUBLISHED official
  // report even though it carries client_id=null. Resolved the same way
  // OrgService.listClients resolves the opposite direction: via the
  // client's own supplier_id -> every facility under that supplier.
  private async resolveEffectiveFacilityIds(scope: TenantScope): Promise<string[]> {
    if (scope.isGlobal || scope.facilityIds.length > 0 || scope.clientIds.length === 0) {
      return scope.facilityIds;
    }
    const clients = await this.prisma.client.findMany({
      where: { id: { in: scope.clientIds.map(BigInt) } },
      select: { supplier_id: true },
    });
    const supplierIds = [...new Set(clients.map((c) => c.supplier_id))];
    if (supplierIds.length === 0) return [];
    const facilities = await this.prisma.facility.findMany({
      where: { supplier_id: { in: supplierIds } },
      select: { id: true },
    });
    return facilities.map((f) => f.id.toString());
  }

  private isVisibleTo(
    report: { facility_id: bigint; client_id: bigint | null; audience: string; review_status: string | null },
    scope: TenantScope,
    effectiveFacilityIds: string[],
  ): boolean {
    if (scope.isGlobal) return true;
    const facilityMatch = effectiveFacilityIds.includes(report.facility_id.toString());
    const clientMatch = report.client_id !== null && scope.clientIds.includes(report.client_id.toString());
    if (!facilityMatch && !clientMatch) return false;
    // A client (not staff) can only see published official reports, plus
    // their own self-service ones — never a facility's in-progress draft.
    // Reached via the supplier-derived facility set above, so "facilityMatch"
    // alone doesn't mean this caller is staff — scope.facilityIds (the real
    // staff signal) is what distinguishes the two, not effectiveFacilityIds.
    const isStaffOrAuditor = scope.facilityIds.length > 0;
    if (!isStaffOrAuditor && report.audience === 'OFFICIAL' && report.review_status !== 'PUBLISHED') return false;
    return true;
  }

  private toDto(report: {
    id: bigint;
    facility_id: bigint;
    client_id: bigint | null;
    audience: string;
    period_start: Date;
    period_end: Date;
    generation_status: string;
    review_status: string | null;
    generated_at: Date;
    finalized_at: Date | null;
    file_size_bytes: number | null;
    report_template: { name_en: string; name_zh: string };
  }) {
    return {
      id: report.id.toString(),
      facilityId: report.facility_id.toString(),
      clientId: report.client_id?.toString() ?? null,
      audience: report.audience,
      templateNameEn: report.report_template.name_en,
      templateNameZh: report.report_template.name_zh,
      periodStart: report.period_start.toISOString(),
      periodEnd: report.period_end.toISOString(),
      generationStatus: report.generation_status,
      reviewStatus: report.review_status,
      generatedAt: report.generated_at.toISOString(),
      finalizedAt: report.finalized_at?.toISOString() ?? null,
      fileSizeBytes: report.file_size_bytes,
    };
  }
}
