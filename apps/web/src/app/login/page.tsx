'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
      <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-[#0B0D12] dark:text-white sm:text-3xl">
        Welcome back
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5C6578] dark:text-slate-400">
        Log in to continue learning.
      </p>

      <div className="mt-9 grid grid-cols-2 gap-3">
        <a href={`${API_URL}/auth/oauth/google`}>
          <Button
            variant="outline"
            className="w-full rounded-none border-[#D8DCE6] bg-transparent hover:border-[#0057FF] dark:border-slate-600"
          >
            Google
          </Button>
        </a>
        <a href={`${API_URL}/auth/oauth/github`}>
          <Button
            variant="outline"
            className="w-full gap-2 rounded-none border-[#D8DCE6] bg-transparent hover:border-[#0057FF] dark:border-slate-600"
          >
            <Github size={16} /> GitHub
          </Button>
        </a>
      </div>

      <div className="my-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5C6578]">
        <span className="h-px flex-1 bg-[#D8DCE6] dark:bg-slate-700" />
        or
        <span className="h-px flex-1 bg-[#D8DCE6] dark:bg-slate-700" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-[#5C6578]">Email</span>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-none border-[#D8DCE6] bg-white focus-visible:ring-[#0057FF] dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-[#5C6578]">Password</span>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="rounded-none border-[#D8DCE6] bg-white focus-visible:ring-[#0057FF] dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        {error ? (
          <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full rounded-none" size="lg" disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-[#5C6578] dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-[#0057FF] hover:underline dark:text-[#4D8BFF]">
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
