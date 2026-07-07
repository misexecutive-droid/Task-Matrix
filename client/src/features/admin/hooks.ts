import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { adminApi, type CreateUserPayload, type UpdateUserPayload } from "../../api/admin";

const USER_KEYS = {
    all:    ["admin-users"]                     as const,
    detail: (id: string) => ["admin-users", id] as const,
};

export const useUsersQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: USER_KEYS.all,
        queryFn:  () => adminApi.getAll().then(r => r.data),
        enabled:  !!token,
    });
};

export const useUserQuery = (id: string) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: USER_KEYS.detail(id),
        queryFn:  () => adminApi.getOne(id).then(r => r.data),
        enabled:  !!token && !!id,
    });
};

export const useCreateUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateUserPayload) => adminApi.create(payload).then(r => r.data),
        onSuccess:  () => queryClient.invalidateQueries({ queryKey: USER_KEYS.all }),
    });
};

export const useUpdateUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
            adminApi.update(id, payload).then(r => r.data),
        onSuccess: (updated) => {
            queryClient.setQueryData(USER_KEYS.detail(updated.id), updated);
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
        },
    });
};

export const useDeleteUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.delete(id),
        onSuccess: (_data, id) => {
            queryClient.removeQueries({ queryKey: USER_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
        },
    });
};
