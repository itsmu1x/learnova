'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Star } from 'lucide-react';
import { Badge, Button, cn } from '@learnova/ui';
import { apiFetch, apiFetchWithMeta } from '@/lib/api';
import { Pager } from '@/components/admin/pager';
import { Protected } from '@/components/protected';

interface ReviewRow {
  review: {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    isHidden: boolean;
    createdAt: string;
  };
  user: { id: string; name: string; email: string };
  course: { id: string; title: string; slug: string };
}

type Filter = 'all' | 'visible' | 'hidden';
const LIMIT = 20;

export default function AdminReviewsPage() {
  return (
    <Protected permission="MODERATE_REVIEWS">
      <Reviews />
    </Protected>
  );
}

function Reviews() {
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus('loading');
    const hidden = filter === 'all' ? '' : `&hidden=${filter === 'hidden'}`;
    apiFetchWithMeta<ReviewRow[]>(`/reviews?page=${page}&limit=${LIMIT}${hidden}`)
      .then(({ data, meta }) => {
        setRows(data);
        setTotalPages(Number(meta?.totalPages ?? 1));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [filter, page]);

  useEffect(load, [load]);

  async function setHidden(row: ReviewRow, isHidden: boolean) {
    setBusy(row.review.id);
    setError(null);
    try {
      await apiFetch(`/reviews/${row.review.id}/moderate`, { method: 'POST', body: { isHidden } });
      // Update in place so the list doesn't jump; the course rating is recalculated server-side.
      setRows((rs) => rs.map((r) => (r.review.id === row.review.id ? { ...r, review: { ...r.review, isHidden } } : r)));
    } catch (err) {
      setError(`Couldn’t update the review: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">
            Reviews
          </h1>
          <p className="mt-1 text-slate-500">
            Hide reviews that break the rules. Hidden reviews don&apos;t show on the course or count toward its rating.
          </p>
        </div>
        <div role="group" aria-label="Filter reviews" className="flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
          {(['all', 'visible', 'hidden'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors',
                filter === f
                  ? 'bg-paper-ink text-white dark:bg-white dark:text-paper-ink'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {status === 'loading' && rows.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Loading reviews…</p>
      ) : status === 'error' ? (
        <div className="py-12 text-center">
          <p className="text-slate-500">Couldn&apos;t load reviews.</p>
          <Button className="mt-4" variant="outline" onClick={load}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-700">
          {filter === 'hidden' ? 'No hidden reviews.' : 'No reviews yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.review.id}
              className={cn(
                'rounded-3xl border bg-white p-5 dark:bg-slate-900',
                r.review.isHidden ? 'border-dashed border-slate-300 opacity-75 dark:border-slate-700' : 'border-slate-200 dark:border-slate-800',
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex" aria-label={`${r.review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i <= r.review.rating ? 'fill-marigold text-marigold' : 'text-slate-300'}
                        />
                      ))}
                    </span>
                    {r.review.isHidden ? <Badge>Hidden</Badge> : null}
                  </div>
                  {r.review.title ? (
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">{r.review.title}</p>
                  ) : null}
                  {r.review.body ? (
                    <p className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-300">{r.review.body}</p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">No written review.</p>
                  )}
                  <p className="mt-3 text-sm text-slate-500">
                    {r.user.name} ({r.user.email}) on{' '}
                    <Link href={`/courses/${r.course.slug}`} className="font-medium text-signal hover:underline dark:text-signal-bright">
                      {r.course.title}
                    </Link>
                    , {new Date(r.review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={busy !== null}
                  onClick={() => void setHidden(r, !r.review.isHidden)}
                >
                  {r.review.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  {busy === r.review.id ? 'Saving…' : r.review.isHidden ? 'Show again' : 'Hide'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
