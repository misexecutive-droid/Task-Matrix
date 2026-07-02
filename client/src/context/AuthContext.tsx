import { createContext, useContext, useState } from 'react';

type User = { id: string; name: string; email: string };

// shape of the authentication context used by the app
// includes the current user, auth token, and helper functions
// to sign in or sign out
type AuthContextType = {
  user:   User | null;
  token:  string | null;
  login:  (token: string, user: User) => void;
  logout: () => void;
};

// the React context that stores auth state and actions
const AuthContext = createContext<AuthContextType | null>(null);

// keys for persisting auth data in local storage
const TOKEN_KEY = 'tm-token';
const USER_KEY  = 'tm-user';

// restore saved user object from local storage when app loads
const loadUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); }
  catch { return null; }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState<User | null>(loadUser);

  const login = (t: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};