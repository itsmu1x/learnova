'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Permission, hasPermission as hasPermBit, type PermissionKey } from '@learnova/shared';
import { ApiRequestError, apiFetch, refreshAuthSession } from './api';
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

/** Quietly rotate tokens while the tab is open; stay well under JWT_ACCESS_TTL. */
const PROACTIVE_REFRESH_MS = 6 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;

  const loadMe = useCallback(async (opts?: { allowClear?: boolean }) => {
    const allowClear = opts?.allowClear ?? true;
    try {
      const me = await apiFetch<AuthUser>('/auth/me');
      setUser(me);
      return true;
    } catch (err) {
      const unauthorized = err instanceof ApiRequestError && err.status === 401;
      if (unauthorized) {
        // apiFetch already tried refresh once; treat as signed out.
        if (allowClear) setUser(null);
        return false;
      }
      // Network / 5xx — keep the existing in-memory session.
      if (!userRef.current && allowClear) setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe({ allowClear: true });
  }, [loadMe]);

  // Quiet background refresh — never log the user out on failure.
  useEffect(() => {
    const warmSession = () => {
      if (!userRef.current) return;
      void refreshAuthSession();
    };

    const id = window.setInterval(warmSession, PROACTIVE_REFRESH_MS);

    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !userRef.current) return;
      void (async () => {
        await refreshAuthSession();
        // Re-sync profile if possible; ignore failures so a blip doesn't kick you out.
        await loadMe({ allowClear: false });
      })();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuthRefresh: true,
    });
    setUser(result.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await apiFetch<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      skipAuthRefresh: true,
    });
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST', skipAuthRefresh: true }).catch(() => undefined);
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: () => loadMe({ allowClear: true }).then(() => undefined), can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
