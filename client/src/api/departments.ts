import { apiFetch } from './http';

export type Department = {
  id: string;
  name: string;
  isActive: boolean;
};

export type ApiResponse<T> = { success: boolean; data: T };


export type CreateDepartmentPayload = {
  name: string;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload> & { isActive?: boolean };


export const departmentApi = {
  getAll: () => apiFetch<ApiResponse<Department[]>>('/departments'),

  // POST /departments -- server rejects this with 403 unless you're ADMIN (see lookModule.ts's)
  //  `router.use(authenticate , requireRole("ADMIN"))` line, which run before the POST/PATCH/DELETE routes).
  create: (payload: CreateDepartmentPayload) =>
    apiFetch<ApiResponse<Department>>('/departments', { method: "POST", body: JSON.stringify(payload) }),

  //PATCH /departmetns/:id -- partials update, same ADMIN-only rule applies.
  update: (id: string, payload: UpdateDepartmentPayload) =>
    apiFetch<ApiResponse<Department>>(`/departments/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

   delete: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/departments/${id}` , {method : "DELETE"})

};

