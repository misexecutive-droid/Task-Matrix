import { tokenStore } from '../lib/tokenStore';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5050';

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data.accessToken as string;
      })
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const forceLogout = () => {
  localStorage.removeItem('tm-user');
  tokenStore.set(null);
  window.location.href = '/login';
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const isAuthEndpoint = path.startsWith('/auth/');
  const token = tokenStore.get();
  // FormData bodies (file uploads) need the browser to set their own
  // `multipart/form-data; boundary=...` header — forcing 'application/json' here would corrupt them.
  const isFormData = options.body instanceof FormData;

  const doFetch = (t: string | null) =>
    fetch(`${BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch(token);

  if (res.status === 401 && token && !isAuthEndpoint) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      tokenStore.set(newToken);
      res = await doFetch(newToken);
    } else {
      forceLogout();
      throw new Error('Session expired — please log in again');
    }
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? 'Request failed');
  return data as T;
};
