'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@learnova/ui';
import { CourseCard } from '@/components/course-card';
import type { CourseCard as CourseCardType } from '@/lib/types';

interface Tab {
  id: string;
  label: string;
  courses: CourseCardType[];
}

const sameCourses = (a: CourseCardType[], b: CourseCardType[]) =>
  a.length === b.length && a.every((c) => b.some((d) => d.id === c.id));

/**
 * One section with Popular / New / Top rated tabs and a grid. Replaces three
 * identical scrolling rows. Tabs that would show the same courses as an earlier
 * tab are dropped, so a small catalog shows one plain grid instead of repeats.
 */
export function CourseTabs({ tabs, limit = 8 }: { tabs: Tab[]; limit?: number }) {
  const distinct = tabs.filter(
    (t, i) => t.courses.length > 0 && !tabs.slice(0, i).some((prev) => sameCourses(prev.courses, t.courses)),
  );
  const [activeId, setActiveId] = useState(distinct[0]?.id);
  const active = distinct.find((t) => t.id === activeId) ?? distinct[0];
  if (!active) return null;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Find your next course</h2>
          <p className="mt-2 text-lg text-paper-mute">
            {distinct.length > 1 ? 'Sorted the way you like.' : 'Everything on Learnova right now.'}
          </p>
        </div>
        {distinct.length > 1 ? (
          <div role="tablist" aria-label="Sort courses" className="flex gap-1 rounded-full bg-paper p-1 ring-1 ring-paper-line">
            {distinct.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === active.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  t.id === active.id
                    ? 'bg-paper-ink text-white dark:bg-white dark:text-paper-ink'
                    : 'text-paper-mute hover:text-paper-ink dark:hover:text-white',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div role="tabpanel" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {active.courses.slice(0, limit).map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      <Link
        href="/courses"
        className="mt-8 inline-flex items-center gap-1.5 font-semibold text-signal hover:underline dark:text-signal-bright"
      >
        See all courses
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
