import { apiFetch } from './http';
import type { TaskChecklist } from './taskChecklist';

export type Task = {
    id:           string;
    title:        string;
    description:  string | null;
    status:       'todo' | 'in_progress' | 'pending_verification' | 'done';
    priority:     'low' | 'medium' | 'high';
    dueDate:      string | null;
    projectId:    string | null;
    assigneeId:   string | null;
    departmentId: string | null;
    userId:       string;
    createdAt:    string;
    verifiedBy:       string | null;
    verifiedAt:       string | null;
    verificationNote: string | null;
    // Only populated by GET /tasks/:id (task detail), not the list endpoint.
    checklists?: TaskChecklist[];
};

export type CreateTaskPayload = {
    title:         string;
    description?:  string;
    status?:       Task['status'];
    priority?:     Task['priority'];
    dueDate?:      string;
    projectId?:    string;
    assigneeId?:   string;
    departmentId?: string;
};


export type UpdateTaskPayload = Partial<Omit<CreateTaskPayload, 'assigneeId' | 'departmentId'>> & {
    assigneeId?: string | null;
    departmentId?: string | null;
};

export type VerifyTaskPayload = { action: 'APPROVE' | 'REJECT'; note?: string };

export type ComplianceReportRow = {
    bucket: string;
    totalItems: number;
    doneItems: number;
    completionRate: number | null;
    itemsRequiringPhotos: number;
    qualityRate: number | null;
};

export type ApiResponse<T> = { success: boolean; data: T };

export const taskApi = {
    getAll: (userId?: string, status?: Task['status']) => {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        if (status) params.set('status', status);
        const qs = params.toString();
        return apiFetch<Task[]>(qs ? `/tasks?${qs}` : '/tasks');
    },

    getOne: (id: string) => apiFetch<Task>(`/tasks/${id}`),

    create: (payload: CreateTaskPayload) =>
        apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),

    update: (id: string, payload: UpdateTaskPayload) =>
        apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

    verify: (id: string, payload: VerifyTaskPayload) =>
        apiFetch<Task>(`/tasks/${id}/verify`, { method: 'PATCH', body: JSON.stringify(payload) }),

    delete: (id: string) =>
        apiFetch<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),

    getComplianceReport: (groupBy: 'hour' | 'day' | 'week' | 'month' | 'year' = 'month', from?: string, to?: string) => {
        const params = new URLSearchParams({ groupBy });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return apiFetch<ApiResponse<ComplianceReportRow[]>>(`/tasks/reports/compliance?${params.toString()}`);
    },
};
