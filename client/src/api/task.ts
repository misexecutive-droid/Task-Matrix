const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Types ──────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────
const authHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${token}`,
});

const request = async <T>(path: string, options: RequestInit): Promise<T> => {
    const res  = await fetch(`${BASE}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? 'Request failed');
    return data as T;
};

// ── API calls ──────────────────────────────────────────────────
export const taskApi = {
    getAll: (token: string) =>
        request<Task[]>('/tasks', {
            headers: authHeaders(token),
        }),

    getOne: (id: string, token: string) =>
        request<Task>(`/tasks/${id}`, {
            headers: authHeaders(token),
        }),

    create: (payload: CreateTaskPayload, token: string) =>
        request<Task>('/tasks', {
            method:  'POST',
            headers: authHeaders(token),
            body:    JSON.stringify(payload),
        }),

    update: (id: string, payload: UpdateTaskPayload, token: string) =>
        request<Task>(`/tasks/${id}`, {
            method:  'PATCH',
            headers: authHeaders(token),
            body:    JSON.stringify(payload),
        }),

    delete: (id: string, token: string) =>
        request<void>(`/tasks/${id}`, {
            method:  'DELETE',
            headers: authHeaders(token),
        }),
};
