import { apiFetch } from './http';

export type Project = {
    id:          string;
    name:        string;
    description: string | null;
    ownerId:     string;
    memberIds:   string[];
    createdAt:   string;
};

export type CreateProjectPayload = { name: string; description?: string; memberIds?: string[] };
export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export type ApiResponse<T> = { success: boolean; data: T };

export const projectApi = {
    getAll: () => apiFetch<ApiResponse<Project[]>>("/projects"),

    getOne: (id: string) => apiFetch<ApiResponse<Project>>(`/projects/${id}`),

    create: (payload: CreateProjectPayload) =>
        apiFetch<ApiResponse<Project>>("/projects", { method: "POST", body: JSON.stringify(payload) }),

    update: (id: string, payload: UpdateProjectPayload) =>
        apiFetch<ApiResponse<Project>>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

    delete: (id: string) =>
        apiFetch<ApiResponse<{ deleted: boolean }>>(`/projects/${id}`, { method: "DELETE" }),
};
