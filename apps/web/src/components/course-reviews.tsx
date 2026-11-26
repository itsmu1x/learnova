'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { Button, Input, Spinner, Textarea, cn } from '@learnova/ui';
import { apiFetch, apiFetchWithMeta } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FormError } from '@/components/form-error';

interface ReviewRow {
  review: { id: string; userId: string; rating: number; title: string | null; body: string | null; createdAt: string };
  user: { id: string; name: string; avatarUrl: string | null };
}

const PAGE = 10;

/** Course reviews: summary, the viewer's own review (write / edit / delete), then everyone else's. */
export function CourseReviews({
  courseId,
  averageRating,
  ratingCount,
}: {
  courseId: string;
  averageRating: number;
  ratingCount: number;
}) {
  const { user, loading: authLoading, can } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [enrolled, setEnrolled] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async (p: number) => {
    setStatus('loading');
    try {
      const { data, meta } = await apiFetchWithMeta<ReviewRow[]>(`/reviews/course/${courseId}?page=${p}&limit=${PAGE}`);
      setRows((prev) => (p === 1 ? data : [...prev, ...data]));
      setTotal(Number(meta?.total ?? data.length));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [courseId]);

  useEffect(() => {
    void load(1);
  }, [load]);

  useEffect(() => {
    if (!user) return setEnrolled(false);
    apiFetch<{ enrolled: boolean }>(`/enrollments/${courseId}/status`)
      .then((s) => setEnrolled(s.enrolled))
      .catch(() => setEnrolled(false));
  }, [user, courseId]);

  // The list is newest-first and paged, so the viewer's own review may not be on page 1.
  const [mine, setMine] = useState<ReviewRow | null>(null);
  useEffect(() => {
    if (!user) return setMine(null);
    const found = rows.find((r) => r.review.userId === user.id);
    if (found) return setMine(found);
    if (!enrolled || status !== 'ready' || rows.length >= total) return;
    // shortcut: scans the newest 100 reviews; add a GET /reviews/course/:id/mine endpoint if courses get more.
    apiFetch<ReviewRow[]>(`/reviews/course/${courseId}?limit=100`)
      .then((all) => setMine(all.find((r) => r.review.userId === user.id) ?? null))
      .catch(() => undefined);
  }, [rows, user, enrolled, status, total, courseId]);

  async function afterChange() {
    setEditing(false);
    setPage(1);
    await load(1);
    router.refresh(); // the server-rendered average in the course header
  }

  async function remove() {
    if (!mine || !confirm('Delete your review?')) return;
    try {
      await apiFetch(`/reviews/${mine.review.id}`, { method: 'DELETE' });
      setMine(null);
      await afterChange();
    } catch (err) {
      alert(`Couldn’t delete your review: ${(err as Error).message}`);
    }
  }

  const others = rows.filter((r) => r.review.userId !== user?.id);
  const canWrite = Boolean(user && enrolled && can('WRITE_REVIEW'));

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Reviews</h2>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="font-display text-5xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {ratingCount ? averageRating.toFixed(1) : '–'}
        </p>
        <div>
          <Stars rating={Math.round(averageRating)} size={20} />
          <p className="mt-0.5 text-sm text-slate-500">
            {ratingCount ? `${ratingCount} rating${ratingCount === 1 ? '' : 's'}` : 'No ratings yet'}
          </p>
        </div>
      </div>

      {/* Viewer's own review, or how to leave one */}
      <div className="mt-6">
        {authLoading ? null : !user ? (
          <p className="text-slate-500">
            <Link href="/login" className="font-semibold text-signal hover:underline dark:text-signal-bright">
              Log in
            </Link>{' '}
            to review this course.
          </p>
        ) : !canWrite ? (
          <p className="text-slate-500">Only learners enrolled in this course can review it.</p>
        ) : editing || !mine ? (
          <ReviewForm
            courseId={courseId}
            initial={mine?.review}
            onCancel={mine ? () => setEditing(false) : undefined}
            onSaved={afterChange}
          />
        ) : (
          <div className="rounded-3xl border-2 border-signal/30 bg-signal-soft/50 p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-signal dark:text-signal-bright">Your review</p>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove()}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </div>
            <ReviewBody row={mine} />
          </div>
        )}
      </div>

      {/* Everyone else */}
      <div className="mt-6 space-y-3">
        {status === 'loading' && rows.length === 0 ? (
          <Spinner />
        ) : status === 'error' ? (
          <p className="text-slate-500">
            Couldn&apos;t load reviews.{' '}
            <button type="button" className="font-semibold text-signal hover:underline" onClick={() => void load(1)}>
              Try again
            </button>
          </p>
        ) : others.length === 0 && !mine ? (
          <p className="text-slate-500">No reviews yet.</p>
        ) : (
          others.map((r) => (
            <article key={r.review.id} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <ReviewBody row={r} />
            </article>
          ))
        )}
        {rows.length < total ? (
          <Button
            variant="outline"
            disabled={status === 'loading'}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void load(next);
            }}
          >
            {status === 'loading' ? 'Loading…' : 'Show more reviews'}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function ReviewBody({ row }: { row: ReviewRow }) {
  const { review, user } = row;
  return (
    <>
      <div className="flex items-center gap-3">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-signal-soft font-semibold text-signal dark:text-signal-bright">
            {user.name[0]?.toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{user.name}</p>
          <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
        </div>
        <Stars rating={review.rating} className="ml-auto" />
      </div>
      {review.title ? <p className="mt-3 font-semibold text-slate-900 dark:text-white">{review.title}</p> : null}
      {review.body ? (
        <p className="mt-1 whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">{review.body}</p>
      ) : null}
    </>
  );
}

function ReviewForm({
  courseId,
  initial,
  onSaved,
  onCancel,
}: {
  courseId: string;
  initial?: ReviewRow['review'];
  onSaved: () => Promise<void>;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError('Pick a star rating first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/reviews/course/${courseId}`, {
        method: 'POST',
        body: { rating, ...(title.trim() ? { title: title.trim() } : {}), ...(body.trim() ? { body: body.trim() } : {}) },
      });
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">{initial ? 'Edit your review' : 'Rate this course'}</p>
        <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} star${i === 1 ? '' : 's'}: ${LABELS[i]}`}
              onMouseEnter={() => setHover(i)}
              onClick={() => setRating(i)}
              className="rounded-md p-0.5"
            >
              <Star
                size={30}
                className={cn(
                  'transition-colors',
                  i <= (hover || rating) ? 'fill-marigold text-marigold' : 'text-slate-300 dark:text-slate-600',
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-slate-500">{LABELS[hover || rating]}</span>
        </div>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={220} placeholder="Headline (optional)" aria-label="Headline" />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        rows={4}
        placeholder="What did you learn? Who would you recommend it to? (optional)"
        aria-label="Your review"
      />
      {error ? <FormError message={error} /> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Posting…' : initial ? 'Save review' : 'Post review'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Stars({ rating, size = 16, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={cn('flex shrink-0', className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'fill-marigold text-marigold' : 'text-slate-300 dark:text-slate-600'}
        />
      ))}
    </span>
  );
}
