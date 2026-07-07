import { apiFetch } from './http';

export type Task = {
    id:          string;
    title:       string;
    description: string | null;
    status:      'todo' | 'in_progress' | 'done';
    priority:    'low' | 'medium' | 'high';
    dueDate:     string | null;
    projectId:   string | null;
    createdAt:   string;
};

export type CreateTaskPayload = {
    title:        string;
    description?: string;
    status?:      Task['status'];
    priority?:    Task['priority'];
    dueDate?:     string;
    projectId?:   string;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export const taskApi = {
    getAll: () => apiFetch<Task[]>('/tasks'),

    getOne: (id: string) => apiFetch<Task>(`/tasks/${id}`),

    create: (payload: CreateTaskPayload) =>
        apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),

    update: (id: string, payload: UpdateTaskPayload) =>
        apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

    delete: (id: string) =>
        apiFetch<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
};
