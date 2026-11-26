'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Play, Star } from 'lucide-react';
import { formatPrice } from '@learnova/shared';
import type { CourseCard as CourseCardType } from '@/lib/types';

export function FeaturedSpotlight({ courses }: { courses: CourseCardType[] }) {
  const picks = courses.slice(0, 4);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (picks.length < 2 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % picks.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [picks.length, paused]);

  if (picks.length === 0) return null;

  const course = picks[index]!;

  return (
    <div
      className={`grid overflow-hidden rounded-4xl bg-paper-ink text-white ring-1 ring-white/5 ${picks.length > 1 ? 'lg:grid-cols-[1.4fr_0.6fr]' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link href={`/courses/${course.slug}`} className="group relative min-h-[320px] md:min-h-[380px]">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-[1.02] group-hover:opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_90%_10%,#2756D8_0%,#0F1A3A_65%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-paper-ink via-paper-ink/75 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-8 md:p-10">
          <p className="w-fit rounded-full bg-marigold px-3 py-1 text-xs font-bold text-paper-ink">Featured</p>
          <h3 className="mt-4 max-w-xl text-balance font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            {course.title}
          </h3>
          {course.subtitle ? (
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65 md:text-base">{course.subtitle}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/70">
            {course.instructor ? <span>{course.instructor.name}</span> : null}
            <span className="inline-flex items-center gap-1">
              <Star size={14} className="fill-marigold text-marigold" />
              {course.averageRating.toFixed(1)}
            </span>
            <span className="font-semibold text-white">
              {course.priceCents === 0 ? 'Free' : formatPrice(course.priceCents)}
            </span>
          </div>
          <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-paper-ink transition-colors group-hover:bg-marigold">
            <Play size={16} fill="currentColor" />
            View course
          </span>
        </div>
      </Link>

      {picks.length > 1 ? (
      <div className="flex flex-col border-t border-white/10 lg:border-l lg:border-t-0">
        {picks.map((c, i) => {
          const active = i === index;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`flex flex-1 items-start gap-4 border-b border-white/10 px-6 py-5 text-left transition-colors last:border-b-0 ${
                active ? 'bg-white/10' : 'hover:bg-white/[0.04]'
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${active ? 'bg-marigold' : 'bg-white/25'}`}
                aria-hidden
              />
              <span className="min-w-0">
                <span className={`block font-display text-sm font-semibold leading-snug ${active ? 'text-white' : 'text-white/70'}`}>
                  {c.title}
                </span>
                <span className="mt-1 block text-xs text-white/45">
                  {c.category?.name ?? c.level}
                  {c.instructor ? ` · ${c.instructor.name}` : ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      ) : null}
    </div>
  );
}
