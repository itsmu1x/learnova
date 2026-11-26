'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, PlayCircle, Search, User, X } from 'lucide-react';
import { Button, Container, cn } from '@learnova/ui';
import { apiFetch, apiFetchWithMeta } from '@/lib/api';
import { CheckoutNotice } from '@/components/checkout-notice';
import { CourseCard } from '@/components/course-card';
import type { Category, CourseCard as CourseCardType } from '@/lib/types';

const LEVELS = [
  ['', 'Any level'],
  ['beginner', 'Beginner'],
  ['intermediate', 'Intermediate'],
  ['advanced', 'Advanced'],
] as const;
const SORTS = [
  ['popular', 'Most popular'],
  ['newest', 'Newest'],
  ['rating', 'Top rated'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
] as const;
const PAGE = 24;

interface SearchItem {
  id: string;
  title: string;
  subtitle: string | null;
  slug?: string;
}
interface Extra {
  lessons: SearchItem[];
  instructors: SearchItem[];
}

export default function CoursesPage() {
  return (
    <Suspense>
      <CourseSearch />
    </Suspense>
  );
}

/**
 * Catalog + search. All state lives in the URL so results are shareable:
 * ?q= free text (title, topic, instructor, description), ?topic= category slug, ?level=, ?sort=.
 */
function CourseSearch() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get('q') ?? '';
  const topic = params.get('topic') ?? '';
  const level = params.get('level') ?? '';
  const sort = params.get('sort') ?? 'popular';

  const [input, setInput] = useState(q);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<CourseCardType[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [extra, setExtra] = useState<Extra | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setParams = useCallback(
    (next: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) (v ? sp.set(k, v) : sp.delete(k));
      sp.delete('purchase');
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Keep the box in sync when the URL changes from elsewhere (back button, links).
  useEffect(() => setInput(q), [q]);

  // Debounce typing into ?q=.
  useEffect(() => {
    if (input.trim() === q) return;
    const t = setTimeout(() => setParams({ q: input.trim() }), 300);
    return () => clearTimeout(t);
  }, [input, q, setParams]);

  useEffect(() => {
    apiFetch<Category[]>('/categories').then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => setLimit(PAGE), [q, topic, level, sort]);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setStatus('loading');
      const sp = new URLSearchParams({ limit: String(limit), sort });
      if (q) sp.set('search', q);
      if (topic) sp.set('category', topic);
      if (level) sp.set('level', level);
      apiFetchWithMeta<CourseCardType[]>(`/courses?${sp}`, { signal })
        .then(({ data, meta }) => {
          setCourses(data);
          setTotal(Number(meta?.total ?? data.length));
          setStatus('ready');
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') setStatus('error');
        });
    },
    [q, topic, level, sort, limit],
  );

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  // Lessons and instructors that match the text, shown under the course results.
  useEffect(() => {
    if (q.length < 2) {
      setExtra(null);
      return;
    }
    const c = new AbortController();
    apiFetch<Extra>(`/search?q=${encodeURIComponent(q)}&limit=6`, { signal: c.signal })
      .then(setExtra)
      .catch(() => setExtra(null));
    return () => c.abort();
  }, [q]);

  const activeTopic = categories.find((c) => c.slug === topic);
  const filtered = Boolean(q || topic || level);
  const summary = useMemo(() => {
    const parts = [`${total} course${total === 1 ? '' : 's'}`];
    if (q) parts.push(`matching “${q}”`);
    if (topic) parts.push(`in ${activeTopic?.name ?? topic}`);
    if (level) parts.push(`for ${level} learners`);
    return parts.join(' ');
  }, [total, q, topic, level, activeTopic]);

  return (
    <Container className="py-12 md:py-16">
      <CheckoutNotice className="mb-8" />
      <h1 className="font-display text-4xl font-semibold tracking-tight text-paper-ink md:text-5xl dark:text-white">
        {activeTopic ? activeTopic.name : 'Find a course'}
      </h1>
      <p className="mt-2 max-w-xl text-lg text-paper-mute">
        {activeTopic?.description ?? 'Search by course, topic or instructor, then narrow it down.'}
      </p>

      {/* Search */}
      <form
        role="search"
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ q: input.trim() });
        }}
      >
        <label htmlFor="course-search" className="sr-only">
          Search courses
        </label>
        <div className="flex items-center gap-3 rounded-full border border-paper-line bg-paper-elev py-1.5 pl-5 pr-1.5 shadow-[0_12px_32px_-20px_rgba(15,26,58,0.35)] focus-within:border-signal focus-within:ring-4 focus-within:ring-signal/15">
          <Search size={20} className="shrink-0 text-paper-mute" />
          <input
            ref={inputRef}
            id="course-search"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try “typescript”, “design” or an instructor’s name"
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-paper-ink outline-none placeholder:text-paper-mute dark:text-white [&::-webkit-search-cancel-button]:hidden"
          />
          {input ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setInput('');
                setParams({ q: '' });
                inputRef.current?.focus();
              }}
              className="rounded-full p-2 text-paper-mute hover:bg-paper-ink/5 hover:text-paper-ink dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          ) : null}
          <Button type="submit" className="hidden sm:inline-flex">
            Search
          </Button>
        </div>
      </form>

      {/* Topics */}
      {categories.length > 0 ? (
        <div role="group" aria-label="Topics" className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip selected={!topic} onClick={() => setParams({ topic: '' })}>
            All topics
          </Chip>
          {categories.map((c) => (
            <Chip key={c.slug} selected={topic === c.slug} onClick={() => setParams({ topic: topic === c.slug ? '' : c.slug })}>
              {c.name}
              {c.courseCount > 0 ? <span className="ml-1.5 opacity-60">{c.courseCount}</span> : null}
            </Chip>
          ))}
        </div>
      ) : null}

      {/* Level + sort + summary */}
      <div className="mt-6 flex flex-col gap-4 border-b border-paper-line pb-5 md:flex-row md:items-center md:justify-between">
        <p className="text-paper-mute" aria-live="polite">
          {status === 'ready' ? summary : 'Searching…'}
          {filtered ? (
            <button
              type="button"
              onClick={() => {
                setInput('');
                setParams({ q: '', topic: '', level: '' });
              }}
              className="ml-3 font-semibold text-signal hover:underline dark:text-signal-bright"
            >
              Clear filters
            </button>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Level" className="scrollbar-none flex max-w-full overflow-x-auto rounded-full bg-paper p-1 ring-1 ring-paper-line">
            {LEVELS.map(([value, label]) => (
              <button
                key={value || 'any'}
                type="button"
                aria-pressed={level === value}
                onClick={() => setParams({ level: value })}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                  level === value
                    ? 'bg-paper-ink text-white dark:bg-white dark:text-paper-ink'
                    : 'text-paper-mute hover:text-paper-ink dark:hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setParams({ sort: e.target.value === 'popular' ? '' : e.target.value })}
            className="h-10 rounded-full border border-paper-line bg-paper-elev px-4 text-sm font-semibold text-paper-ink dark:text-white"
          >
            {SORTS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        {status === 'error' ? (
          <Empty title="Couldn’t load courses" body="Check your connection and try again.">
            <Button onClick={() => load()}>Try again</Button>
          </Empty>
        ) : status === 'loading' && courses.length === 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-[320px] animate-pulse rounded-3xl bg-paper-line/60" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Empty
            title={q ? `No courses match “${q}”` : 'No courses here yet'}
            body={
              topic || level
                ? 'Try removing a filter, or search all topics.'
                : 'Try a shorter word, a topic like “design”, or an instructor’s name.'
            }
          >
            {topic || level ? (
              <Button variant="outline" onClick={() => setParams({ topic: '', level: '' })}>
                Search all topics and levels
              </Button>
            ) : null}
          </Empty>
        ) : (
          <>
            <div
              className={cn(
                'grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-4',
                status === 'loading' && 'opacity-60',
              )}
            >
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            {courses.length < total ? (
              <div className="mt-10 flex justify-center">
                <Button variant="outline" onClick={() => setLimit((l) => Math.min(l + PAGE, 100))} disabled={status === 'loading' || limit >= 100}>
                  Show more courses
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Lessons / instructors that match the text */}
      {extra && (extra.lessons.length > 0 || extra.instructors.length > 0) ? (
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {extra.lessons.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold text-paper-ink dark:text-white">Lessons</h2>
              <ul className="mt-3 divide-y divide-paper-line rounded-3xl border border-paper-line bg-paper-elev">
                {extra.lessons.map((l) => (
                  <li key={l.id}>
                    <Link href={`/courses/${l.slug}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-paper/60">
                      <PlayCircle size={18} className="shrink-0 text-signal dark:text-signal-bright" />
                      <span className="line-clamp-1 font-medium text-paper-ink dark:text-white">{l.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {extra.instructors.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold text-paper-ink dark:text-white">Instructors</h2>
              <ul className="mt-3 divide-y divide-paper-line rounded-3xl border border-paper-line bg-paper-elev">
                {extra.instructors.map((i) => (
                  <li key={i.id}>
                    <Link href={`/instructors/${i.id}`} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-paper/60">
                      <User size={18} className="shrink-0 text-paper-mute" />
                      <span className="min-w-0">
                        <span className="block font-medium text-paper-ink dark:text-white">{i.title}</span>
                        {i.subtitle ? <span className="block truncate text-sm text-paper-mute">{i.subtitle}</span> : null}
                      </span>
                      <span className="ml-auto shrink-0 text-sm font-semibold text-signal dark:text-signal-bright">View profile</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </Container>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
        selected
          ? 'border-paper-ink bg-paper-ink text-white dark:border-white dark:bg-white dark:text-paper-ink'
          : 'border-paper-line bg-paper-elev text-paper-mute hover:border-paper-ink hover:text-paper-ink dark:hover:border-slate-300 dark:hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function Empty({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-4xl border border-dashed border-paper-line px-6 py-16 text-center">
      <BookOpen size={32} className="text-paper-mute" />
      <h2 className="mt-4 font-display text-2xl font-semibold text-paper-ink dark:text-white">{title}</h2>
      <p className="mt-2 max-w-md text-paper-mute">{body}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
