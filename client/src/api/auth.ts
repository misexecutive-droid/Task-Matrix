import { apiFetch } from './http';

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT' | 'USER';

export type AuthUser = {
  id:        string;
  email:     string;
  role:      Role;
  firstName: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user:        AuthUser;
};

export type LoginPayload  = { email: string; password: string };
export type SignupPayload = { firstName: string; email: string; password: string };

export const authApi = {
  login:    (p: LoginPayload)  => apiFetch<AuthResponse>('/auth/login',    { method: 'POST', body: JSON.stringify(p) }),
  register: (p: SignupPayload) => apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(p) }),
  refresh:  ()                 => apiFetch<AuthResponse>('/auth/refresh',  { method: 'POST' }),
  logout:   ()                 => apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' }),
};
