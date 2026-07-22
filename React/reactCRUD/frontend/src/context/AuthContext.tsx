import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { AuthUser } from '../services/authApi';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from '../services/authStorage';

interface AuthContextValue {
  user: AuthUser | null;
  token: string;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  function handleLogin(nextToken: string, nextUser: AuthUser): void {
    setToken(nextToken);
    setUser(nextUser);
    setAuthSession(nextToken, nextUser);
  }

  function handleLogout(): void {
    setToken('');
    setUser(null);
    clearAuthSession();
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login: handleLogin,
      logout: handleLogout,
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth trebuie folosit in interiorul AuthProvider');
  }

  return context;
}
