'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseCard } from '@/components/course-card';
import type { CourseCard as CourseCardType } from '@/lib/types';

export function CourseShelf({
  title,
  subtitle,
  courses,
}: {
  title: string;
  subtitle?: string;
  courses: CourseCardType[];
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 720), behavior: 'smooth' });
  }

  if (courses.length === 0) return null;

  return (
    <div className="group/shelf relative">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-[2rem]">{title}</h2>
          {subtitle ? <p className="mt-1 text-paper-mute">{subtitle}</p> : null}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-paper-line text-paper-ink transition-colors hover:bg-paper-ink hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-paper-ink"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-paper-line text-paper-ink transition-colors hover:bg-paper-ink hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-paper-ink"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {courses.map((course) => (
          <div key={course.id} className="w-[272px] shrink-0 snap-start sm:w-[296px]">
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </div>
  );
}
