// The 9 accordion sections on the data-collection Figma screen map to these
// 12 DB-level categories (Fuel and Waste split finer in the DB than in the
// UI grouping — plan §3c's note on this).
export const METRIC_CATEGORIES = [
  { code: 'COMPLIANCE', name_en: 'Compliance', name_zh: '合規', sort_order: 1 },
  { code: 'ENERGY_ELECTRICITY', name_en: 'Energy Consumption', name_zh: '能源消耗', sort_order: 2 },
  { code: 'ENERGY_FUEL_STATIONARY', name_en: 'Fuel — Stationary Sources', name_zh: '燃料—固定源', sort_order: 3 },
  { code: 'ENERGY_FUEL_MOBILE', name_en: 'Fuel — Mobile Vehicles', name_zh: '燃料—流動車輛', sort_order: 4 },
  { code: 'REFRIGERANTS', name_en: 'Refrigerants', name_zh: '雪種', sort_order: 5 },
  { code: 'WATER', name_en: 'Water', name_zh: '水', sort_order: 6 },
  { code: 'PAPER', name_en: 'Paper Use', name_zh: '紙張使用', sort_order: 7 },
  { code: 'GHG_SCOPE1', name_en: 'Greenhouse Gas Emissions — Direct (Scope 1)', name_zh: '溫室氣體排放—直接(範圍一)', sort_order: 8 },
  { code: 'WASTE_NONHAZ', name_en: 'Non-hazardous Waste', name_zh: '非有害廢物', sort_order: 9 },
  { code: 'WASTE_HAZ', name_en: 'Hazardous Waste', name_zh: '有害廢物', sort_order: 10 },
  { code: 'WASTE_MGMT', name_en: 'Waste Management', name_zh: '廢物管理', sort_order: 11 },
  { code: 'FACILITY_ORG', name_en: 'Facility & Organization Info', name_zh: '設施及機構資料', sort_order: 12 },
] as const;
