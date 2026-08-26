// Every unit referenced by seed-data/metric-definitions.ts. unit_type is a
// free-text grouping (not a Prisma enum) used only for admin-screen display
// grouping later — not load-bearing for calculations.
export const UNITS = [
  { code: 'KWH', name_en: 'Kilowatt-hour', name_zh: '千瓦時', unit_type: 'ENERGY' },
  { code: 'GJ', name_en: 'Gigajoule', name_zh: '吉焦', unit_type: 'ENERGY' },
  { code: 'KG', name_en: 'Kilogram', name_zh: '公斤', unit_type: 'MASS' },
  { code: 'LITRE', name_en: 'Litre', name_zh: '公升', unit_type: 'VOLUME' },
  { code: 'M3', name_en: 'Cubic metre', name_zh: '立方米', unit_type: 'VOLUME' },
  { code: 'CASE', name_en: 'Case', name_zh: '宗', unit_type: 'COUNT' },
  { code: 'NO', name_en: 'Number', name_zh: '數量', unit_type: 'COUNT' },
  { code: 'REAM', name_en: 'Ream', name_zh: '令', unit_type: 'COUNT' },
  { code: 'KM', name_en: 'Kilometre', name_zh: '公里', unit_type: 'DISTANCE' },
  { code: 'HKD', name_en: 'Hong Kong Dollar', name_zh: '港元', unit_type: 'CURRENCY' },
  { code: 'M2', name_en: 'Square metre', name_zh: '平方米', unit_type: 'AREA' },
  { code: 'KG_CO2E', name_en: 'Kilogram CO2 equivalent', name_zh: '公斤二氧化碳當量', unit_type: 'MASS' },
] as const;
