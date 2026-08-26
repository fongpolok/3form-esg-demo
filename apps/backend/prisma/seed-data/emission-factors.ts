// IMPORTANT: these are illustrative starting values for the PoC, sourced
// from commonly-cited public figures, NOT independently verified against
// the current-year published source for this deployment. Every row's
// source_reference says so explicitly. Before any real ESG report leaves
// the building, an auditor must review EmissionFactorsModule's admin
// screen and replace these with the actual current-year published figures
// (e.g. CLP/HK Electric's own Sustainability Report for the grid factor,
// EMSD's latest guidelines for fuel factors) — see effective_from/to,
// which is exactly the mechanism designed for that update (plan §3d).
export interface EmissionFactorSeed {
  category: 'GRID_EMISSION_FACTOR' | 'FUEL_EMISSION_FACTOR' | 'GWP_REFRIGERANT' | 'UNIT_CONVERSION' | 'ENVIRONMENTAL_EQUIVALENCY';
  code: string;
  utility_code?: string;
  fuel_type_code?: string;
  refrigerant_type_code?: string;
  material_type_code?: string;
  scope_extra?: Record<string, string>;
  factor_value: number;
  factor_unit: string;
  effective_from: string;
  source_reference: string;
}

export const EMISSION_FACTORS: EmissionFactorSeed[] = [
  // Grid emission factors — HK's two power utilities publish different
  // figures each year; this is why utility_code + effective_from exist.
  {
    category: 'GRID_EMISSION_FACTOR',
    code: 'CLP_GRID_EF',
    utility_code: 'CLP',
    factor_value: 0.39,
    factor_unit: 'kgCO2e/kWh',
    effective_from: '2024-01-01',
    source_reference:
      'PLACEHOLDER — illustrative figure only. Replace with CLP Power\'s latest published Sustainability Report grid emission factor before use in any real report.',
  },
  {
    category: 'GRID_EMISSION_FACTOR',
    code: 'HKE_GRID_EF',
    utility_code: 'HK_ELECTRIC',
    factor_value: 0.66,
    factor_unit: 'kgCO2e/kWh',
    effective_from: '2024-01-01',
    source_reference:
      'PLACEHOLDER — illustrative figure only. Replace with HK Electric\'s latest published Sustainability Report grid emission factor before use in any real report.',
  },

  // Fuel combustion emission factors.
  {
    category: 'FUEL_EMISSION_FACTOR',
    code: 'DIESEL_EF',
    fuel_type_code: 'DIESEL',
    factor_value: 2.68,
    factor_unit: 'kgCO2e/L',
    effective_from: '2024-01-01',
    source_reference: 'PLACEHOLDER — illustrative figure. Replace with the current EMSD/EPD-cited factor before use in any real report.',
  },
  {
    category: 'FUEL_EMISSION_FACTOR',
    code: 'PETROL_EF',
    fuel_type_code: 'PETROL',
    factor_value: 2.31,
    factor_unit: 'kgCO2e/L',
    effective_from: '2024-01-01',
    source_reference: 'PLACEHOLDER — illustrative figure. Replace with the current EMSD/EPD-cited factor before use in any real report.',
  },
  {
    category: 'FUEL_EMISSION_FACTOR',
    code: 'LPG_EF',
    fuel_type_code: 'LPG',
    factor_value: 1.51,
    factor_unit: 'kgCO2e/L',
    effective_from: '2024-01-01',
    source_reference: 'PLACEHOLDER — illustrative figure. Replace with the current EMSD/EPD-cited factor before use in any real report.',
  },

  // Unit conversions — the electricity one is an exact physical constant
  // (1 kWh = 0.0036 GJ); the fuel energy-content ones are typical values
  // and should still be reviewed against a cited source before real use.
  {
    category: 'UNIT_CONVERSION',
    code: 'KWH_TO_GJ',
    factor_value: 0.0036,
    factor_unit: 'GJ/kWh',
    effective_from: '2024-01-01',
    source_reference: 'Exact physical conversion (1 kWh = 3.6 MJ) — not a figure that needs updating.',
  },
  {
    category: 'UNIT_CONVERSION',
    code: 'DIESEL_TO_GJ',
    fuel_type_code: 'DIESEL',
    factor_value: 0.0386,
    factor_unit: 'GJ/L',
    effective_from: '2024-01-01',
    source_reference: 'PLACEHOLDER — typical diesel energy content (~38.6 MJ/L). Confirm against a cited source before real use.',
  },
  {
    category: 'UNIT_CONVERSION',
    code: 'PETROL_TO_GJ',
    fuel_type_code: 'PETROL',
    factor_value: 0.0342,
    factor_unit: 'GJ/L',
    effective_from: '2024-01-01',
    source_reference: 'PLACEHOLDER — typical petrol energy content (~34.2 MJ/L). Confirm against a cited source before real use.',
  },
  {
    category: 'UNIT_CONVERSION',
    code: 'REAM_TO_KG_A4',
    scope_extra: { paperSize: 'A4' },
    factor_value: 2.494,
    factor_unit: 'KG/REAM',
    effective_from: '2024-01-01',
    source_reference: 'Typical A4 80gsm ream weight (500 sheets x 4.988g ≈ 2.494kg).',
  },
  {
    category: 'UNIT_CONVERSION',
    code: 'REAM_TO_KG_A3',
    scope_extra: { paperSize: 'A3' },
    factor_value: 4.988,
    factor_unit: 'KG/REAM',
    effective_from: '2024-01-01',
    source_reference: 'Typical A3 80gsm ream weight (500 sheets, double A4 area).',
  },

  // GWP (Global Warming Potential) — commonly-cited IPCC AR4 100-year
  // values. AR5/AR6 revise these; confirm which assessment report the
  // target reporting framework requires before real use.
  { category: 'GWP_REFRIGERANT', code: 'R134A_GWP', refrigerant_type_code: 'R134A', factor_value: 1430, factor_unit: 'kgCO2e/kg', effective_from: '2024-01-01', source_reference: 'IPCC AR4 100-year GWP (commonly cited) — confirm assessment-report version required.' },
  { category: 'GWP_REFRIGERANT', code: 'R22_GWP', refrigerant_type_code: 'R22', factor_value: 1810, factor_unit: 'kgCO2e/kg', effective_from: '2024-01-01', source_reference: 'IPCC AR4 100-year GWP (commonly cited) — confirm assessment-report version required.' },
  { category: 'GWP_REFRIGERANT', code: 'R404A_GWP', refrigerant_type_code: 'R404A', factor_value: 3922, factor_unit: 'kgCO2e/kg', effective_from: '2024-01-01', source_reference: 'IPCC AR4 100-year GWP (commonly cited) — confirm assessment-report version required.' },

  // Environmental equivalency constants for the client portal's Recorra-
  // style "your impact" stat tiles (plan §6) — industry rules of thumb,
  // explicitly not precise scientific figures.
  {
    category: 'ENVIRONMENTAL_EQUIVALENCY',
    code: 'PAPER_TREES_SAVED_PER_KG',
    material_type_code: 'PAPER_CARDBOARD',
    factor_value: 0.017,
    factor_unit: 'trees/kg',
    effective_from: '2024-01-01',
    source_reference: 'Common industry rule of thumb ("1 tonne recycled paper saves ~17 trees"). Illustrative, not a precise scientific figure.',
  },
  {
    category: 'ENVIRONMENTAL_EQUIVALENCY',
    code: 'PAPER_CO2_SAVED_PER_KG',
    material_type_code: 'PAPER_CARDBOARD',
    factor_value: 1.5,
    factor_unit: 'kgCO2e/kg',
    effective_from: '2024-01-01',
    source_reference: 'PLACEHOLDER illustrative figure for recycled-vs-virgin paper CO2e avoidance. Replace with a cited LCA source before real use.',
  },
];
