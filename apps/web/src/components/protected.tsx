'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Container, Spinner } from '@learnova/ui';
import { useAuth } from '@/lib/auth-context';
import type { PermissionKey } from '@learnova/shared';

/**
 * Client-side route guard. Redirects unauthenticated users to /login and
 * blocks users lacking the required permission (page-level authorization).
 */
export function Protected({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: PermissionKey;
}) {
  const { user, loading, can } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </Container>
    );
  }

  if (permission && !can(permission)) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Access denied</h1>
        <p className="mt-2 text-slate-500">You don&apos;t have permission to view this page.</p>
      </Container>
    );
  }

  return <>{children}</>;
}
