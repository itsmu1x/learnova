'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Input, Label } from '@learnova/ui';
import { AuthShell } from '@/components/auth-shell';
import { apiFetch } from '@/lib/api';
import { FormError } from '@/components/form-error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="login">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-paper-ink dark:text-white">
        Reset your password
      </h1>
      {sent ? (
        <p className="mt-4 leading-relaxed text-paper-mute" role="status">
          If an account exists for <span className="font-semibold text-paper-ink dark:text-white">{email}</span>, we
          sent a link to reset its password. The link works once. Check your spam folder if it doesn&apos;t arrive in a
          few minutes.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-paper-mute">
            Enter the email you signed up with and we&apos;ll send you a reset link.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {error ? <FormError message={error} /> : null}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        </>
      )}
      <p className="mt-8 text-sm text-paper-mute">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-signal hover:underline dark:text-signal-bright">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
