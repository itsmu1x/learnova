import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Clock, PlayCircle, Star, Users } from 'lucide-react';
import { formatDuration, formatPrice } from '@learnova/shared';
import { Badge, Card, CardBody, Container } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { EnrollButton } from '@/components/enroll-button';
import { CourseReviews } from '@/components/course-reviews';
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
      <section className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[88rem] rounded-4xl bg-paper-ink text-white">
        <Container className="grid gap-10 py-12 md:py-16 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 capitalize text-white dark:bg-white/10 dark:text-white">{course.level}</Badge>
              {course.category ? <Badge className="bg-white/10 text-white dark:bg-white/10 dark:text-white">{course.category.name}</Badge> : null}
              {course.isPro ? <Badge variant="pro">Pro</Badge> : null}
            </div>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">{course.title}</h1>
            {course.subtitle ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/65 md:text-xl">{course.subtitle}</p> : null}
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-white/70">
              <a href="#reviews" className="flex items-center gap-1.5 font-semibold text-white hover:underline">
                <Star size={16} className="fill-marigold text-marigold" /> {course.averageRating.toFixed(1)} ({course.ratingCount})
              </a>
              <span className="flex items-center gap-1.5"><Users size={16} /> {course.enrollmentCount} students</span>
              <span className="flex items-center gap-1.5"><PlayCircle size={16} /> {totalLessons} lessons</span>
              <span className="flex items-center gap-1.5"><Clock size={16} /> {formatDuration(course.totalDurationSeconds)}</span>
            </div>
            {course.instructor ? (
              <Link
                href={`/instructors/${course.instructor.id}`}
                className="group mt-6 inline-flex items-center gap-3 rounded-full py-1 pl-1 pr-4 ring-1 ring-white/15 transition-colors hover:bg-white/10"
              >
                {course.instructor.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.instructor.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-marigold font-display font-semibold text-paper-ink">
                    {course.instructor.name[0]?.toUpperCase()}
                  </span>
                )}
                <span className="text-sm text-white/60">
                  Taught by <span className="font-semibold text-white group-hover:underline">{course.instructor.name}</span>
                </span>
              </Link>
            ) : null}
          </div>

          <div className="lg:col-span-1">
            <Card className="overflow-hidden p-2 text-slate-900 dark:text-white">
              {course.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="aspect-video w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="aspect-video rounded-2xl bg-[radial-gradient(120%_100%_at_90%_10%,#2756D8_0%,#0F1A3A_65%)]" />
              )}
              <CardBody className="space-y-5 p-4">
                <div className="font-display text-3xl font-semibold tracking-tight">
                  {course.isPro
                    ? 'Included with Pro'
                    : course.priceCents === 0
                      ? 'Free'
                      : formatPrice(course.priceCents)}
                </div>
                <EnrollButton courseId={course.id} priceCents={course.priceCents} isPro={course.isPro} />
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-signal dark:text-signal-bright" /> Lifetime access</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-signal dark:text-signal-bright" /> Certificate of completion</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-signal dark:text-signal-bright" /> AI tutor included</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </Container>
        </div>
      </section>

      <Container className="grid gap-12 py-14 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {course.outcomes.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">What you&apos;ll learn</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-signal dark:text-signal-bright" /> {o}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Course content</h2>
            <p className="mt-1 text-sm text-slate-500">
              {course.curriculum.length} sections · {totalLessons} lessons
            </p>
            <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {course.curriculum.map((section, i) => (
                <div key={section.id} className="p-6">
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                      <span className="mr-2 text-slate-400">{i + 1}.</span>
                      {section.title}
                    </h3>
                    <ul className="mt-4 space-y-3">
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
                </div>
              ))}
            </div>
          </section>

          {course.description ? (
            <section>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
                {course.description}
              </p>
            </section>
          ) : null}
          <CourseReviews courseId={course.id} averageRating={course.averageRating} ratingCount={course.ratingCount} />
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
