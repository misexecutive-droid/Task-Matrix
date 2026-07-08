import { apiFetch } from './http';

export type Role = "ADMIN" | "MANAGER" | "AGENT" | "USER";

export type AssignableUser = {
    id:        string;
    firstName: string;
    lastName:  string | null;
    email:     string;
    role:      Role;
};

export type ApiResponse<T> = { success: boolean; data: T };

export const userApi = {
    getAssignable: (departmentId?: string) =>
        apiFetch<ApiResponse<AssignableUser[]>>(
            departmentId ? `/users/assignable?departmentId=${departmentId}` : '/users/assignable'
        ),
};
