'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Category, CourseCard as CourseCardType } from '@/lib/types';
import { CourseCard } from '@/components/course-card';

const FALLBACK_TOPICS = [
  { slug: 'development', name: 'Development', courseCount: 0 },
  { slug: 'design', name: 'Design', courseCount: 0 },
  { slug: 'business', name: 'Business', courseCount: 0 },
  { slug: 'marketing', name: 'Marketing', courseCount: 0 },
  { slug: 'data', name: 'Data & AI', courseCount: 0 },
  { slug: 'career', name: 'Career', courseCount: 0 },
];

export function TopicExplorer({
  categories,
  courses,
}: {
  categories: Category[];
  courses: CourseCardType[];
}) {
  const topics = categories.length > 0 ? categories.slice(0, 10) : FALLBACK_TOPICS;
  // Open on a topic that actually has courses to show.
  const firstWithCourses = topics.find((t) => courses.some((c) => c.category?.slug === t.slug));
  const [active, setActive] = useState(firstWithCourses?.slug ?? topics[0]?.slug ?? 'development');
  const activeTopic = topics.find((t) => t.slug === active) ?? topics[0];

  const filtered = useMemo(() => {
    // Only this topic's courses; showing others under the wrong topic is misleading.
    return courses.filter((c) => c.category?.slug === active).slice(0, 4);
  }, [active, courses]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Course topics"
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {topics.map((topic) => {
          const selected = topic.slug === active;
          return (
            <button
              key={topic.slug}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(topic.slug)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? 'border-paper-ink bg-paper-ink text-white dark:border-white dark:bg-white dark:text-paper-ink'
                  : 'border-paper-line bg-paper-elev text-paper-mute hover:border-paper-ink hover:text-paper-ink dark:hover:border-slate-300 dark:hover:text-white'
              }`}
            >
              {topic.name}
              {'courseCount' in topic && topic.courseCount > 0 ? (
                <span className="ml-1.5 text-xs font-medium opacity-50">{topic.courseCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="tabpanel">
        {filtered.length > 0 ? (
          filtered.map((course) => <CourseCard key={course.id} course={course} />)
        ) : (
          <p className="col-span-full text-paper-mute">
            No courses in this topic yet.{' '}
            <Link href="/courses" className="font-semibold text-signal hover:underline">
              Browse all
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8">
        <Link
          href={activeTopic ? `/courses?topic=${encodeURIComponent(activeTopic.slug)}` : '/courses'}
          className="font-semibold text-signal underline-offset-4 hover:underline dark:text-signal-bright"
        >
          More in {activeTopic?.name ?? 'this topic'}
        </Link>
      </div>
    </div>
  );
}
