import Link from 'next/link';
import { PlayCircle, Star } from 'lucide-react';
import { formatPrice } from '@learnova/shared';
import type { CourseCard as CourseCardType } from '@/lib/types';

const LEVEL: Record<CourseCardType['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function CourseCard({ course }: { course: CourseCardType }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col rounded-3xl border border-paper-line bg-paper-elev p-2.5 transition-colors hover:border-paper-ink/30 dark:hover:border-white/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-paper-ink">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-end bg-[radial-gradient(120%_90%_at_100%_0%,#2756D8_0%,#0F1A3A_60%)] p-4">
            <span className="line-clamp-2 font-display text-lg font-semibold leading-tight text-white">
              {course.title}
            </span>
          </div>
        )}
        {course.isPro ? (
          <span className="absolute left-3 top-3 rounded-full bg-marigold px-2.5 py-0.5 text-xs font-bold text-paper-ink">
            Pro
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1.5 pt-3.5">
        <p className="text-[13px] font-medium text-paper-mute">
          {LEVEL[course.level] ?? course.level}
          {course.category ? `, ${course.category.name}` : ''}
        </p>
        <h3 className="mt-1 line-clamp-2 font-display text-[17px] font-semibold leading-snug tracking-tight text-paper-ink transition-colors group-hover:text-signal dark:text-white dark:group-hover:text-signal-bright">
          {course.title}
        </h3>
        {course.instructor ? <p className="mt-1 text-sm text-paper-mute">{course.instructor.name}</p> : null}

        <div className="mt-auto flex items-center gap-3 pt-4 text-sm text-paper-mute">
          <span className="inline-flex items-center gap-1 font-semibold text-paper-ink dark:text-white">
            <Star size={14} className="fill-marigold text-marigold" />
            {course.averageRating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle size={14} />
            {course.lessonCount}
          </span>
          <span className="ml-auto font-display text-base font-semibold text-paper-ink dark:text-white">
            {course.priceCents === 0 ? 'Free' : formatPrice(course.priceCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}
