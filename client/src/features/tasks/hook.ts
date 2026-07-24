import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const TASK_KEYS = {
    // NEW: the cache key now includes which user's tasks we're looking at, so "my tasks" and
    // "some other user's tasks" (from the admin page, built later) never collide or overwrite
    // each other in React Query's cache. 'mine' is just a readable placeholder for "no filter".
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
    });
};

// Single task by id
export const useTaskQuery = (id: string) => {
    const { token } = useAuth();

    return useQuery({
        queryKey: TASK_KEYS.detail(id),
        queryFn:  () => taskApi.getOne(id),
        enabled:  !!token && !!id,
    });
};

export const useCreateTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTaskPayload) => taskApi.create(payload),
        onSuccess: () => {
            // NEW: invalidate every query starting with 'tasks', regardless of which user it was
            // scoped to — a new task could affect "my tasks" and (if assigned) someone else's view too.
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task created');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to create task')),
    });
};

export const useUpdateTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
            taskApi.update(id, payload),
        onSuccess: (updatedTask) => {
            queryClient.setQueryData(TASK_KEYS.detail(updatedTask.id), updatedTask);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task updated');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to update task')),
    });
};

// Powers the PC verification queue — tasks waiting on a given status (pending_verification),
// scoped server-side to whatever the requester is allowed to see (PC/ADMIN get their department).
export const useTasksByStatusQuery = (status: Task['status']) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['tasks', 'by-status', status],
        queryFn: () => taskApi.getAll(undefined, status),
        enabled: !!token,
    });
};

export const useVerifyTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: VerifyTaskPayload }) =>
            taskApi.verify(id, payload),
        onSuccess: (updatedTask) => {
            queryClient.setQueryData(TASK_KEYS.detail(updatedTask.id), updatedTask);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success(updatedTask.status === 'done' ? 'Task verified and marked done' : 'Task sent back');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to verify task')),
    });
};

export const useDeleteTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => taskApi.delete(id),
        onSuccess: (_data, id) => {
            queryClient.removeQueries({ queryKey: TASK_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task deleted');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to delete task')),
    });
};

// NEW — powers the "Assign to" dropdown in TaskForm.tsx. Calls the same `/users/assignable`
// endpoint that features/tickets/hook.ts's useAssignableUsersQuery already uses.
export const useAssignableUsersQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['assignable-users', 'all'],
        queryFn:  () => userApi.getAssignable().then(r => r.data),
        enabled:  !!token,
    });
};

// ── Task checklists (items, images, remarks) ──────────────────────────────
// All of these only ever affect one task's detail view, so they invalidate just that task's
// detail query key — no need to touch the list queries, since checklist progress isn't shown there.

export const useAddTaskChecklistMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateTaskChecklistPayload) =>
            taskChecklistApi.create(taskId, payload).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
            toast.success('Checklist added');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to add checklist')),
    });
};

export const useDeleteTaskChecklistMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteChecklist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
            toast.success('Checklist deleted');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to delete checklist')),
    });
};

export const useUpdateTaskChecklistItemMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskChecklistItemPayload }) =>
            taskChecklistApi.updateItem(id, payload).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
        onError: (err) => toast.error(errorMessage(err, 'Failed to update item')),
    });
};

export const useUpdateTaskItemRemarksMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
            taskChecklistApi.updateRemarks(id, remarks).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
            toast.success('Remarks saved');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to save remarks')),
    });
};

export const useCompleteTaskChecklistItemMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskChecklistApi.completeItem(id).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
            toast.success('Item marked complete');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to complete item')),
    });
};

export const useDeleteTaskChecklistItemMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
            toast.success('Item deleted');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to delete item')),
    });
};

export const useUploadTaskImagesMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, files, captureMethod }: { itemId: string; files: File[]; captureMethod: CaptureMethod }) =>
            taskChecklistApi.uploadImages(itemId, files, captureMethod).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
            toast.success('Photos uploaded');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to upload photos')),
    });
};

export const useDeleteTaskImageMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteImage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
            toast.success('Photo deleted');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to delete photo')),
    });
};

// Reusable checklist templates (managed under Admin) that can be applied to a task in one
// click instead of typing the same checklist out by hand — see features/admin/ChecklistTemplateList.tsx.
export const useChecklistTemplatesQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['checklist-templates', 'TASK'],
        queryFn: () => checklistTemplateApi.getAll('TASK').then(r => r.data),
        enabled: !!token,
    });
};

export const useApplyChecklistTemplateMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (templateId: string) => checklistTemplateApi.applyToTask(taskId, templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
            toast.success('Template applied');
        },
        onError: (err) => toast.error(errorMessage(err, 'Failed to apply template')),
    });
};
