import Link from 'next/link';
import { Star, Users } from 'lucide-react';
import { formatPrice } from '@learnova/shared';
import { Badge, Card } from '@learnova/ui';
import type { CourseCard as CourseCardType } from '@/lib/types';

export function CourseCard({ course }: { course: CourseCardType }) {
  return (
    <Link href={`/courses/${course.slug}`} className="group">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-lg font-semibold text-white">
              {course.title}
            </div>
          )}
          {course.isPro ? (
            <Badge variant="indigo" className="absolute left-3 top-3 bg-white/90">Pro</Badge>
          ) : null}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge className="capitalize">{course.level}</Badge>
            {course.category ? <Badge>{course.category.name}</Badge> : null}
          </div>
          <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white">
            {course.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{course.instructor?.name}</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-slate-500">
              <span className="flex items-center gap-1 text-amber-500">
                <Star size={14} className="fill-amber-400" />
                {course.averageRating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} />
                {course.enrollmentCount}
              </span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              {course.priceCents === 0 ? 'Free' : formatPrice(course.priceCents)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
