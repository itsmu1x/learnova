'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button, Input, Label } from '@learnova/ui';
import { AuthShell } from '@/components/auth-shell';
import { FormError } from '@/components/form-error';
import { apiFetch } from '@/lib/api';

export default function ResetPasswordPage() {
  return (
    <AuthShell mode="login">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: { token, password } });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-paper-ink dark:text-white">
          This link is incomplete
        </h1>
        <p className="mt-3 text-paper-mute">Open the link from your email again, or request a new one.</p>
        <Link href="/forgot-password" className="mt-8 inline-block">
          <Button>Request a new link</Button>
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-paper-ink dark:text-white">
          Password updated
        </h1>
        <p className="mt-3 text-paper-mute" role="status">
          You can now log in with your new password.
        </p>
        <Link href="/login" className="mt-8 inline-block">
          <Button>Log in</Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-paper-ink dark:text-white">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm text-paper-mute">At least 8 characters.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        {error ? <FormError message={error} /> : null}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-paper-mute">
        Link expired?{' '}
        <Link href="/forgot-password" className="font-semibold text-signal hover:underline dark:text-signal-bright">
          Request a new one
        </Link>
      </p>
    </>
  );
}
