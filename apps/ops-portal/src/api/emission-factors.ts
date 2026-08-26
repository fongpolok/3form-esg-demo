import type { CreateEmissionFactorVersionInput } from '@esg/shared-validation';
import { apiFetch } from './client';

export interface EmissionFactorDto {
  id: string;
  category: string;
  code: string;
  utilityCode: string | null;
  fuelTypeCode: string | null;
  refrigerantTypeCode: string | null;
  vehicleTypeCode: string | null;
  materialTypeCode: string | null;
  factorValue: string;
  factorUnit: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceReference: string | null;
  isActive: boolean;
}

export function listEmissionFactors(): Promise<EmissionFactorDto[]> {
  return apiFetch('/emission-factors');
}

export function createEmissionFactorVersion(input: CreateEmissionFactorVersionInput): Promise<EmissionFactorDto[]> {
  return apiFetch('/emission-factors', { method: 'POST', body: JSON.stringify(input) });
}
