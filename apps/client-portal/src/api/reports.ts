import type { GenerateReportInput } from '@esg/shared-validation';
import { apiFetch } from './client';

export interface ReportDto {
  id: string;
  audience: 'OFFICIAL' | 'CLIENT_SELF_SERVICE';
  templateNameEn: string;
  periodStart: string;
  periodEnd: string;
  generationStatus: string;
  reviewStatus: string | null;
  generatedAt: string;
  fileSizeBytes: number | null;
}

export interface ClientImpactSummaryDto {
  totalRecycledKg: number;
  materialsBreakdown: Array<{ wasteType: string; kg: number; percent: number }>;
  treesSaved: number | null;
  co2SavedKg: number | null;
}

export interface ReportTemplateDto {
  id: string;
  code: string;
  nameEn: string;
}

export function listReportTemplates(): Promise<ReportTemplateDto[]> {
  return apiFetch('/reports/templates');
}

export function listReports(clientId: string): Promise<ReportDto[]> {
  return apiFetch(`/reports?clientId=${clientId}`);
}

export function getReportDownloadUrl(id: string): Promise<{ url: string }> {
  return apiFetch(`/reports/${id}/download`);
}

export function generateSelfServiceReport(input: GenerateReportInput): Promise<ReportDto> {
  return apiFetch('/reports', { method: 'POST', body: JSON.stringify(input) });
}

export function getClientImpactSummary(params: {
  facilityId: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<ClientImpactSummaryDto> {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/reports/client-impact-summary?${q}`);
}
