import { boolean, success } from "zod/v4";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'

export type Role = "ADMIN" | "MANAGER" | "AGENT" | "USER";

export type AuthUser = {
    id: string;
    email: string;
    role: Role;
    firstName: string | null;
}

export type AuthResponse = {
    accessToken: string;
    user: AuthUser;
}

export type LoginPayload = { email: string; password: string };
export type SignupPayload = { firstName: string; email: string; password: string; }

const post = async<T>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,

    })

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Request failed")
    return data as T;
}

export const authApi = {
    login: (p: LoginPayload) => post<AuthResponse>('/auth/login', p),
    register: (p: SignupPayload) => post<AuthResponse>('/auth/register', p),
    refresh: () => post<AuthResponse>("/auth/refresh"),
    logout: () => post<{ success: boolean }>("/auth/logout"),
}