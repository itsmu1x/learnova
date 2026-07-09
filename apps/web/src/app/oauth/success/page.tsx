'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Container, Spinner } from '@learnova/ui';
import { useAuth } from '@/lib/auth-context';

export default function OAuthSuccessPage() {
  const { refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    void refresh().then(() => router.replace('/dashboard'));
  }, [refresh, router]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Spinner className="h-8 w-8" />
      <p className="text-slate-500">Signing you in…</p>
    </Container>
  );
}
