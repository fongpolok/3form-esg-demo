import type { MaterialTypeDto, WorkOrderDetailDto, WorkOrderListItemDto } from '@esg/shared-types';
import type {
  AddWorkOrderMaterialInput,
  CreateWorkOrderInput,
  RecordProcessedMaterialInput,
  UpdateWorkOrderStatusInput,
} from '@esg/shared-validation';
import { apiFetch } from './client';

export function listWorkOrders(filters: { status?: string; clientId?: string } = {}): Promise<WorkOrderListItemDto[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.clientId) params.set('clientId', filters.clientId);
  const query = params.toString();
  return apiFetch<WorkOrderListItemDto[]>(`/work-orders${query ? `?${query}` : ''}`);
}

export function getWorkOrder(id: string): Promise<WorkOrderDetailDto> {
  return apiFetch<WorkOrderDetailDto>(`/work-orders/${id}`);
}

export function createWorkOrder(input: CreateWorkOrderInput): Promise<WorkOrderDetailDto> {
  return apiFetch<WorkOrderDetailDto>('/work-orders', { method: 'POST', body: JSON.stringify(input) });
}

export function updateWorkOrderStatus(id: string, input: UpdateWorkOrderStatusInput): Promise<WorkOrderDetailDto> {
  return apiFetch<WorkOrderDetailDto>(`/work-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function addWorkOrderMaterial(id: string, input: AddWorkOrderMaterialInput): Promise<WorkOrderDetailDto> {
  return apiFetch<WorkOrderDetailDto>(`/work-orders/${id}/materials`, { method: 'POST', body: JSON.stringify(input) });
}

export function recordProcessedMaterial(
  id: string,
  input: RecordProcessedMaterialInput,
): Promise<WorkOrderDetailDto> {
  return apiFetch<WorkOrderDetailDto>(`/work-orders/${id}/processed-material`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listMaterialTypes(): Promise<MaterialTypeDto[]> {
  return apiFetch<MaterialTypeDto[]>('/material-types');
}
