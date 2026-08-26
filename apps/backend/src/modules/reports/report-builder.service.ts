import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmissionFactorResolverService } from '../emission-factors/emission-factor-resolver.service';
import { StorageService } from '../storage/storage.service';
import { renderReportHtml } from './templates/report-html.template';
import type { EmissionFactorCitation, ReportMetricBreakdownRow, ReportModel, ReportSectionModel } from './report-model';

interface BuildReportInput {
  facilityId: string;
  clientId?: string;
  reportTemplateId: string;
  periodStart: string;
  periodEnd: string;
  generatedByUserId: string;
}

// Orchestrates metrics + emission factors + Puppeteer rendering into the
// GRI/HKEX-structured PDF report (plan §6). Two audiences differ in scope,
// not mechanism: OFFICIAL pulls every current metric_value for the
// facility in range; CLIENT_SELF_SERVICE additionally filters to rows
// carrying that client's client_id, so it never fabricates a per-client
// allocation of facility-wide figures it can't actually attribute.
@Injectable()
export class ReportBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emissionFactors: EmissionFactorResolverService,
    private readonly storage: StorageService,
  ) {}

  async build(input: BuildReportInput) {
    const facility = await this.prisma.facility.findUnique({ where: { id: BigInt(input.facilityId) } });
    if (!facility) throw new NotFoundException({ code: 'REPORT.FACILITY_NOT_FOUND' });

    const client = input.clientId
      ? await this.prisma.client.findUnique({ where: { id: BigInt(input.clientId) } })
      : null;
    if (input.clientId && !client) throw new NotFoundException({ code: 'REPORT.CLIENT_NOT_FOUND' });

    const template = await this.prisma.reportTemplate.findUnique({ where: { id: BigInt(input.reportTemplateId) } });
    if (!template) throw new NotFoundException({ code: 'REPORT.TEMPLATE_NOT_FOUND' });

    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);
    if (periodEnd < periodStart) throw new BadRequestException({ code: 'REPORT.INVALID_DATE_RANGE' });

    const sectionScope = template.section_scope as string[];
    const citations = new Map<string, EmissionFactorCitation>();

    const sections = await this.buildSections(
      BigInt(input.facilityId),
      client ? BigInt(input.clientId!) : null,
      sectionScope,
      periodStart,
      periodEnd,
    );

    const electricityGJ = await this.computeElectricityGJ(sections, periodEnd, citations);
    const refrigerantCO2eKg = await this.computeRefrigerantCO2e(sections, periodEnd, citations);
    const clientEquivalencies = client
      ? await this.computeClientEquivalencies(sections, periodEnd, citations)
      : { clientTreesSaved: null, clientCo2SavedKg: null };

    const model: ReportModel = {
      facilityNameEn: facility.name_en,
      facilityNameZh: facility.name_zh,
      clientNameEn: client?.name_en ?? null,
      templateNameEn: template.name_en,
      audience: client ? 'CLIENT_SELF_SERVICE' : 'OFFICIAL',
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      generatedAt: new Date().toISOString(),
      sections,
      derived: { electricityGJ, refrigerantCO2eKg, ...clientEquivalencies },
      emissionFactorsUsed: [...citations.values()],
    };

    const html = renderReportHtml(model);
    const pdfBuffer = await this.renderPdf(html);

    const storageKey = `reports/${input.facilityId}/${Date.now()}-${client ? `client-${input.clientId}` : 'official'}.pdf`;
    await this.storage.put(storageKey, pdfBuffer, 'application/pdf');

    const report = await this.prisma.report.create({
      data: {
        facility_id: BigInt(input.facilityId),
        client_id: client ? BigInt(input.clientId!) : null,
        report_template_id: template.id,
        audience: client ? 'CLIENT_SELF_SERVICE' : 'OFFICIAL',
        period_start: periodStart,
        period_end: periodEnd,
        generation_status: 'READY',
        review_status: client ? null : 'DRAFT',
        generated_by_user_id: BigInt(input.generatedByUserId),
        pdf_storage_key: storageKey,
        file_size_bytes: pdfBuffer.byteLength,
        emission_factor_snapshot: [...citations.values()] as unknown as Prisma.InputJsonValue,
      },
      include: { report_template: true },
    });

    return report;
  }

  // Powers the client portal's live stat tiles (plan §6/§7's Recorra-style
  // dashboard) without generating a PDF — same underlying data + emission
  // factors as a CLIENT_SELF_SERVICE report, just returned as JSON for
  // on-screen display instead of rendered to a document.
  async buildClientImpactSummary(facilityId: string, clientId: string, periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const sections = await this.buildSections(BigInt(facilityId), BigInt(clientId), ['WASTE_NONHAZ'], start, end);
    const citations = new Map<string, EmissionFactorCitation>();
    const equivalencies = await this.computeClientEquivalencies(sections, end, citations);

    const wasteMetric = this.getMetricRows(sections, 'WASTE_NONHAZ_QUANTITY');
    const recycledRows = (wasteMetric?.rows ?? []).filter((r) =>
      r.dimensions.some((d) => d.type === 'HANDLING_METHOD' && d.value === 'RECYCLED'),
    );
    const totalRecycledKg = recycledRows.reduce((sum, r) => sum + (r.numericTotal ?? 0), 0);
    const breakdown = recycledRows
      .map((r) => {
        const wasteType = r.dimensions.find((d) => d.type === 'WASTE_TYPE')?.value ?? 'OTHER';
        const kg = r.numericTotal ?? 0;
        return { wasteType, kg, percent: totalRecycledKg > 0 ? Math.round((kg / totalRecycledKg) * 1000) / 10 : 0 };
      })
      .sort((a, b) => b.kg - a.kg);

    return {
      totalRecycledKg,
      materialsBreakdown: breakdown,
      treesSaved: equivalencies.clientTreesSaved,
      co2SavedKg: equivalencies.clientCo2SavedKg,
    };
  }

  private async buildSections(
    facilityId: bigint,
    clientId: bigint | null,
    sectionScope: string[],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ReportSectionModel[]> {
    const categories = await this.prisma.metricCategory.findMany({
      where: { code: { in: sectionScope } },
      orderBy: { sort_order: 'asc' },
    });

    const values = await this.prisma.metricValue.findMany({
      where: {
        facility_id: facilityId,
        is_current: true,
        ...(clientId ? { client_id: clientId } : {}),
        metric_definition: { category_id: { in: categories.map((c) => c.id) } },
        reporting_period: { start_date: { gte: periodStart }, end_date: { lte: periodEnd } },
      },
      include: {
        metric_definition: { include: { category: true, default_unit: true } },
        unit: true,
        dimensions: { include: { dimension_type: true, dimension_value: true } },
      },
    });

    return categories.map((cat) => {
      const catValues = values.filter((v) => v.metric_definition.category_id === cat.id);
      const byDefinition = new Map<string, typeof catValues>();
      for (const v of catValues) {
        const list = byDefinition.get(v.metric_definition.code) ?? [];
        list.push(v);
        byDefinition.set(v.metric_definition.code, list);
      }

      const metrics = [...byDefinition.entries()].map(([code, rows]) => {
        const first = rows[0]!.metric_definition;
        const byDimSet = new Map<string, { dims: Array<{ type: string; value: string }>; numeric: number | null; texts: string[] }>();
        for (const row of rows) {
          const dims = row.dimensions
            .map((d) => ({ type: d.dimension_type.code, value: d.dimension_value.code }))
            .sort((a, b) => a.type.localeCompare(b.type));
          const key = dims.map((d) => `${d.type}:${d.value}`).join('|') || '__none__';
          const bucket = byDimSet.get(key) ?? { dims, numeric: null, texts: [] };
          if (row.numeric_value !== null) bucket.numeric = (bucket.numeric ?? 0) + Number(row.numeric_value);
          if (row.text_value) bucket.texts.push(row.text_value);
          byDimSet.set(key, bucket);
        }
        const breakdownRows: ReportMetricBreakdownRow[] = [...byDimSet.values()].map((b) => ({
          dimensions: b.dims,
          numericTotal: b.numeric,
          textValues: b.texts,
        }));
        return {
          code,
          nameEn: first.name_en,
          nameZh: first.name_zh,
          griCode: first.gri_code,
          hkexCode: first.hkex_code,
          unit: rows[0]!.unit?.code ?? null,
          rows: breakdownRows,
        };
      });

      return { categoryCode: cat.code, nameEn: cat.name_en, nameZh: cat.name_zh, metrics };
    });
  }

  // Demonstrates the emission-factor-resolution mechanism on one concrete
  // figure (plan §6 step 3) — purchased electricity's GJ equivalent.
  // Every other is_derived metric in the catalog follows the identical
  // pattern (look up its scope, call resolve(), multiply); adding them is
  // additive, not a redesign.
  private async computeElectricityGJ(
    sections: ReportSectionModel[],
    asOfDate: Date,
    citations: Map<string, EmissionFactorCitation>,
  ): Promise<number | null> {
    const electricityKwh = this.sumMetric(sections, 'ELEC_PURCHASED');
    if (electricityKwh === null) return null;
    // KWH_TO_GJ carries no scope filters (it's an exact physical constant,
    // not utility/fuel-specific) — looked up by code directly rather than
    // via EmissionFactorResolverService.resolve(), which is built for
    // scope-filtered lookups (grid factor by utility, fuel factor by type).
    const kwhToGj = await this.findFactorByCode('KWH_TO_GJ', asOfDate);
    if (!kwhToGj) return null;
    this.citeFactor(citations, kwhToGj);
    return Math.round(electricityKwh * Number(kwhToGj.factor_value) * 1000) / 1000;
  }

  // Unlike computeElectricityGJ's direct code lookup, this goes through
  // EmissionFactorResolverService.resolve() with a real scope (refrigerant
  // type) — GWP factors genuinely vary per refrigerant, which is exactly
  // what resolve()'s scope-matching exists for (plan §3d).
  private async computeRefrigerantCO2e(
    sections: ReportSectionModel[],
    asOfDate: Date,
    citations: Map<string, EmissionFactorCitation>,
  ): Promise<number | null> {
    const disposed = this.getMetricRows(sections, 'REFRIGERANT_DISPOSED');
    if (!disposed) return null;

    let totalCo2e = 0;
    let matchedAny = false;
    for (const row of disposed.rows) {
      const refrigerantType = row.dimensions.find((d) => d.type === 'REFRIGERANT_TYPE')?.value;
      if (!refrigerantType || row.numericTotal === null) continue;
      const factor = await this.emissionFactors
        .resolve('GWP_REFRIGERANT', { refrigerantTypeCode: refrigerantType }, asOfDate)
        .catch(() => null);
      if (!factor) continue;
      this.citeFactor(citations, factor);
      totalCo2e += row.numericTotal * Number(factor.factor_value);
      matchedAny = true;
    }
    return matchedAny ? Math.round(totalCo2e * 100) / 100 : null;
  }

  private getMetricRows(sections: ReportSectionModel[], code: string) {
    for (const section of sections) {
      const metric = section.metrics.find((m) => m.code === code);
      if (metric) return metric;
    }
    return null;
  }

  private async computeClientEquivalencies(
    sections: ReportSectionModel[],
    asOfDate: Date,
    citations: Map<string, EmissionFactorCitation>,
  ): Promise<{ clientTreesSaved: number | null; clientCo2SavedKg: number | null }> {
    const paperRecycledKg = this.sumMetric(sections, 'WASTE_NONHAZ_QUANTITY', [{ type: 'WASTE_TYPE', value: 'PAPER' }]);
    if (paperRecycledKg === null) return { clientTreesSaved: null, clientCo2SavedKg: null };

    const treesFactor = await this.findFactorByCode('PAPER_TREES_SAVED_PER_KG', asOfDate);
    const co2Factor = await this.findFactorByCode('PAPER_CO2_SAVED_PER_KG', asOfDate);
    if (treesFactor) this.citeFactor(citations, treesFactor);
    if (co2Factor) this.citeFactor(citations, co2Factor);

    return {
      clientTreesSaved: treesFactor ? Math.round(paperRecycledKg * Number(treesFactor.factor_value)) : null,
      clientCo2SavedKg: co2Factor ? Math.round(paperRecycledKg * Number(co2Factor.factor_value)) : null,
    };
  }

  private sumMetric(sections: ReportSectionModel[], code: string, dimFilter?: Array<{ type: string; value: string }>): number | null {
    for (const section of sections) {
      const metric = section.metrics.find((m) => m.code === code);
      if (!metric) continue;
      const matchingRows = dimFilter
        ? metric.rows.filter((r) => dimFilter.every((f) => r.dimensions.some((d) => d.type === f.type && d.value === f.value)))
        : metric.rows;
      const total = matchingRows.reduce((sum, r) => sum + (r.numericTotal ?? 0), 0);
      return matchingRows.length > 0 ? total : null;
    }
    return null;
  }

  private async findFactorByCode(code: string, asOfDate: Date) {
    return this.prisma.emissionFactor.findFirst({
      where: {
        code,
        is_active: true,
        effective_from: { lte: asOfDate },
        OR: [{ effective_to: null }, { effective_to: { gte: asOfDate } }],
      },
      orderBy: { effective_from: 'desc' },
    });
  }

  private citeFactor(citations: Map<string, EmissionFactorCitation>, factor: { code: string; factor_value: unknown; factor_unit: string; source_reference: string | null }) {
    citations.set(factor.code, {
      code: factor.code,
      factorValue: String(factor.factor_value),
      factorUnit: factor.factor_unit,
      sourceReference: factor.source_reference,
    });
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      // Docker containers commonly run as root with no user namespace, so
      // Chromium's own sandbox can't set up correctly — --no-sandbox is the
      // standard, documented workaround for exactly this environment.
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
