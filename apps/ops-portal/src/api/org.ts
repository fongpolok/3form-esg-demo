import { apiFetch } from './client';

// Minimal shape — the org endpoints return raw Prisma rows (snake_case)
// since OrgModule doesn't have DTO mapping yet (plan §11 leaves org
// admin/update flows for the Settings-screen work in Phase 5). Good enough
// for populating a client picker.
export interface ClientOption {
  id: string;
  name_en: string;
  name_zh: string;
}

export function listClients(): Promise<ClientOption[]> {
  return apiFetch<ClientOption[]>('/org/clients');
}
