type Listener = (token: string | null) => void;

const TOKEN_KEY = 'tm-token';

let currentToken: string | null = localStorage.getItem(TOKEN_KEY);
const listeners = new Set<Listener>();

export const tokenStore = {
  get: () => currentToken,

  set: (token: string | null) => {
    currentToken = token;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    listeners.forEach(l => l(token));
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
