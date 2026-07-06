const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Role = "ADMIN" | "MANAGER" | "AGENT" | "USER"

export type AdminUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    role: Role;
    departmentId: string | null;
    storeId: string | null;
    isActive: boolean;
    createAt: string
}

export type CreateUserPayload = {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    role: Role;
    departmentId?: string;
    storeId?: string
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & { isActive?: boolean };
export type ApiResponse<T> = { success: boolean; data: T }

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

const request = async <T>(path: string, options: RequestInit): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, options);
    if (!res.ok) throw new Error(data?.message ?? "Request failed");
    return data as T;
}

export const adminApi = {
    getAll: (token: string) =>
        request<ApiResponse<AdminUer[]>>("/users", { headers: authHeaders(token) }),

    getOne: (id: string, token: string) =>
        request<ApiResponse<AdminUser[]>>(`/users/${id}`, { headers: authHeaders(token) }),

    update: (id: string, payload: UpdateUserPayload, token: string) =>
        request<ApiResponse<AdminUser>>(`/users/${id}`, {
            method: "PATCH",
            headers: authHeaders(token),
            body: JSON.stringify(payload)
        }),

    delete: (id: string, token: string) =>
        request<ApiResponse<{ deleted: boolean }>>(`/users/${id}`, {
            method: "DELETE",
            headers: authHeaders(token),

        })
}