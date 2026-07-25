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
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#5C6578] dark:text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8DCE6] bg-white text-[#0B0D12] transition hover:border-[#0057FF] hover:text-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8DCE6] bg-white text-[#0B0D12] transition hover:border-[#0057FF] hover:text-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <div key={course.id} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </div>
  );
}
