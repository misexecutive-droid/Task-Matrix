import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { taskApi } from "../../api/task";
import type { CreateTaskPayload, UpdateTaskPayload } from "../../api/task";

const TASK_KEYS = {
    all:    ['tasks']                    as const,
    detail: (id: string) => ['tasks', id] as const,
};

// List all tasks
export const useTasksQuery = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: TASK_KEYS.all,
        queryFn:  () => taskApi.getAll(),
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
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
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
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
        },
    });
};

export const useDeleteTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => taskApi.delete(id),
        onSuccess: (_data, id) => {
            queryClient.removeQueries({ queryKey: TASK_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
        },
    });
};
