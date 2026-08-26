import type { WorkOrderListItemDto } from '@esg/shared-types';
import { apiFetch } from './client';

export function listWorkOrders(clientId: string): Promise<WorkOrderListItemDto[]> {
  return apiFetch(`/work-orders?clientId=${clientId}`);
}
