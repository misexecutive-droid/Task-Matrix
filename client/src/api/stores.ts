import { apiFetch } from './http';

export type Store = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  isActive: boolean;
};

export type ApiResponse<T> = { success: boolean; data: T };

export type CreateStorePayload = {
  name: string;
  code?: string;
  address?: string;
};

export type UpdateStorePayload = Partial<CreateStorePayload> & { isActive?: boolean };

export const storeApi = {
  getAll: () => apiFetch<ApiResponse<Store[]>>('/stores'),

  // POST /stores -- server rejects this with 403 unless you're ADMIN.
  create: (payload: CreateStorePayload) =>
    apiFetch<ApiResponse<Store>>('/stores', { method: 'POST', body: JSON.stringify(payload) }),

  // PATCH /stores/:id -- partial update, same ADMIN-only rule applies.
  update: (id: string, payload: UpdateStorePayload) =>
    apiFetch<ApiResponse<Store>>(`/stores/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  delete: (id: string) =>
    apiFetch<ApiResponse<{ delete: boolean }>>(`/stores/${id}`, { method: 'DELETE' }),
};
