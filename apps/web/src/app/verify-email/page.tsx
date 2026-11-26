'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Button, Spinner } from '@learnova/ui';
import { AuthShell } from '@/components/auth-shell';
import { apiFetch } from '@/lib/api';

export default function VerifyEmailPage() {
  return (
    <AuthShell mode="register">
      <Suspense>
        <Verify />
      </Suspense>
    </AuthShell>
  );
}

function Verify() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState('This link is missing its token. Open the link from your email again.');
  const sent = useRef(false);

  useEffect(() => {
    // Tokens are single-use; guard against React strict-mode double effects.
    if (!token || sent.current) return;
    sent.current = true;
    apiFetch('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setState('ok'))
      .catch((err: Error) => {
        setMessage(err.message);
        setState('error');
      });
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-3 text-paper-mute" role="status">
        <Spinner /> Verifying your email…
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-paper-ink dark:text-white">
        {state === 'ok' ? 'Email verified' : 'We couldn’t verify your email'}
      </h1>
      <p className="mt-3 text-paper-mute" role={state === 'ok' ? 'status' : 'alert'}>
        {state === 'ok' ? 'Thanks. Your account is all set.' : message}
      </p>
      <Link href={state === 'ok' ? '/dashboard' : '/login'} className="mt-8 inline-block">
        <Button>{state === 'ok' ? 'Go to my learning' : 'Back to log in'}</Button>
      </Link>
    </>
  );
}
