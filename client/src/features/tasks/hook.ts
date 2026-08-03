import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { taskApi } from "../../api/task";
import { userApi } from "../../api/users"; // NEW — needed for the assignee picker
import { taskChecklistApi } from "../../api/taskChecklist";
import { checklistTemplateApi } from "../../api/checklistTemplates";
import type { CreateTaskPayload, UpdateTaskPayload, VerifyTaskPayload, Task } from "../../api/task";
import type {
    CreateTaskChecklistPayload,
    UpdateTaskChecklistItemPayload,
    CaptureMethod,
} from "../../api/taskChecklist";
import { handleQueryRetry, useEntityMutation } from "../../lib/queryHelpers";

const TASK_KEYS = {
    // The cache key includes which user's tasks we're looking at, so "my tasks" and "some other
    // user's tasks" (from the admin page) never collide or overwrite each other in the cache.
    // 'mine' is just a readable placeholder for "no filter".
    all:    (userId?: string) => ['tasks', userId ?? 'mine'] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
};

// List tasks — optionally scoped to one specific user's tasks (that scoping is admin-only,
// enforced server-side in task.service.ts; a non-admin passing a userId here is just ignored).
export const useTasksQuery = (userId?: string) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: TASK_KEYS.all(userId),
        queryFn:  () => taskApi.getAll(userId),
        enabled:  !!token,
        retry: handleQueryRetry,
    });
};

// Checklist completion rate over time — role-scoped server-side (ADMIN/PC get the org-wide
// or department view, everyone else only ever sees their own tasks). Powers the dashboard's
// Monthly Target gauge.
export const useComplianceReportQuery = (groupBy: 'hour' | 'day' | 'week' | 'month' = 'month', from?: string, to?: string) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['tasks', 'compliance', groupBy, from, to],
        queryFn: () => taskApi.getComplianceReport(groupBy, from, to).then(r => r.data),
        enabled: !!token,
        retry: handleQueryRetry,
    });
};

// Single task by id
export const useTaskQuery = (id: string) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: TASK_KEYS.detail(id),
        queryFn:  () => taskApi.getOne(id),
        enabled:  !!token && !!id,
        retry: handleQueryRetry,
    });
};

export const useCreateTaskMutation = () =>
    useEntityMutation({
        mutationFn: (payload: CreateTaskPayload) => taskApi.create(payload),
        invalidateKeys: [['tasks']],
        successMessage: 'Task created',
        errorFallback: 'Failed to create task',
    });

// General files (pdf/csv/image/video) attached directly to a task — separate from checklist
// items' own required-photo evidence flow, so these only ever touch this one task's detail query.
export const useUploadTaskAttachmentsMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: (files: File[]) => taskApi.uploadAttachments(taskId, files).then(r => r.data),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Files attached',
        errorFallback: 'Failed to upload files',
    });

export const useDeleteTaskAttachmentMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: (id: string) => taskApi.deleteAttachment(id),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Attachment removed',
        errorFallback: 'Failed to remove attachment',
    });

export const useUpdateTaskMutation = () =>
    useEntityMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
            taskApi.update(id, payload),
        setDetailData: (updatedTask) => ({ key: TASK_KEYS.detail(updatedTask.id), data: updatedTask }),
        invalidateKeys: [['tasks']],
        successMessage: 'Task updated',
        errorFallback: 'Failed to update task',
    });

// Powers the PC verification queue — tasks waiting on a given status (pending_verification),
// scoped server-side to whatever the requester is allowed to see (PC/ADMIN get their department).
export const useTasksByStatusQuery = (status: Task['status']) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['tasks', 'by-status', status],
        queryFn: () => taskApi.getAll(undefined, status),
        enabled: !!token,
        retry: handleQueryRetry,
    });
};

export const useVerifyTaskMutation = () =>
    useEntityMutation({
        mutationFn: ({ id, payload }: { id: string; payload: VerifyTaskPayload }) =>
            taskApi.verify(id, payload),
        setDetailData: (updatedTask) => ({ key: TASK_KEYS.detail(updatedTask.id), data: updatedTask }),
        invalidateKeys: [['tasks']],
        successMessage: (updatedTask) => (updatedTask.status === 'done' ? 'Task verified and marked done' : 'Task sent back'),
        errorFallback: 'Failed to verify task',
    });

export const useDeleteTaskMutation = () =>
    useEntityMutation({
        mutationFn: (id: string) => taskApi.delete(id),
        removeKey: (_result, id) => TASK_KEYS.detail(id),
        invalidateKeys: [['tasks']],
        successMessage: 'Task deleted',
        errorFallback: 'Failed to delete task',
    });

// NEW — powers the "Assign to" dropdown in TaskForm.tsx. Calls the same `/users/assignable`
// endpoint that features/tickets/hook.ts's useAssignableUsersQuery already uses.
export const useAssignableUsersQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['assignable-users', 'all'],
        queryFn:  () => userApi.getAssignable().then(r => r.data),
        enabled:  !!token,
        retry: handleQueryRetry,
    });
};

// ── Task checklists (items, images, remarks) ──────────────────────────────
// All of these only ever affect one task's detail view, so they invalidate just that task's
// detail query key — no need to touch the list queries, since checklist progress isn't shown there.

export const useAddTaskChecklistMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: (payload: CreateTaskChecklistPayload) => taskChecklistApi.create(taskId, payload).then(r => r.data),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Checklist added',
        errorFallback: 'Failed to add checklist',
    });

export const useDeleteTaskChecklistMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteChecklist(id),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Checklist deleted',
        errorFallback: 'Failed to delete checklist',
    });

export const useUpdateTaskChecklistItemMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskChecklistItemPayload }) =>
            taskChecklistApi.updateItem(id, payload).then(r => r.data),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        errorFallback: 'Failed to update item',
    });

export const useUpdateTaskItemRemarksMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
            taskChecklistApi.updateRemarks(id, remarks).then(r => r.data),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Remarks saved',
        errorFallback: 'Failed to save remarks',
    });

export const useCompleteTaskChecklistItemMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: (id: string) => taskChecklistApi.completeItem(id).then(r => r.data),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Item marked complete',
        errorFallback: 'Failed to complete item',
    });

export const useDeleteTaskChecklistItemMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteItem(id),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Item deleted',
        errorFallback: 'Failed to delete item',
    });

export const useUploadTaskImagesMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: ({ itemId, files, captureMethod }: { itemId: string; files: File[]; captureMethod: CaptureMethod }) =>
            taskChecklistApi.uploadImages(itemId, files, captureMethod).then(r => r.data),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Photos uploaded',
        errorFallback: 'Failed to upload photos',
    });

export const useDeleteTaskImageMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteImage(id),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Photo deleted',
        errorFallback: 'Failed to delete photo',
    });

// Reusable checklist templates (managed under Admin) that can be applied to a task in one
// click instead of typing the same checklist out by hand — see features/admin/ChecklistTemplateList.tsx.
export const useChecklistTemplatesQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['checklist-templates', 'TASK'],
        queryFn: () => checklistTemplateApi.getAll('TASK').then(r => r.data),
        enabled: !!token,
        retry: handleQueryRetry,
    });
};

export const useApplyChecklistTemplateMutation = (taskId: string) =>
    useEntityMutation({
        mutationFn: (templateId: string) => checklistTemplateApi.applyToTask(taskId, templateId),
        invalidateKeys: [TASK_KEYS.detail(taskId)],
        successMessage: 'Template applied',
        errorFallback: 'Failed to apply template',
    });
