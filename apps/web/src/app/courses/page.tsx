'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Container, Input, Spinner } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { CourseCard } from '@/components/course-card';
import { CheckoutNotice } from '@/components/checkout-notice';
import type { CourseCard as CourseCardType } from '@/lib/types';

const LEVELS = ['', 'beginner', 'intermediate', 'advanced'];
const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Most popular'],
  ['rating', 'Top rated'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
] as const;

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ limit: '24', sort });
      if (search) params.set('search', search);
      if (level) params.set('level', level);
      apiFetch<CourseCardType[]>(`/courses?${params.toString()}`, { signal: controller.signal })
        .then(setCourses)
        .catch(() => setCourses([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, level, sort]);

  return (
    <Container className="py-12 md:py-16">
      <CheckoutNotice className="mb-8" />
      <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">All courses</h1>
      <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Every course on Learnova. Filter by level or sort to narrow it down.</p>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="rounded-full pl-10"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l ? l[0].toUpperCase() + l.slice(1) : 'All levels'}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
        >
          {SORTS.map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
        ) : courses.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-slate-300 p-14 text-center text-slate-500 dark:border-slate-700">
            No courses match that search. Try a shorter phrase or clear the level filter.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
