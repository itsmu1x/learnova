'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button, Card, CardBody, Container } from '@learnova/ui';
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
    <Container className="py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Simple, transparent pricing</h1>
        <p className="mt-3 text-slate-500">Start free, or unlock everything with Learnova Pro.</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardBody className="p-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Free</h2>
            <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">$0</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {['Access to free courses', 'AI tutor', 'Certificates', 'Buy courses individually'].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> {f}</li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="border-indigo-300 ring-1 ring-indigo-200 dark:border-indigo-800">
          <CardBody className="p-8">
            <h2 className="text-xl font-semibold text-indigo-600">Learnova Pro</h2>
            <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">$19<span className="text-base font-normal text-slate-500">/mo</span></p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {['Everything in Free', 'Unlimited access to all Pro courses', 'Priority AI tutor', 'New courses every month'].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> {f}</li>
              ))}
            </ul>
            <Button className="mt-8 w-full" onClick={subscribe} disabled={loading}>
              {loading ? 'Redirecting…' : 'Go Pro'}
            </Button>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
