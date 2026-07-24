'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Container } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ url: string }>('/payments/checkout/subscription', { method: 'POST' });
      window.location.href = res.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="landing-mesh min-h-[70vh]">
      <Container className="py-16 md:py-24">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-signal">Pricing</p>
        <h1 className="mt-3 max-w-xl font-display text-4xl font-semibold tracking-tight text-paper-ink md:text-5xl dark:text-white">
          Pay for access, not noise.
        </h1>
        <p className="mt-4 max-w-lg text-paper-mute">
          Start free. Upgrade when you want every Pro course unlocked.
        </p>

        <div className="mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="border border-paper-line bg-paper-elev p-8 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="font-display text-xl font-semibold text-paper-ink dark:text-white">Free</h2>
            <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-paper-ink dark:text-white">
              $0
            </p>
            <ul className="mt-8 space-y-3 text-sm text-paper-mute">
              {['Free courses', 'AI tutor', 'Certificates', 'Buy courses individually'].map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-signal">→</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-signal bg-paper-elev p-8 dark:bg-slate-950">
            <h2 className="font-display text-xl font-semibold text-signal">Pro</h2>
            <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-paper-ink dark:text-white">
              $19
              <span className="text-base font-medium text-paper-mute"> / month</span>
            </p>
            <ul className="mt-8 space-y-3 text-sm text-paper-mute">
              {['Everything in Free', 'All Pro courses', 'Priority AI tutor', 'New courses monthly'].map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-signal">→</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-10 w-full rounded-md" onClick={subscribe} disabled={loading}>
              {loading ? 'Redirecting…' : 'Go Pro'}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
