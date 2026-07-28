import { apiFetch } from "./http";

export type CategoryAssignee = {
    id: string;
    firstName: String;
    lastName: string | null;
    email: string
};

export type Category = {
    id: string;
    name: string;
    isActive: boolean;
    departmentId: { id: string; name: string };
    assigneeIds: CategoryAssignee[];
    tatHours: number | null;

}

export type ApiResponse<T> = { success: boolean; data: T };

export type CreateCategoryPayload = {
    name: string;
    departmentId: string;
    assigneeIds?: string[];
    tatHours?: number | null;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload> & { isActive?: boolean };

export const categoryApi = {
    getAll: () => apiFetch<ApiResponse<Category[]>>("/categories"),
    create: (payload: CreateCategoryPayload) =>
        apiFetch<ApiResponse<Category>>("/categories", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: UpdateCategoryPayload) =>
        apiFetch<ApiResponse<Category>>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: (id: string) =>
        apiFetch<ApiResponse<{ deleted: boolean }>>(`/categories/${id}`, { method: "DELETE" })

}