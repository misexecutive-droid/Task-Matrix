import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { adminApi, type CreateUserPayload, type UpdateUserPayload } from "../../api/admin";
import { departmentApi, type CreateDepartmentPayload, type UpdateDepartmentPayload } from "../../api/departments";

const USER_KEYS = {
    all: ["admin-users"] as const,
    detail: (id: string) => ["admin-users", id] as const,
};

export const useUsersQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: USER_KEYS.all,
        queryFn: () => adminApi.getAll().then(r => r.data),
        enabled: !!token,
    });
};

export const useUserQuery = (id: string) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: USER_KEYS.detail(id),
        queryFn: () => adminApi.getOne(id).then(r => r.data),
        enabled: !!token && !!id,
    });
};

export const useCreateUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateUserPayload) => adminApi.create(payload).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_KEYS.all }),
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


const DEPARTMENT_KEY = {
    all: ["departments"] as const,
};

export const useDepartmentsQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: DEPARTMENT_KEY.all,
        queryFn: () => departmentApi.getAll().then(r => r.data),
        enabled: !!token,
    })
};

export const useCreateDepartmentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateDepartmentPayload) => departmentApi.create(payload).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENT_KEY.all })
    })
}

export const useUpdateDepartmentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentPayload }) =>
            departmentApi.update(id, payload).then(r => r.data),

        onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENT_KEY.all })
    })
}

export const useDeleteDepartmentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => departmentApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENT_KEY.all })
    })
}

