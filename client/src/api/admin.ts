import { apiFetch } from './http';

export type Role = "ADMIN" | "MANAGER" | "AGENT" | "USER";

export type AdminUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    role: Role;
    departmentId: string | null;
    storeId: string | null;
    isActive: boolean;
    createdAt: string;
};

export type CreateUserPayload = {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    role: Role;
    departmentId?: string;
    storeId?: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & { isActive?: boolean };
export type ApiResponse<T> = { success: boolean; data: T };

export const adminApi = {
    getAll: () => apiFetch<ApiResponse<AdminUser[]>>("/users"),

    getOne: (id: string) => apiFetch<ApiResponse<AdminUser>>(`/users/${id}`),

    create: (payload: CreateUserPayload) =>
        apiFetch<ApiResponse<AdminUser>>("/users", { method: "POST", body: JSON.stringify(payload) }),

    update: (id: string, payload: UpdateUserPayload) =>
        apiFetch<ApiResponse<AdminUser>>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

    delete: (id: string) =>
        apiFetch<ApiResponse<{ deleted: boolean }>>(`/users/${id}`, { method: "DELETE" }),
};
