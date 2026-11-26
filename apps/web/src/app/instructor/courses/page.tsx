'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatPrice } from '@learnova/shared';
import { Badge, Button, Card, CardBody } from '@learnova/ui';
import { Plus, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import type { CourseCard } from '@/lib/types';

export default function InstructorCoursesPage() {
  return (
    <Protected permission="VIEW_INSTRUCTOR_PANEL">
      <CoursesList />
    </Protected>
  );
}

function CoursesList() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CourseCard[]>('/courses/mine?limit=100')
      .then(setCourses)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.subtitle?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">My courses</h1>
          <p className="mt-1 text-slate-500">Edit curriculum, upload videos, and publish.</p>
        </div>
        <Link href="/instructor/courses/new">
          <Button>
            <Plus size={16} />
            New course
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your courses…"
          className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading courses…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <p className="text-slate-500">No courses found.</p>
            <Link href="/instructor/courses/new" className="mt-4 inline-block">
              <Button>Create your first course</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <Card key={course.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="aspect-video bg-[radial-gradient(120%_100%_at_90%_10%,#2756D8_0%,#0F1A3A_65%)]">
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm font-medium text-white/90">
                    {course.title}
                  </div>
                )}
              </div>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{course.title}</h3>
                  <Badge variant={course.status === 'published' ? 'success' : 'warning'}>
                    {course.status}
                  </Badge>
                </div>
                {course.subtitle ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{course.subtitle}</p>
                ) : null}
                <p className="mt-3 text-xs text-slate-500">
                  {course.lessonCount} lessons · {course.enrollmentCount} students ·{' '}
                  {formatPrice(course.priceCents)}
                </p>
                <Link href={`/instructor/courses/${course.id}`} className="mt-4 block">
                  <Button variant="secondary" className="w-full">
                    Manage course
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
