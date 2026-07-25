import { tokenStore } from '../lib/tokenStore';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5050';

// The refresh token is single-use (rotated server-side on every call), so two tabs racing to
// refresh at once will make the loser reuse an already-revoked token and get force-logged-out —
// this happens routinely since the access token only lives 15 minutes. `navigator.locks`
// serializes refresh attempts across every tab/worker on this origin; whichever tab loses the
// race for the lock then notices `staleToken` no longer matches the (now-rotated) stored token
// and just reuses that instead of calling the endpoint a second time with a dead token.
const refreshAccessToken = (staleToken: string | null): Promise<string | null> => {
  const doRefresh = async () => {
    const latest = tokenStore.get();
    if (latest && latest !== staleToken) return latest;

    try {
      const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      const newToken = data.accessToken as string;
      tokenStore.set(newToken);
      return newToken;
    } catch {
      return null;
    }
  };

  if ('locks' in navigator) {
    return navigator.locks.request('tm-auth-refresh', doRefresh);
  }
  return doRefresh();
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
    const newToken = await refreshAccessToken(token);
    if (newToken) {
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
