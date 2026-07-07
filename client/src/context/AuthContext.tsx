import { createContext, useContext, useEffect, useState } from 'react';
import type { Role } from '../api/auth';
import { tokenStore } from '../lib/tokenStore';

type User = { id: string; name: string; email: string; role: Role };

type AuthContextType = {
  user:   User | null;
  token:  string | null;
  login:  (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = 'tm-user';

const loadUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); }
  catch { return null; }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [user,  setUser]  = useState<User | null>(loadUser);

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe(setToken);
    return () => { unsubscribe(); };
  }, []);

  const login = (t: string, u: User) => {
    tokenStore.set(t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    tokenStore.set(null);
    localStorage.removeItem(USER_KEY);
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
