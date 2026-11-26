'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button, Container } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const FREE = ['Every free course', 'AI tutor in every lesson', 'Certificates you can share', 'Buy any paid course on its own'];
const PRO = ['Everything in Free', 'Every Pro course, included', 'Priority answers from the AI tutor', 'New Pro courses every month'];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ url: string }>('/payments/checkout/subscription', { method: 'POST' });
      window.location.href = res.url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-paper-ink md:text-6xl dark:text-white">
          Start free. Go Pro when you want everything.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-paper-mute">
          Free courses stay free. Pro unlocks every Pro course and puts your tutor questions first.
        </p>
      </div>

      {/* One panel, split in two: the plans read as a direct comparison and fill the width. */}
      <div className="mx-auto mt-14 grid max-w-5xl overflow-hidden rounded-4xl border border-paper-line md:grid-cols-2">
        <section className="flex flex-col bg-paper-elev p-8 md:p-12">
          <h2 className="font-display text-2xl font-semibold text-paper-ink dark:text-white">Free</h2>
          <p className="mt-1 text-paper-mute">For trying Learnova and learning at your own pace.</p>
          <p className="mt-8 font-display text-6xl font-semibold tracking-tight text-paper-ink dark:text-white">
            $0
            <span className="ml-1 text-base font-medium tracking-normal text-paper-mute">forever</span>
          </p>
          <ul className="mt-8 space-y-3.5 text-paper-ink dark:text-slate-200">
            {FREE.map((f) => (
              <li key={f} className="flex gap-3">
                <Check size={20} className="shrink-0 text-signal dark:text-signal-bright" />
                {f}
              </li>
            ))}
          </ul>
          <Link href={user ? '/courses' : '/register'} className="mt-auto pt-10">
            <Button size="lg" variant="outline" className="w-full">
              {user ? 'Browse free courses' : 'Create a free account'}
            </Button>
          </Link>
        </section>

        <section className="relative flex flex-col overflow-hidden bg-paper-ink p-8 text-white md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-signal/40 blur-3xl"
          />
          <div className="relative flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold">Pro</h2>
            <span className="rounded-full bg-marigold px-2.5 py-0.5 text-xs font-bold text-paper-ink">Best value</span>
          </div>
          <p className="relative mt-1 text-white/60">For learning across the whole catalog.</p>
          <p className="relative mt-8 font-display text-6xl font-semibold tracking-tight">
            $19
            <span className="ml-1 text-base font-medium tracking-normal text-white/55">/ month</span>
          </p>
          <ul className="relative mt-8 space-y-3.5 text-white/85">
            {PRO.map((f) => (
              <li key={f} className="flex gap-3">
                <Check size={20} className="shrink-0 text-marigold" />
                {f}
              </li>
            ))}
          </ul>
          <div className="relative mt-auto pt-10">
            <Button
              size="lg"
              className="w-full bg-marigold text-paper-ink hover:bg-white"
              onClick={subscribe}
              disabled={loading}
            >
              {loading ? 'Opening checkout…' : 'Go Pro'}
            </Button>
            {error ? (
              <p role="alert" className="mt-3 text-center text-sm text-red-300">
                {error}
              </p>
            ) : (
              <p className="mt-3 text-center text-sm text-white/50">Cancel any time. You keep Pro until the period ends.</p>
            )}
          </div>
        </section>
      </div>
    </Container>
  );
}
