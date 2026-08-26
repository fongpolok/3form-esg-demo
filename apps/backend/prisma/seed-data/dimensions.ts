// dimension_types + their dimension_values — the breakdowns a metric_value
// can be tagged with (plan §3c: fuel×vehicle, refrigerant type, waste
// type×handling method, staff gender×employment type, etc).
export const DIMENSION_TYPES = [
  {
    code: 'FUEL_TYPE',
    values: [
      { code: 'PETROL', name_en: 'Petrol', name_zh: '汽油' },
      { code: 'DIESEL', name_en: 'Diesel', name_zh: '柴油' },
      { code: 'LPG', name_en: 'LPG', name_zh: '石油氣' },
    ],
  },
  {
    code: 'VEHICLE_TYPE',
    values: [
      { code: 'MOTORCYCLE', name_en: 'Motorcycle', name_zh: '電單車' },
      { code: 'PASSENGER_CAR', name_en: 'Passenger Car', name_zh: '私家車' },
      { code: 'PRIVATE_VAN', name_en: 'Private Van', name_zh: '私家客貨車' },
      { code: 'PUBLIC_LIGHT_BUS', name_en: 'Public Light Bus', name_zh: '公共小巴' },
      { code: 'LIGHT_GOODS_VEHICLE', name_en: 'Light Goods Vehicle', name_zh: '輕型貨車' },
      { code: 'HEAVY_GOODS_VEHICLE', name_en: 'Heavy Goods Vehicle', name_zh: '重型貨車' },
      { code: 'MEDIUM_GOODS_VEHICLE', name_en: 'Medium Goods Vehicle', name_zh: '中型貨車' },
    ],
  },
  {
    code: 'REFRIGERANT_TYPE',
    values: [
      { code: 'R134A', name_en: 'R134a', name_zh: 'R134a' },
      { code: 'R22', name_en: 'R22', name_zh: 'R22' },
      { code: 'R404A', name_en: 'R404A', name_zh: 'R404A' },
    ],
  },
  {
    code: 'WASTE_TYPE',
    values: [
      { code: 'PAPER', name_en: 'Waste Paper', name_zh: '廢紙' },
      { code: 'METAL', name_en: 'Waste Metal', name_zh: '廢金屬' },
      { code: 'PLASTIC', name_en: 'Waste Plastic', name_zh: '廢塑膠' },
      { code: 'TREATED_WATER', name_en: 'Treated Water', name_zh: '處理過的污水' },
      { code: 'CHEMICAL_WASTE', name_en: 'Chemical Waste', name_zh: '化學廢物' },
      { code: 'FLUORESCENT_LAMP', name_en: 'Spent Fluorescent/Mercury Lamps', name_zh: '廢熒光燈管/水銀燈' },
      { code: 'TONER_CARTRIDGE', name_en: 'Toner/Inkjet Cartridge', name_zh: '碳粉/噴墨盒' },
    ],
  },
  {
    code: 'HANDLING_METHOD',
    values: [
      { code: 'RECYCLED', name_en: 'Recycled', name_zh: '回收' },
      { code: 'DISPOSED', name_en: 'Disposed', name_zh: '棄置' },
      { code: 'DISCHARGED', name_en: 'Discharged', name_zh: '排放' },
    ],
  },
  {
    code: 'GENDER',
    values: [
      { code: 'MALE', name_en: 'Male', name_zh: '男性' },
      { code: 'FEMALE', name_en: 'Female', name_zh: '女性' },
    ],
  },
  {
    code: 'EMPLOYMENT_TYPE',
    values: [
      { code: 'FULL_TIME', name_en: 'Full-time', name_zh: '全職' },
      { code: 'PART_TIME', name_en: 'Part-time', name_zh: '兼職' },
    ],
  },
  {
    code: 'PAPER_SIZE',
    values: [
      { code: 'A4', name_en: 'A4', name_zh: 'A4' },
      { code: 'A3', name_en: 'A3', name_zh: 'A3' },
    ],
  },
  {
    code: 'UTILITY',
    values: [
      { code: 'CLP', name_en: 'CLP Power', name_zh: '中華電力' },
      { code: 'HK_ELECTRIC', name_en: 'HK Electric', name_zh: '香港電燈' },
    ],
  },
] as const;
