'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Permission, hasPermission as hasPermBit, type PermissionKey } from '@learnova/shared';
import { apiFetch } from './api';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: PermissionKey) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setUser(result.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await apiFetch<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: PermissionKey) => {
      if (!user) return false;
      return hasPermBit(BigInt(user.permissions), Permission[permission]);
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: loadMe, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
