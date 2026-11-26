'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { cn } from '@learnova/ui';

// Stripe return URLs are built in apps/api/src/services/stripe.service.ts.
const MESSAGES: Record<string, { ok: boolean; text: string }> = {
  'purchase:success': { ok: true, text: 'Payment received. The course is now yours. Start with the first lesson.' },
  'purchase:cancelled': { ok: false, text: 'Checkout was cancelled and you weren’t charged.' },
  'subscription:success': { ok: true, text: 'You’re on Pro now. Every Pro course is unlocked.' },
};

export function CheckoutNotice({ className }: { className?: string }) {
  return (
    <Suspense>
      <Notice className={className} />
    </Suspense>
  );
}

function Notice({ className }: { className?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = ['purchase', 'subscription'].map((k) => (params.get(k) ? `${k}:${params.get(k)}` : '')).find(Boolean);
  const msg = key ? MESSAGES[key] : undefined;
  if (!msg) return null;

  const Icon = msg.ok ? CheckCircle2 : XCircle;
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium',
        msg.ok
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        className,
      )}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1">{msg.text}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => router.replace(pathname, { scroll: false })}
        className="rounded-lg p-1 opacity-70 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}
