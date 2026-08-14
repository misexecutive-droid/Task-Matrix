import { apiFetch } from './http';

export type TaskCommentAttachment = {
    url:              string;
    originalFilename: string | null;
    mimeType:         string;
    sizeBytes:        number;
};

export type TaskCommentLocation = {
    lat:   number;
    lng:   number;
    label: string | null;
};

export type TaskComment = {
    id:         string;
    taskId:     string;
    body:       string;
    attachments: TaskCommentAttachment[];
    location:   TaskCommentLocation | null;
    authorId:   { id: string; firstName: string; lastName: string | null; email: string; role: string } | null;
    createdAt:  string;
    updatedAt:  string;
};

export type CreateTaskCommentPayload = {
    body?:     string;
    location?: { lat: number; lng: number; label?: string };
    files?:    File[];
};

export type ApiResponse<T> = { success: boolean; data: T };

export const taskCommentApi = {
    list: (taskId: string) =>
        apiFetch<ApiResponse<TaskComment[]>>(`/tasks/${taskId}/comments`).then(r => r.data),

    create: (taskId: string, payload: CreateTaskCommentPayload) => {
        const formData = new FormData();
        if (payload.body) formData.append('body', payload.body);
        if (payload.location) formData.append('location', JSON.stringify(payload.location));
        (payload.files ?? []).forEach(f => formData.append('files', f));
        return apiFetch<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments`, {
            method: 'POST',
            body:   formData,
        }).then(r => r.data);
    },
};
