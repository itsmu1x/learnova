'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ShoppingCart } from 'lucide-react';
import { Button } from '@learnova/ui';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface EnrollmentStatus {
  enrolled: boolean;
  progressPercent: number;
  completed: boolean;
}

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
  const [checking, setChecking] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EnrollmentStatus | null>(null);

  const isFree = priceCents === 0 && !isPro;

  useEffect(() => {
    if (!user) {
      setStatus(null);
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    apiFetch<EnrollmentStatus>(`/enrollments/${courseId}/status`)
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, courseId]);

  async function handleClick() {
    if (!user) {
      router.push(`/login?next=/learn/${courseId}`);
      return;
    }

    if (status?.enrolled) {
      router.push(`/learn/${courseId}`);
      return;
    }

    if (isPro) {
      router.push('/pricing');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isFree) {
        await apiFetch(`/enrollments/${courseId}`, { method: 'POST' });
        router.push(`/learn/${courseId}`);
        return;
      }

        const res = await apiFetch<{ url: string }>(`/payments/checkout/course/${courseId}`, {
          method: 'POST',
          body: { client: 'web' },
        });
      window.location.href = res.url;
    } catch (e) {
      // Already enrolled (race / duplicate) → just open the course.
      if (e instanceof ApiRequestError && e.code === 'CONFLICT') {
        router.push(`/learn/${courseId}`);
        return;
      }
      setError((e as Error).message);
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <Button size="lg" className="w-full" disabled>
        Checking access…
      </Button>
    );
  }

  if (status?.enrolled) {
    const label =
      status.completed
        ? 'Visit course'
        : status.progressPercent > 0
          ? 'Continue learning'
          : 'Go to course';
    return (
      <div>
        <Button size="lg" className="w-full gap-2" onClick={handleClick}>
          <BookOpen size={18} />
          {label}
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500">
          {status.completed
            ? 'You own this course'
            : `${status.progressPercent}% complete · you already have access`}
        </p>
      </div>
    );
  }

  const label = !user
    ? isFree
      ? 'Log in to enroll'
      : isPro
        ? 'Log in for Pro access'
        : 'Log in to buy'
    : isFree
      ? 'Enroll for free'
      : isPro
        ? 'Get with Learnova Pro'
        : 'Buy this course';

  return (
    <div>
      <Button size="lg" className="w-full gap-2" onClick={handleClick} disabled={loading}>
        {!isFree && !isPro ? <ShoppingCart size={18} /> : null}
        {loading ? 'Processing…' : label}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
