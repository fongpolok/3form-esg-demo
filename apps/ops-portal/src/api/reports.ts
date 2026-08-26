import type { GenerateReportInput } from '@esg/shared-validation';
import { apiFetch } from './client';

export interface ReportTemplateDto {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string | null;
  descriptionZh: string | null;
}

export interface ReportDto {
  id: string;
  facilityId: string;
  clientId: string | null;
  audience: 'OFFICIAL' | 'CLIENT_SELF_SERVICE';
  templateNameEn: string;
  templateNameZh: string;
  periodStart: string;
  periodEnd: string;
  generationStatus: string;
  reviewStatus: string | null;
  generatedAt: string;
  finalizedAt: string | null;
  fileSizeBytes: number | null;
}

export function listReportTemplates(): Promise<ReportTemplateDto[]> {
  return apiFetch('/reports/templates');
}

export function listReports(filters: { facilityId?: string; clientId?: string } = {}): Promise<ReportDto[]> {
  const params = new URLSearchParams();
  if (filters.facilityId) params.set('facilityId', filters.facilityId);
  if (filters.clientId) params.set('clientId', filters.clientId);
  const q = params.toString();
  return apiFetch(`/reports${q ? `?${q}` : ''}`);
}

export function generateReport(input: GenerateReportInput): Promise<ReportDto> {
  return apiFetch('/reports', { method: 'POST', body: JSON.stringify(input) });
}

export function finalizeReport(id: string): Promise<ReportDto> {
  return apiFetch(`/reports/${id}/finalize`, { method: 'POST' });
}

export function getReportDownloadUrl(id: string): Promise<{ url: string }> {
  return apiFetch(`/reports/${id}/download`);
}
