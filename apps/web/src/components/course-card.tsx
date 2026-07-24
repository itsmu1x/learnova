import Link from 'next/link';
import { Star } from 'lucide-react';
import { formatPrice } from '@learnova/shared';
import type { CourseCard as CourseCardType } from '@/lib/types';

export function CourseCard({ course }: { course: CourseCardType }) {
  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden bg-paper-ink">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-end bg-[linear-gradient(145deg,#1a2233,#0b0d12)] p-4">
            <span className="font-display text-base font-semibold text-white/90">{course.title}</span>
          </div>
        )}
        {course.isPro ? (
          <span className="absolute left-3 top-3 bg-white px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-paper-ink">
            Pro
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-paper-mute">
          <span>{course.level}</span>
          {course.category ? (
            <>
              <span aria-hidden>·</span>
              <span>{course.category.name}</span>
            </>
          ) : null}
        </div>
        <h3 className="line-clamp-2 font-display text-base font-semibold tracking-tight text-paper-ink transition-colors group-hover:text-signal dark:text-white">
          {course.title}
        </h3>
        <p className="text-sm text-paper-mute">{course.instructor?.name}</p>
        <div className="flex items-center justify-between pt-1 text-sm">
          <span className="inline-flex items-center gap-1 text-paper-mute">
            <Star size={13} className="fill-paper-ink text-paper-ink dark:fill-white dark:text-white" />
            {course.averageRating.toFixed(1)}
            <span className="text-paper-line dark:text-slate-600">·</span>
            {course.enrollmentCount}
          </span>
          <span className="font-semibold text-paper-ink dark:text-white">
            {course.priceCents === 0 ? 'Free' : formatPrice(course.priceCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}
