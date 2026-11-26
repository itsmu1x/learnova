import Link from 'next/link';
import { BadgeCheck, Bot, Play } from 'lucide-react';
import type { CourseCard as CourseCardType } from '@/lib/types';

/** Hero composition: a lesson player, the AI tutor beside it, and the certificate at the end. */
export function LessonPreview({ course }: { course: CourseCardType | null }) {
  const title = course?.title ?? 'Your next course';
  const href = course ? `/courses/${course.slug}` : '/courses';

  return (
    <div className="relative mx-auto max-w-xl pb-28 pl-4 pr-2 sm:pl-10 lg:max-w-none">
      {/* Player */}
      <Link
        href={href}
        className="group block rounded-4xl bg-paper-ink p-3 shadow-[0_40px_80px_-40px_rgba(15,26,58,0.55)] ring-1 ring-white/10"
      >
        <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-800">
          {course?.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(120%_100%_at_90%_10%,#2756D8_0%,#0F1A3A_65%)]" />
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-paper-ink transition-transform group-hover:scale-105">
              <Play size={24} fill="currentColor" className="translate-x-0.5" />
            </span>
          </span>
        </div>
        <div className="px-3 pb-2 pt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="animate-fill h-full w-[62%] origin-left rounded-full bg-marigold" />
          </div>
          <p className="mt-4 line-clamp-1 font-display text-lg font-semibold text-white">{title}</p>
          <p className="text-sm text-white/55">{course?.instructor?.name ?? 'Learnova'}</p>
        </div>
      </Link>

      {/* Tutor */}
      <div className="absolute bottom-0 left-0 w-[min(20rem,82%)] rounded-3xl border border-paper-line bg-paper-elev p-4 shadow-[0_24px_48px_-24px_rgba(15,26,58,0.4)]">
        <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-paper px-3.5 py-2 text-sm text-paper-ink dark:text-white">
          Can you explain that last part again?
        </p>
        <div className="mt-3 flex gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-signal text-white">
            <Bot size={15} />
          </span>
          <p className="text-sm leading-relaxed text-paper-mute">
            Sure. Here it is in two steps, using the example from this lesson.
          </p>
        </div>
      </div>

      {/* Certificate */}
      <div className="absolute -top-5 right-0 flex items-center gap-2 rounded-full bg-marigold py-2 pl-3 pr-4 text-sm font-semibold text-paper-ink shadow-[0_16px_32px_-16px_rgba(184,116,0,0.7)]">
        <BadgeCheck size={18} />
        Certificate earned
      </div>
    </div>
  );
}
