import { notFound } from 'next/navigation';
import { CheckCircle2, Clock, PlayCircle, Star, Users } from 'lucide-react';
import { formatDuration, formatPrice } from '@learnova/shared';
import { Badge, Card, CardBody, Container } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { EnrollButton } from '@/components/enroll-button';
import type { CourseDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  let course: CourseDetail;
  try {
    course = await apiFetch<CourseDetail>(`/courses/slug/${params.slug}`);
  } catch {
    notFound();
  }

  const totalLessons = course.curriculum.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-900 text-white dark:border-slate-800">
        <Container className="grid gap-8 py-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Badge variant="indigo" className="capitalize">{course.level}</Badge>
              {course.category ? <Badge>{course.category.name}</Badge> : null}
              {course.isPro ? <Badge variant="warning">Pro</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{course.title}</h1>
            {course.subtitle ? <p className="mt-3 text-lg text-slate-300">{course.subtitle}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Star size={16} className="fill-amber-400" /> {course.averageRating.toFixed(1)} ({course.ratingCount})
              </span>
              <span className="flex items-center gap-1.5"><Users size={16} /> {course.enrollmentCount} students</span>
              <span className="flex items-center gap-1.5"><PlayCircle size={16} /> {totalLessons} lessons</span>
              <span className="flex items-center gap-1.5"><Clock size={16} /> {formatDuration(course.totalDurationSeconds)}</span>
            </div>
            {course.instructor ? (
              <p className="mt-4 text-sm text-slate-400">Created by <span className="font-medium text-white">{course.instructor.name}</span></p>
            ) : null}
          </div>

          <div className="lg:col-span-1">
            <Card className="text-slate-900 dark:text-white">
              <div className="aspect-video rounded-t-2xl bg-gradient-to-br from-indigo-500 to-violet-600" />
              <CardBody className="space-y-4">
                <div className="text-3xl font-bold">
                  {course.priceCents === 0 ? 'Free' : formatPrice(course.priceCents)}
                </div>
                <EnrollButton courseId={course.id} priceCents={course.priceCents} isPro={course.isPro} />
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Lifetime access</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Certificate of completion</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> AI tutor included</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {course.outcomes.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">What you&apos;ll learn</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" /> {o}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course content</h2>
            <p className="mt-1 text-sm text-slate-500">
              {course.curriculum.length} sections · {totalLessons} lessons
            </p>
            <div className="mt-4 space-y-3">
              {course.curriculum.map((section) => (
                <Card key={section.id}>
                  <CardBody>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{section.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {section.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-2">
                            <PlayCircle size={16} className="text-slate-400" /> {lesson.title}
                            {lesson.isPreview ? <Badge variant="success">Preview</Badge> : null}
                          </span>
                          <span className="text-slate-400">{formatDuration(lesson.durationSeconds)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          {course.description ? (
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
                {course.description}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="lg:col-span-1">
          {course.requirements.length > 0 ? (
            <Card>
              <CardBody>
                <h3 className="font-semibold text-slate-900 dark:text-white">Requirements</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {course.requirements.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </Container>
    </>
  );
}
