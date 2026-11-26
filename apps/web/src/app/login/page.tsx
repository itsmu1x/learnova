'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Github } from 'lucide-react';
import { Button, Input } from '@learnova/ui';
import { AuthShell } from '@/components/auth-shell';
import { DemoAccounts } from '@/components/demo-accounts';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    // Read once on mount; useSearchParams would force a Suspense boundary for this one flag.
    if (new URLSearchParams(window.location.search).get('password') === 'changed') {
      setNotice('Password changed. Log in with your new password.');
    }
  }, []);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="login">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-paper-ink dark:text-white sm:text-3xl">
        Welcome back
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-paper-mute dark:text-slate-400">
        Log in to continue learning.
      </p>

      <div className="mt-9 grid grid-cols-2 gap-3">
        <a href={`${API_URL}/auth/oauth/google`}>
          <Button
            variant="outline"
            className="w-full"
          >
            Google
          </Button>
        </a>
        <a href={`${API_URL}/auth/oauth/github`}>
          <Button
            variant="outline"
            className="w-full gap-2"
          >
            <Github size={16} /> GitHub
          </Button>
        </a>
      </div>

      <div className="my-7 flex items-center gap-3 text-[11px] font-semibold text-paper-mute">
        <span className="h-px flex-1 bg-paper-line dark:bg-slate-700" />
        or
        <span className="h-px flex-1 bg-paper-line dark:bg-slate-700" />
      </div>

      {notice ? (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-paper-ink dark:text-slate-200">Email</span>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
           
          />
        </label>
        <label className="block space-y-1.5">
          <span className="flex items-center justify-between text-sm font-medium text-paper-ink dark:text-slate-200">
            Password
            <Link href="/forgot-password" className="font-semibold text-signal hover:underline dark:text-signal-bright">
              Forgot password?
            </Link>
          </span>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
           
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-paper-mute dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-signal hover:underline dark:text-signal-bright">
          Sign up
        </Link>
      </p>
      <DemoAccounts
        onPick={(email, password) => {
          setEmail(email);
          setPassword(password);
          setError(null);
        }}
      />
    </AuthShell>
  );
}
