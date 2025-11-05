'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, getSession } from '../../lib/api-client';

type UserRole = 'admin' | 'user';

interface AuthUser {
  username: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  csrfToken: string | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: {
    authenticated: boolean;
    user?: AuthUser;
    csrfToken?: string;
  };
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialSession?.user ?? null);
  const [csrfToken, setCsrfToken] = useState<string | null>(initialSession?.csrfToken ?? null);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (session.authenticated && session.user) {
        setUser(session.user);
        setCsrfToken(session.csrfToken ?? null);
      } else {
        setUser(null);
        setCsrfToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSession) {
      refresh().catch(() => {
        setUser(null);
        setCsrfToken(null);
      });
    }
  }, [initialSession, refresh]);

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      setLoading(true);
      try {
        const response = await apiFetch<{
          user: AuthUser;
          csrfToken: string;
        }>('/api/auth/login', {
          method: 'POST',
          body: credentials
        });
        setUser(response.user);
        setCsrfToken(response.csrfToken);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (!csrfToken) return;
    setLoading(true);
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        csrfToken
      });
    } finally {
      setUser(null);
      setCsrfToken(null);
      setLoading(false);
    }
  }, [csrfToken]);

  const value = useMemo(
    () => ({
      user,
      csrfToken,
      loading,
      login,
      logout,
      refresh
    }),
    [user, csrfToken, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
