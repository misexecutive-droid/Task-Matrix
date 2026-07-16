import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { adminApi, type CreateUserPayload, type UpdateUserPayload } from "../../api/admin";
import { departmentApi, type CreateDepartmentPayload, type UpdateDepartmentPayload } from "../../api/departments";
import {
    checklistTemplateApi,
    type ChecklistTemplateTarget,
    type CreateChecklistTemplatePayload,
    type UpdateChecklistTemplatePayload,
    type CreateChecklistTemplateItemPayload,
    type UpdateChecklistTemplateItemPayload,
} from "../../api/checklistTemplates";
import { settingApi , type UpdateSettingsPayload } from "../../api/settings";
import { toast } from "sonner";

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const USER_KEYS = {
    all: ["admin-users"] as const,
    detail: (id: string) => ["admin-users", id] as const,
};

const SETTINGS_KEY = {
    all : ["settings"] as const,
};

export const useSettingsQuery = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey : SETTINGS_KEY.all,
        queryFn : () => settingApi.get().then(r => r.data),
        enabled : !!token,
    })
};

export const useUpdateSettingsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : (payload : UpdateSettingsPayload) => settingApi.update(payload).then(r => r.data),
        onSuccess : (updated ) => {
            queryClient.setQueryData(SETTINGS_KEY.all, updated)
            toast.success("Settings updated")
        },

        onError: (err) => toast.error(errorMessage(err, "Failed to update settings")),
    })
}
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


const CHECKLIST_TEMPLATE_KEY = {
    all: (appliesTo?: ChecklistTemplateTarget) => ["checklist-templates", appliesTo ?? "all"] as const,
};

export const useChecklistTemplatesQuery = (appliesTo?: ChecklistTemplateTarget) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: CHECKLIST_TEMPLATE_KEY.all(appliesTo),
        queryFn: () => checklistTemplateApi.getAll(appliesTo).then(r => r.data),
        enabled: !!token,
    })
};

const invalidateAllTemplateLists = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });

export const useCreateChecklistTemplateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateChecklistTemplatePayload) => checklistTemplateApi.create(payload).then(r => r.data),
        onSuccess: () => invalidateAllTemplateLists(queryClient),
    })
};

export const useUpdateChecklistTemplateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateChecklistTemplatePayload }) =>
            checklistTemplateApi.update(id, payload).then(r => r.data),
        onSuccess: () => invalidateAllTemplateLists(queryClient),
    })
};

export const useDeleteChecklistTemplateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => checklistTemplateApi.delete(id),
        onSuccess: () => invalidateAllTemplateLists(queryClient),
    })
};

export const useAddChecklistTemplateItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ templateId, payload }: { templateId: string; payload: CreateChecklistTemplateItemPayload }) =>
            checklistTemplateApi.addItem(templateId, payload).then(r => r.data),
        onSuccess: () => invalidateAllTemplateLists(queryClient),
    })
};

export const useUpdateChecklistTemplateItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateChecklistTemplateItemPayload }) =>
            checklistTemplateApi.updateItem(id, payload).then(r => r.data),
        onSuccess: () => invalidateAllTemplateLists(queryClient),
    })
};

export const useDeleteChecklistTemplateItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => checklistTemplateApi.deleteItem(id),
        onSuccess: () => invalidateAllTemplateLists(queryClient),
    })
};

