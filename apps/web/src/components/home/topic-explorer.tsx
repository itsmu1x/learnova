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
  const [active, setActive] = useState(topics[0]?.slug ?? 'development');
  const activeTopic = topics.find((t) => t.slug === active) ?? topics[0];

  const filtered = useMemo(() => {
    const match = courses.filter((c) => c.category?.slug === active);
    if (match.length > 0) return match.slice(0, 4);
    return courses.slice(0, 4);
  }, [active, courses]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Course topics"
        className="flex gap-1 overflow-x-auto border-b border-[#D8DCE6] dark:border-slate-700 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              className={`relative shrink-0 px-4 py-3 font-display text-sm font-semibold transition ${
                selected
                  ? 'text-[#0B0D12] dark:text-white'
                  : 'text-[#5C6578] hover:text-[#0B0D12] dark:hover:text-white'
              }`}
            >
              {topic.name}
              {'courseCount' in topic && topic.courseCount > 0 ? (
                <span className="ml-1.5 text-xs font-medium opacity-50">{topic.courseCount}</span>
              ) : null}
              {selected ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#0057FF]" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="tabpanel">
        {filtered.length > 0 ? (
          filtered.map((course) => <CourseCard key={course.id} course={course} />)
        ) : (
          <p className="col-span-full text-[#5C6578]">
            No courses in this topic yet.{' '}
            <Link href="/courses" className="font-semibold text-[#0057FF] hover:underline">
              Browse all
            </Link>
          </p>
        )}
      </div>

      <div className="mt-6">
        <Link
          href={`/search?q=${encodeURIComponent(activeTopic?.name ?? '')}`}
          className="font-display text-sm font-semibold text-[#0057FF] underline-offset-4 hover:underline dark:text-[#4D8BFF]"
        >
          Explore {activeTopic?.name ?? 'topic'} →
        </Link>
      </div>
    </div>
  );
}
