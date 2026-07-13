import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { taskApi } from "../../api/task";
import { userApi } from "../../api/users"; // NEW — needed for the assignee picker
import { taskChecklistApi } from "../../api/taskChecklist";
import type { CreateTaskPayload, UpdateTaskPayload } from "../../api/task";
import type {
    CreateTaskChecklistPayload,
    UpdateTaskChecklistItemPayload,
    CaptureMethod,
} from "../../api/taskChecklist";

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
        },
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
        },
    });
};

export const useDeleteTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => taskApi.delete(id),
        onSuccess: (_data, id) => {
            queryClient.removeQueries({ queryKey: TASK_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
    });
};

export const useDeleteTaskChecklistMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteChecklist(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
    });
};

export const useUpdateTaskChecklistItemMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskChecklistItemPayload }) =>
            taskChecklistApi.updateItem(id, payload).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
    });
};

export const useUpdateTaskItemRemarksMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
            taskChecklistApi.updateRemarks(id, remarks).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
    });
};

export const useCompleteTaskChecklistItemMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskChecklistApi.completeItem(id).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
    });
};

export const useDeleteTaskChecklistItemMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteItem(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
    });
};

export const useUploadTaskImagesMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, files, captureMethod }: { itemId: string; files: File[]; captureMethod: CaptureMethod }) =>
            taskChecklistApi.uploadImages(itemId, files, captureMethod).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
    });
};

export const useDeleteTaskImageMutation = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskChecklistApi.deleteImage(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) }),
    });
};
