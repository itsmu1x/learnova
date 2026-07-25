'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button, Input } from '@learnova/ui';
import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/lib/auth-context';

function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;
  return score;
}

const STRENGTH = ['Too weak', 'Weak', 'Okay', 'Strong', 'Solid'] as const;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="register">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-[#0B0D12] dark:text-white sm:text-3xl">
        Create your account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5C6578] dark:text-slate-400">
        Free to start — first lesson in minutes.
      </p>

      <form onSubmit={onSubmit} className="mt-9 space-y-4">
        <label className="block space-y-1.5">
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-[#5C6578]">Full name</span>
          <Input
            placeholder="Alex Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="rounded-none border-[#D8DCE6] bg-white focus-visible:ring-[#0057FF] dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
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
            placeholder="Min 8 chars, mixed case + number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="rounded-none border-[#D8DCE6] bg-white focus-visible:ring-[#0057FF] dark:border-slate-600 dark:bg-slate-950"
          />
          {password ? (
            <div className="pt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 transition ${
                      i < score
                        ? score <= 1
                          ? 'bg-red-500'
                          : score === 2
                            ? 'bg-amber-500'
                            : 'bg-[#0057FF]'
                        : 'bg-[#D8DCE6] dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-[#5C6578] dark:text-slate-400">{STRENGTH[score]}</p>
            </div>
          ) : null}
        </label>
        {error ? (
          <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full rounded-none" size="lg" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-[#5C6578] dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#0057FF] hover:underline dark:text-[#4D8BFF]">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
