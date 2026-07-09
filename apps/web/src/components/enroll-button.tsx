'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export function EnrollButton({
  courseId,
  priceCents,
  isPro,
}: {
  courseId: string;
  priceCents: number;
  isPro: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFree = priceCents === 0 && !isPro;

  async function handleClick() {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isFree) {
        await apiFetch(`/enrollments/${courseId}`, { method: 'POST' });
        router.push(`/learn/${courseId}`);
      } else {
        const res = await apiFetch<{ url: string }>(`/payments/checkout/course/${courseId}`, {
          method: 'POST',
        });
        window.location.href = res.url;
      }
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="lg" className="w-full" onClick={handleClick} disabled={loading}>
        {loading ? 'Processing…' : isFree ? 'Enroll for free' : 'Buy this course'}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
