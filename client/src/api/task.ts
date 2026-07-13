import { apiFetch } from './http';
import type { TaskChecklist } from './taskChecklist';

export type Task = {
    id:          string;
    title:       string;
    description: string | null;
    status:      'todo' | 'in_progress' | 'done';
    priority:    'low' | 'medium' | 'high';
    dueDate:     string | null;
    projectId:   string | null;
    assigneeId:  string | null;
    userId:      string;
    createdAt:   string;
    // Only populated by GET /tasks/:id (task detail), not the list endpoint.
    checklists?: TaskChecklist[];
};

export type CreateTaskPayload = {
    title:        string;
    description?: string;
    status?:      Task['status'];
    priority?:    Task['priority'];
    dueDate?:     string;
    projectId?:   string;
    assigneeId?:  string; 
};


export type UpdateTaskPayload = Partial<Omit<CreateTaskPayload, 'assigneeId'>> & { assigneeId?: string | null };

export const taskApi = {
    getAll: (userId?: string) => apiFetch<Task[]>(userId ? `/tasks?userId=${userId}` : '/tasks'),

    getOne: (id: string) => apiFetch<Task>(`/tasks/${id}`),

    create: (payload: CreateTaskPayload) =>
        apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),

    update: (id: string, payload: UpdateTaskPayload) =>
        apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

    delete: (id: string) =>
        apiFetch<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
};
