// The intermediate model ReportBuilderService assembles before rendering —
// kept as its own file so the HTML template and the builder both import
// the same shape instead of one inferring it from the other.
export interface ReportMetricBreakdownRow {
  dimensions: Array<{ type: string; value: string }>;
  numericTotal: number | null;
  textValues: string[];
}

export interface ReportMetricRow {
  code: string;
  nameEn: string;
  nameZh: string;
  griCode: string | null;
  hkexCode: string | null;
  unit: string | null;
  rows: ReportMetricBreakdownRow[];
}

export interface ReportSectionModel {
  categoryCode: string;
  nameEn: string;
  nameZh: string;
  metrics: ReportMetricRow[];
}

export interface EmissionFactorCitation {
  code: string;
  factorValue: string;
  factorUnit: string;
  sourceReference: string | null;
}

export interface ReportModel {
  facilityNameEn: string;
  facilityNameZh: string;
  clientNameEn: string | null;
  templateNameEn: string;
  audience: 'OFFICIAL' | 'CLIENT_SELF_SERVICE';
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  sections: ReportSectionModel[];
  derived: {
    electricityGJ: number | null;
    refrigerantCO2eKg: number | null;
    clientTreesSaved: number | null;
    clientCo2SavedKg: number | null;
  };
  emissionFactorsUsed: EmissionFactorCitation[];
}
