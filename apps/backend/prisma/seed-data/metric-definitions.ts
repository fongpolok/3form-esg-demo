// Every row here traces back to a real row in the client's
// "Data Collection_Environmental - Recycling Facility.xlsx" (the GRI +
// HKEX ESG Reporting Guide mapped data standard — see the implementation
// plan's Context section). A handful of the spreadsheet's open-ended
// "Others (please specify)" catch-all rows were left out to keep the
// catalog focused on the codeable, GRI/HKEX-cited metrics — every metric
// that carries a GRI or HKEX code from the source spreadsheet is here.
export interface MetricDefinitionSeed {
  code: string;
  category: string;
  gri_code?: string;
  hkex_code?: string;
  name_en: string;
  name_zh: string;
  value_type: 'NUMERIC' | 'TEXT' | 'COUNT';
  default_unit?: string;
  is_derived?: boolean;
  derivation_of?: string;
  derivation_factor_category?: 'UNIT_CONVERSION' | 'EMISSION_FACTOR' | 'EQUIVALENCY';
  dimensions?: string[];
}

export const METRIC_DEFINITIONS: MetricDefinitionSeed[] = [
  // --- Compliance ---
  {
    code: 'NONCOMPLIANCE_INCIDENTS',
    category: 'COMPLIANCE',
    gri_code: 'GRI 205-3',
    hkex_code: 'HKEX B7.1',
    name_en: 'Confirmed incidents of non-compliance with environmental laws and regulations',
    name_zh: '違反環保法例及規例的已確認個案',
    value_type: 'COUNT',
    default_unit: 'CASE',
  },

  // --- Energy: Electricity ---
  {
    code: 'ELEC_PURCHASED',
    category: 'ENERGY_ELECTRICITY',
    gri_code: 'GRI 302-1',
    hkex_code: 'HKEx A2.1',
    name_en: 'Total purchased electricity consumption',
    name_zh: '購入電力總消耗量',
    value_type: 'NUMERIC',
    default_unit: 'KWH',
  },
  {
    code: 'ELEC_PURCHASED_GJ',
    category: 'ENERGY_ELECTRICITY',
    name_en: 'Energy consumption equivalent to purchased electricity',
    name_zh: '相當於購入電力的能源消耗量',
    value_type: 'NUMERIC',
    default_unit: 'GJ',
    is_derived: true,
    derivation_of: 'ELEC_PURCHASED',
    derivation_factor_category: 'UNIT_CONVERSION',
  },
  {
    code: 'ELEC_RENEWABLE',
    category: 'ENERGY_ELECTRICITY',
    name_en: 'Renewable electricity generated (e.g. solar PV)',
    name_zh: '可再生能源發電量（如太陽能光伏）',
    value_type: 'NUMERIC',
    default_unit: 'KWH',
  },
  {
    code: 'ELEC_REDUCTION_KWH',
    category: 'ENERGY_ELECTRICITY',
    gri_code: 'GRI 302-4;302-5',
    hkex_code: 'HKEx A2.4',
    name_en: 'Reduction in energy consumption from conservation initiatives',
    name_zh: '節能措施帶來的能源消耗減少量',
    value_type: 'NUMERIC',
    default_unit: 'KWH',
  },
  {
    code: 'ELEC_REDUCTION_NOTES',
    category: 'ENERGY_ELECTRICITY',
    gri_code: 'GRI 302-4;302-5',
    hkex_code: 'HKEx A2.4',
    name_en: 'Conservation and efficiency initiatives description',
    name_zh: '節能及效益提升措施說明',
    value_type: 'TEXT',
  },

  // --- Energy: Fuel, stationary sources ---
  {
    code: 'FUEL_STATIONARY_GENERATORS',
    category: 'ENERGY_FUEL_STATIONARY',
    gri_code: 'GRI 302-1',
    hkex_code: 'HKEx A2.1',
    name_en: 'Generator fuel consumption',
    name_zh: '發電機燃料消耗量',
    value_type: 'NUMERIC',
    default_unit: 'LITRE',
    dimensions: ['FUEL_TYPE'],
  },
  {
    code: 'FUEL_STATIONARY_GJ',
    category: 'ENERGY_FUEL_STATIONARY',
    name_en: 'Energy consumption equivalent to stationary fuel consumption',
    name_zh: '相當於固定源燃料消耗的能源消耗量',
    value_type: 'NUMERIC',
    default_unit: 'GJ',
    is_derived: true,
    derivation_of: 'FUEL_STATIONARY_GENERATORS',
    derivation_factor_category: 'UNIT_CONVERSION',
    dimensions: ['FUEL_TYPE'],
  },

  // --- Energy: Fuel, mobile vehicles ---
  {
    code: 'VEHICLE_COUNT',
    category: 'ENERGY_FUEL_MOBILE',
    gri_code: 'GRI 302-1',
    hkex_code: 'HKEx A2.1',
    name_en: 'Total number of company vehicles',
    name_zh: '公司車輛總數',
    value_type: 'COUNT',
    default_unit: 'NO',
  },
  {
    code: 'VEHICLE_FUEL_CONSUMPTION',
    category: 'ENERGY_FUEL_MOBILE',
    name_en: 'Fuel consumption by company vehicles',
    name_zh: '公司車輛燃料消耗量',
    value_type: 'NUMERIC',
    default_unit: 'LITRE',
    dimensions: ['VEHICLE_TYPE', 'FUEL_TYPE'],
  },
  {
    code: 'VEHICLE_FUEL_GJ',
    category: 'ENERGY_FUEL_MOBILE',
    name_en: 'Energy consumption equivalent to vehicle fuel consumption',
    name_zh: '相當於車輛燃料消耗的能源消耗量',
    value_type: 'NUMERIC',
    default_unit: 'GJ',
    is_derived: true,
    derivation_of: 'VEHICLE_FUEL_CONSUMPTION',
    derivation_factor_category: 'UNIT_CONVERSION',
    dimensions: ['FUEL_TYPE'],
  },
  {
    code: 'VEHICLE_TRAVEL_DISTANCE',
    category: 'ENERGY_FUEL_MOBILE',
    name_en: 'Travel distance',
    name_zh: '行駛里程',
    value_type: 'NUMERIC',
    default_unit: 'KM',
    dimensions: ['VEHICLE_TYPE'],
  },

  // --- Refrigerants ---
  {
    code: 'REFRIGERANT_BEGIN_BALANCE',
    category: 'REFRIGERANTS',
    gri_code: 'GRI 301-1;305-1',
    hkex_code: 'HKEx A1.1;1.2',
    name_en: 'Refrigerant inventory balance at beginning of period',
    name_zh: '期初雪種存量',
    value_type: 'NUMERIC',
    default_unit: 'KG',
    dimensions: ['REFRIGERANT_TYPE'],
  },
  {
    code: 'REFRIGERANT_PURCHASED',
    category: 'REFRIGERANTS',
    name_en: 'Refrigerant purchased',
    name_zh: '購入雪種量',
    value_type: 'NUMERIC',
    default_unit: 'KG',
    dimensions: ['REFRIGERANT_TYPE'],
  },
  {
    code: 'REFRIGERANT_DISPOSED',
    category: 'REFRIGERANTS',
    name_en: 'Refrigerant disposed',
    name_zh: '棄置雪種量',
    value_type: 'NUMERIC',
    default_unit: 'KG',
    dimensions: ['REFRIGERANT_TYPE'],
  },
  {
    code: 'REFRIGERANT_END_BALANCE',
    category: 'REFRIGERANTS',
    name_en: 'Refrigerant inventory balance at end of period',
    name_zh: '期末雪種存量',
    value_type: 'NUMERIC',
    default_unit: 'KG',
    dimensions: ['REFRIGERANT_TYPE'],
  },
  {
    code: 'REFRIGERANT_CO2E',
    category: 'REFRIGERANTS',
    name_en: 'GHG emissions equivalent from refrigerant loss (GWP-weighted)',
    name_zh: '雪種洩漏之溫室氣體排放當量（按全球暖化潛勢加權）',
    value_type: 'NUMERIC',
    default_unit: 'KG_CO2E',
    is_derived: true,
    derivation_of: 'REFRIGERANT_DISPOSED',
    derivation_factor_category: 'EMISSION_FACTOR',
    dimensions: ['REFRIGERANT_TYPE'],
  },

  // --- Water ---
  {
    code: 'WATER_USAGE_PURPOSE',
    category: 'WATER',
    gri_code: 'GRI 303-1',
    hkex_code: 'HKEx A2.2;3.1',
    name_en: 'Purpose of water usage in daily operation',
    name_zh: '日常營運中的用水目的',
    value_type: 'TEXT',
  },
  {
    code: 'WATER_REDUCTION_PLAN',
    category: 'WATER',
    gri_code: 'GRI 303-1',
    hkex_code: 'HKEx A2.2;3.1',
    name_en: 'Plan / measures to reduce water usage',
    name_zh: '減少用水的計劃/措施',
    value_type: 'TEXT',
  },
  {
    code: 'WATER_EFFLUENT_STANDARDS',
    category: 'WATER',
    gri_code: 'GRI 303-2;303-4',
    hkex_code: 'HKEx A2.2;2.4;3.1',
    name_en: 'Standards set for the quality of effluent discharge',
    name_zh: '污水排放水質標準',
    value_type: 'TEXT',
  },
  {
    code: 'WATER_CONSUMPTION',
    category: 'WATER',
    gri_code: 'GRI 303-5',
    hkex_code: 'HKEx A2.2;2.4',
    name_en: 'Water consumption',
    name_zh: '耗水量',
    value_type: 'NUMERIC',
    default_unit: 'M3',
  },

  // --- Paper use ---
  {
    code: 'PAPER_CONSUMED_REAM',
    category: 'PAPER',
    gri_code: 'GRI 301-1',
    name_en: 'Paper consumed / purchased',
    name_zh: '已消耗/購買的紙張',
    value_type: 'NUMERIC',
    default_unit: 'REAM',
    dimensions: ['PAPER_SIZE'],
  },
  {
    code: 'PAPER_CONSUMED_KG',
    category: 'PAPER',
    name_en: 'Paper consumed / purchased (by weight)',
    name_zh: '已消耗/購買的紙張（重量）',
    value_type: 'NUMERIC',
    default_unit: 'KG',
    is_derived: true,
    derivation_of: 'PAPER_CONSUMED_REAM',
    derivation_factor_category: 'UNIT_CONVERSION',
    dimensions: ['PAPER_SIZE'],
  },

  // --- GHG Scope 1 ---
  {
    code: 'TREES_PLANTED',
    category: 'GHG_SCOPE1',
    gri_code: 'GRI 305-1',
    hkex_code: 'HKEx A1.1;A1.2',
    name_en: 'Number of trees planted',
    name_zh: '種植樹木數量',
    value_type: 'COUNT',
    default_unit: 'NO',
  },
  {
    code: 'TREES_REMOVED',
    category: 'GHG_SCOPE1',
    gri_code: 'GRI 305-1',
    hkex_code: 'HKEx A1.1;A1.2',
    name_en: 'Number of trees removed',
    name_zh: '移除樹木數量',
    value_type: 'COUNT',
    default_unit: 'NO',
  },

  // --- Waste: non-hazardous ---
  {
    code: 'WASTE_NONHAZ_QUANTITY',
    category: 'WASTE_NONHAZ',
    gri_code: 'GRI 306-3;306-4',
    hkex_code: 'HKEx A3.1;A4.1',
    name_en: 'Non-hazardous waste quantity',
    name_zh: '非有害廢物數量',
    value_type: 'NUMERIC',
    default_unit: 'KG',
    dimensions: ['WASTE_TYPE', 'HANDLING_METHOD'],
  },

  // --- Waste: hazardous ---
  {
    code: 'WASTE_HAZ_TREATED_WATER',
    category: 'WASTE_HAZ',
    gri_code: 'GRI 306-3;306-5',
    hkex_code: 'HKEx A1.3;3.1',
    name_en: 'Treated water discharged',
    name_zh: '已處理污水排放量',
    value_type: 'NUMERIC',
    default_unit: 'M3',
  },
  {
    code: 'WASTE_HAZ_CHEMICAL',
    category: 'WASTE_HAZ',
    gri_code: 'GRI 306-3;306-5',
    hkex_code: 'HKEx A1.3;3.1',
    name_en: 'Chemical waste disposed',
    name_zh: '化學廢物棄置量',
    value_type: 'NUMERIC',
    default_unit: 'LITRE',
  },
  {
    code: 'WASTE_HAZ_LAMPS',
    category: 'WASTE_HAZ',
    gri_code: 'GRI 306-3;306-5',
    hkex_code: 'HKEx A1.3;3.1',
    name_en: 'Spent fluorescent / mercury lamps',
    name_zh: '廢熒光燈管/水銀燈',
    value_type: 'NUMERIC',
    default_unit: 'NO',
    dimensions: ['HANDLING_METHOD'],
  },
  {
    code: 'WASTE_HAZ_CARTRIDGE',
    category: 'WASTE_HAZ',
    gri_code: 'GRI 306-3;306-5',
    hkex_code: 'HKEx A1.3;3.1',
    name_en: 'Toner / inkjet cartridge recycled',
    name_zh: '碳粉/噴墨盒回收量',
    value_type: 'NUMERIC',
    default_unit: 'NO',
  },

  // --- Waste management (descriptive) ---
  {
    code: 'WASTE_TYPES_GENERATED',
    category: 'WASTE_MGMT',
    gri_code: 'GRI 306-1',
    hkex_code: 'HKEx A1',
    name_en: 'Type of waste generated in daily operation',
    name_zh: '日常營運產生的廢物類型',
    value_type: 'TEXT',
  },
  {
    code: 'WASTE_HANDLING_PROCESS',
    category: 'WASTE_MGMT',
    gri_code: 'GRI 306-2',
    hkex_code: 'HKEx A1.3;A1.6;A3.1',
    name_en: 'Process for handling waste and recyclables',
    name_zh: '廢物及可回收物處理程序',
    value_type: 'TEXT',
  },

  // --- Facility / organization ---
  {
    code: 'GFA',
    category: 'FACILITY_ORG',
    gri_code: 'GRI 302-3',
    hkex_code: 'HKEx A2.1',
    name_en: 'Gross floor area of building(s)',
    name_zh: '樓宇總樓面面積',
    value_type: 'NUMERIC',
    default_unit: 'M2',
  },
  {
    code: 'STAFF_HEADCOUNT',
    category: 'FACILITY_ORG',
    name_en: 'Number of staff',
    name_zh: '員工人數',
    value_type: 'COUNT',
    default_unit: 'NO',
    dimensions: ['GENDER', 'EMPLOYMENT_TYPE'],
  },
  {
    code: 'ANNUAL_REVENUE',
    category: 'FACILITY_ORG',
    name_en: 'Annual revenue',
    name_zh: '年度收入',
    value_type: 'NUMERIC',
    default_unit: 'HKD',
  },
  {
    code: 'INDIVIDUAL_TRANSACTION_AMOUNT',
    category: 'FACILITY_ORG',
    name_en: 'Individual transaction amount',
    name_zh: '個別交易金額',
    value_type: 'NUMERIC',
    default_unit: 'HKD',
  },
];
