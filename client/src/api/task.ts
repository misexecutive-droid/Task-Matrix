import { apiFetch } from './http';
import type { TaskChecklist } from './taskChecklist';

export type TaskAttachment = {
    id:               string;
    url:              string;
    originalFilename: string | null;
    mimeType:         string;
    sizeBytes:        number;
    taskId:           string;
    uploadedBy:       { id: string; email: string; firstName: string; role: string } | null;
    createdAt:        string;
};

export type Task = {
    id:           string;
    title:        string;
    description:  string | null;
    status:       'todo' | 'in_progress' | 'pending_verification' | 'done';
    category :    'issue' | 'delegation';
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
    aiMeta?: {
        rawInput : string;
        inputMode : "voice" | "text";
        channel : "whatsapp" | "web";
        extractedAssigneeName : string | null;
        extractedDepartment : string | null;
        confidence : number | null;
        model : string | null;
    } | null;
    checklists?:  TaskChecklist[];
    attachments?: TaskAttachment[];
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


export type SmartTaskParseResult = {
    title : string;
    context : string;
    category : "issue" | "delegated_task";
    assignee : { id : string ; name : string} | null;
    assigneeRaw : string;
    departmentRaw : string;
    dueDate : string;
    priority : Task["priority"];
    confidence : number;
    wonBy : string;
    rawInput : string;
};

export type ConfirmSmartTaskPayload = {
    title : string;
    context? : string;
    category : "issue" | "delegated_task";
    priority : Task["priority"];
    dueDate : string;
    assigneeId? : string;
    departmentId? : string;
    assigneeRaw? : string;
    departmentRaw?: string;
    confidence?:number;
    rawInput:string;
    inputMode : "voice" | "text";
    wonBy? : string;
    channel: "whatsapp" | "web";
}

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

    parseSmart: (text: string) =>
        apiFetch<SmartTaskParseResult>('/tasks/ai/parse', { method: 'POST', body: JSON.stringify({ text }) }),

    createFromSmart: (payload: ConfirmSmartTaskPayload) =>
        apiFetch<Task>('/tasks/ai/create', { method: 'POST', body: JSON.stringify(payload) }),

    transcribeVoiceNote: (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice-note.webm');
        return apiFetch<{ transcript: string }>('/tasks/ai/transcribe', { method: 'POST', body: formData });
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

    uploadAttachments: (taskId: string, files: File[]) => {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        return apiFetch<ApiResponse<TaskAttachment[]>>(`/tasks/${taskId}/attachments`, {
            method: 'POST',
            body:   formData,
        });
    },

    deleteAttachment: (id: string) =>
        apiFetch<ApiResponse<{ deleted: boolean }>>(`/task-attachments/${id}`, { method: 'DELETE' }),
};
