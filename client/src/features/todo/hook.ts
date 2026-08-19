import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { todoApi, type CreateTodoPayload, type UpdateTodoPayload } from "@/api/todos";
import { toast } from "sonner";

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const TODO_KEY = {
    all: ["todos"] as const,
};

export const useTodosQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: TODO_KEY.all,
        queryFn: () => todoApi.getAll().then(r => r.data),
        enabled: !!token,
    });
};

export const useCreateTodoMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateTodoPayload) => todoApi.create(payload).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TODO_KEY.all });
            toast.success("Todo added");
        },
        onError: (err) => toast.error(errorMessage(err, "Failed to add todo")),
    });
};

export const useUpdateTodoMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTodoPayload }) =>
            todoApi.update(id, payload).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TODO_KEY.all });
        },
        onError: (err) => toast.error(errorMessage(err, "Failed to update todo")),
    });
};

export const useDeleteTodoMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => todoApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TODO_KEY.all });
            toast.success("Todo removed");
        },
        onError: (err) => toast.error(errorMessage(err, "Failed to remove todo")),
    });
};
