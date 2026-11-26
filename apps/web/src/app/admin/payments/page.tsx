'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '@learnova/shared';
import { Badge, Button } from '@learnova/ui';
import { apiFetch, apiFetchWithMeta } from '@/lib/api';
import { Protected } from '@/components/protected';
import { useAuth } from '@/lib/auth-context';
import { Pager } from '@/components/admin/pager';

interface PaymentRow {
  payment: {
    id: string;
    amountCents: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'refunded';
    createdAt: string;
    refundedAt: string | null;
  };
  user: { id: string; name: string; email: string };
  purchase: { type: 'course' | 'subscription' | null; courseId: string | null } | null;
  course: { title: string | null } | null;
}

const LIMIT = 20;
const STATUS: Record<PaymentRow['payment']['status'], 'success' | 'warning' | 'default'> = {
  succeeded: 'success',
  pending: 'warning',
  failed: 'default',
  refunded: 'default',
};

export default function AdminPaymentsPage() {
  return (
    <Protected permission="VIEW_PAYMENTS">
      <Payments />
    </Protected>
  );
}

function Payments() {
  const { can } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    setStatus('loading');
    apiFetchWithMeta<PaymentRow[]>(`/payments?page=${page}&limit=${LIMIT}`)
      .then(({ data, meta }) => {
        setRows(data);
        setTotalPages(Number(meta?.totalPages ?? 1));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [page]);

  useEffect(load, [load]);

  async function refund(row: PaymentRow) {
    const what = row.course?.title ? `“${row.course.title}”` : 'this payment';
    const access = row.purchase?.type === 'course' ? ' They will lose access to the course.' : '';
    if (!confirm(`Refund ${formatPrice(row.payment.amountCents)} to ${row.user.name} for ${what}?${access}`)) return;
    setBusy(row.payment.id);
    setMessage(null);
    try {
      await apiFetch(`/payments/${row.payment.id}/refund`, { method: 'POST' });
      setMessage({ ok: true, text: `Refunded ${formatPrice(row.payment.amountCents)} to ${row.user.name}.` });
      load();
    } catch (err) {
      setMessage({ ok: false, text: `Refund failed: ${(err as Error).message}` });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">
          Payments
        </h1>
        <p className="mt-1 text-slate-500">Course purchases and Pro payments, newest first.</p>
      </div>

      {message ? (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={`rounded-2xl px-4 py-3 text-sm ${
            message.ok
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {status === 'loading' && rows.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Loading payments…</p>
        ) : status === 'error' ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Couldn&apos;t load payments.</p>
            <Button className="mt-4" variant="outline" onClick={load}>
              Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">For</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.payment.id}>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                      {new Date(r.payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 dark:text-white">{r.user.name}</p>
                      <p className="text-slate-500">{r.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                      {r.purchase?.type === 'subscription' ? 'Learnova Pro' : (r.course?.title ?? 'Course (removed)')}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {formatPrice(r.payment.amountCents)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS[r.payment.status]} className="capitalize">
                        {r.payment.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {r.payment.status === 'succeeded' && can('MANAGE_PAYMENTS') ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy !== null}
                          onClick={() => void refund(r)}
                        >
                          {busy === r.payment.id ? 'Refunding…' : 'Refund'}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
