'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatPrice } from '@learnova/shared';
import { Badge, Button, Card, CardBody, StatCard } from '@learnova/ui';
import { ArrowRight, BookOpen, Plus, TrendingUp, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import type { CourseCard } from '@/lib/types';

interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  revenueCents: number;
  averageRating: number;
  completionRate: number;
  watchTimeHours: number;
  topCourses: { id: string; title: string; enrollmentCount: number; averageRating: number }[];
}

export default function InstructorPage() {
  return (
    <Protected permission="VIEW_INSTRUCTOR_PANEL">
      <InstructorOverview />
    </Protected>
  );
}

function InstructorOverview() {
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [courses, setCourses] = useState<CourseCard[]>([]);

  useEffect(() => {
    apiFetch<InstructorStats>('/analytics/instructor').then(setStats).catch(() => undefined);
    apiFetch<CourseCard[]>('/courses/mine?limit=5').then(setCourses).catch(() => undefined);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Instructor dashboard
          </h1>
          <p className="mt-1 text-slate-500">Track performance and manage your courses.</p>
        </div>
        <Link href="/instructor/courses/new">
          <Button>
            <Plus size={16} />
            New course
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={stats?.totalStudents ?? '—'} hint="Across all courses" />
        <StatCard label="Revenue" value={stats ? formatPrice(stats.revenueCents) : '—'} />
        <StatCard
          label="Avg. rating"
          value={stats?.averageRating != null ? `★ ${stats.averageRating.toFixed(1)}` : '—'}
        />
        <StatCard
          label="Completion rate"
          value={stats ? `${stats.completionRate}%` : '—'}
          hint={`${stats?.watchTimeHours ?? 0}h watched`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent courses</h2>
              <Link href="/instructor/courses" className="text-sm font-medium text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {courses.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No courses yet.</p>
              ) : (
                courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/instructor/courses/${course.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-white">{course.title}</p>
                      <p className="text-xs text-slate-500">
                        {course.enrollmentCount} students · {formatPrice(course.priceCents)}
                      </p>
                    </div>
                    <Badge variant={course.status === 'published' ? 'success' : 'warning'}>
                      {course.status}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top performers</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(stats?.topCourses ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Publish a course to see stats.</p>
              ) : (
                stats!.topCourses.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.enrollmentCount} enrollments</p>
                    </div>
                    <span className="text-sm text-amber-600">★ {c.averageRating.toFixed(1)}</span>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/instructor/courses/new" className="group">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardBody className="flex h-full flex-col justify-between">
              <Plus className="text-indigo-600" size={24} />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Create course</p>
                <p className="mt-1 text-sm text-slate-500">Build curriculum and upload videos</p>
              </div>
              <ArrowRight size={16} className="mt-4 text-slate-400 transition-transform group-hover:translate-x-1" />
            </CardBody>
          </Card>
        </Link>
        <Link href="/instructor/courses" className="group">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardBody className="flex h-full flex-col justify-between">
              <BookOpen className="text-indigo-600" size={24} />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Manage courses</p>
                <p className="mt-1 text-sm text-slate-500">{stats?.totalCourses ?? 0} total courses</p>
              </div>
              <ArrowRight size={16} className="mt-4 text-slate-400 transition-transform group-hover:translate-x-1" />
            </CardBody>
          </Card>
        </Link>
        <Card className="h-full">
          <CardBody className="flex h-full flex-col justify-between">
            <Users className="text-indigo-600" size={24} />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Your audience</p>
              <p className="mt-1 text-sm text-slate-500">{stats?.totalStudents ?? 0} students learning</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
