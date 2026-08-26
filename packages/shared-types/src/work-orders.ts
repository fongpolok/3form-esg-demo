// Mirrors the enum of the same name in @esg/shared-validation — duplicated
// (not imported) to keep shared-types dependency-free of shared-validation,
// since both are leaf packages other apps depend on independently.
export type WorkOrderStatus =
  | 'ORDER_RECEIVED'
  | 'PICKUP_SCHEDULED'
  | 'IN_TRANSIT'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MaterialTypeDto {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
}

export interface WorkOrderMaterialDto {
  id: string;
  materialType: MaterialTypeDto;
  weightKg: string;
  productType: string | null;
  recordedAt: string;
}

export interface ProcessedMaterialDto {
  id: string;
  outputWeightKg: string;
  scrapWeightKg: string;
  recordedAt: string;
}

export interface StageEventDto {
  id: string;
  stage: WorkOrderStatus;
  occurredAt: string;
  note: string | null;
}

export interface WorkOrderListItemDto {
  id: string;
  wipNo: string;
  wipDate: string;
  status: WorkOrderStatus;
  clientName: string | null;
  materials: WorkOrderMaterialDto[];
}

export interface WorkOrderDetailDto extends WorkOrderListItemDto {
  facilityId: string;
  clientId: string | null;
  wipTime: string;
  stageEvents: StageEventDto[];
  processedMaterial: ProcessedMaterialDto | null;
}
