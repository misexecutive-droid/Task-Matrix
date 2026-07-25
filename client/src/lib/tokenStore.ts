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

// Another tab refreshing (or logging out) writes TOKEN_KEY to localStorage — pick that up here so
// this tab's in-memory cache never trails behind what another tab already rotated to.
window.addEventListener('storage', e => {
  if (e.key !== TOKEN_KEY) return;
  currentToken = e.newValue;
  listeners.forEach(l => l(currentToken));
});
