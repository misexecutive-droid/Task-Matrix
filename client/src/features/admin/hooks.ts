import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext"
import { adminApi, type CreateUserPayload } from "../../api/admin"


const USER_KEYS = {
    all: ["admin-users"] as const,
    detail: (id: string) => ["admin-users", id] as const,
};

export const useUsersQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: USER_KEYS.all,
        queryFn: () => adminApi.getAll(token!).then(r => r.data),
        enabled: !token,
    });

};


export const useCreateUserMutation = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
            adminApi.update(id, payload, token!).then(r => r.data),

        onSuccess: (updated) => {
            queryClient.setQueryData(USER_KEYS.detail(updated.id), updated);
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all })
        },

    });

};


export const useDeleteUserMutation = () => {
    const { token } = useAuth()
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.delete(id, token!),
        onSuccess: (_data, id) => {
            queryClient.removeQueries({ queryKey: USER_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: USER.KEYS.all })
        }
    })
}
