// Matches the "Standard Templates" panel on the report-generation Figma
// screen. section_scope lists metric_categories.code values a template
// includes — ReportBuilderService (Phase 4) filters the catalog by this.
export interface ReportTemplateSeed {
  code: string;
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  framework: string;
  section_scope: string[];
}

const ALL_ENVIRONMENTAL_CATEGORIES = [
  'COMPLIANCE',
  'ENERGY_ELECTRICITY',
  'ENERGY_FUEL_STATIONARY',
  'ENERGY_FUEL_MOBILE',
  'REFRIGERANTS',
  'WATER',
  'PAPER',
  'GHG_SCOPE1',
  'WASTE_NONHAZ',
  'WASTE_HAZ',
  'WASTE_MGMT',
  'FACILITY_ORG',
];

export const REPORT_TEMPLATES: ReportTemplateSeed[] = [
  {
    code: 'HKEX_ESG_GUIDE',
    name_en: 'HKEX ESG Reporting Guide',
    name_zh: '香港交易所 ESG 報告指引',
    description_en: 'Suited for HK listed entities’ standard environmental KPIs.',
    description_zh: '適用於香港上市實體的標準環境關鍵績效指標。',
    framework: 'HKEX Appendix C2',
    section_scope: ALL_ENVIRONMENTAL_CATEGORIES,
  },
  {
    code: 'GRI_STANDARDS',
    name_en: 'GRI Standards Framework',
    name_zh: 'GRI 準則框架',
    description_en: 'Comprehensive global framework for materiality auditing.',
    description_zh: '用於重要性審核的全面全球框架。',
    framework: 'GRI Standards',
    section_scope: ALL_ENVIRONMENTAL_CATEGORIES,
  },
  {
    code: 'HK_CARBON_AUDIT',
    name_en: 'HK Carbon Audit Guidelines',
    name_zh: '香港碳審計指引',
    description_en: 'Focused on energy, fuel, and GHG Scope 1 figures for carbon footprint audits.',
    description_zh: '專注於能源、燃料及範圍一溫室氣體數據，用於碳足跡審計。',
    framework: 'HK Government Carbon Audit Guidelines',
    section_scope: ['ENERGY_ELECTRICITY', 'ENERGY_FUEL_STATIONARY', 'ENERGY_FUEL_MOBILE', 'GHG_SCOPE1', 'REFRIGERANTS'],
  },
];
