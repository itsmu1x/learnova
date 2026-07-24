import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button, Container } from '@learnova/ui';
import { safeFetch } from '@/lib/api';
import { CourseCard } from '@/components/course-card';
import type { CourseCard as CourseCardType } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    n: '01',
    title: 'Pick a course',
    body: 'Focused curricula from practitioners — not endless content farms.',
  },
  {
    n: '02',
    title: 'Watch & ask',
    body: 'Secure streaming. Stuck? The AI tutor answers in the context of the lesson.',
  },
  {
    n: '03',
    title: 'Prove it',
    body: 'Finish the path and get a certificate with public QR verification.',
  },
] as const;

export default async function HomePage() {
  const courses = await safeFetch<CourseCardType[]>('/courses?limit=8&sort=popular', []);

  return (
    <div className="text-paper-ink dark:text-slate-100">
      <section className="bg-[#F3F4F6] dark:bg-[#0B0D12]">
        <Container className="flex min-h-[70svh] flex-col justify-center py-24 md:min-h-[75svh] md:py-32">
          <p className="animate-fade-up text-clip-brand font-display text-[clamp(3.25rem,13vw,8rem)] font-extrabold leading-[0.88] tracking-tight">
            Learnova
          </p>
          <h1 className="animate-fade-up delay-1 mt-6 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-5xl">
            Learn with intent.
          </h1>
          <p className="animate-fade-up delay-2 mt-4 max-w-md text-base leading-relaxed text-[#5C6578] dark:text-slate-400 md:text-lg">
            Sharp video courses, an AI tutor when you get stuck, and certificates you can actually verify.
          </p>
          <div className="animate-fade-up delay-3 mt-8 flex flex-wrap items-center gap-3">
            <Link href="/courses">
              <Button size="lg" className="rounded-md bg-[#0057FF] px-7 hover:bg-[#003FBB]">
                Browse courses
              </Button>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
            >
              See pricing <ArrowUpRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      {/* Method — original 3-up with ghost numbers */}
      <section className="bg-white dark:bg-[#12151c]">
        <Container className="py-20 md:py-28">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[#0057FF] dark:text-[#4D8BFF]">
            Method
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Three moves. No fluff.
          </h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className="font-display text-4xl font-extrabold leading-none text-[#0057FF]/20 dark:text-[#4D8BFF]/25">
                  {step.n}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5C6578] dark:text-slate-400 md:text-base">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-[#F3F4F6] dark:bg-[#0B0D12]">
        <Container className="py-20 md:py-28">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[#0057FF] dark:text-[#4D8BFF]">
                Catalog
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Popular right now
              </h2>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0057FF] underline-offset-4 hover:underline dark:text-[#4D8BFF]"
            >
              View all courses <ArrowUpRight size={16} />
            </Link>
          </div>

          {courses.length === 0 ? (
            <p className="mt-12 text-[#5C6578]">No courses yet — check back after the catalog is seeded.</p>
          ) : (
            <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Proof — framed certificate panel, not a blue slab */}
      <section className="bg-white dark:bg-[#12151c]">
        <Container className="py-20 md:py-28">
          <div className="relative overflow-hidden border border-[#D8DCE6] bg-[#F3F4F6] px-8 py-12 dark:border-slate-700 dark:bg-[#0B0D12] md:px-14 md:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 font-display text-[clamp(6rem,22vw,14rem)] font-extrabold leading-none text-[#0057FF]/[0.07] dark:text-[#4D8BFF]/10"
            >
              ✓
            </div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[#0057FF] dark:text-[#4D8BFF]">
              Proof
            </p>
            <h2 className="relative mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Certificates that hold up.
            </h2>
            <p className="relative mt-4 max-w-lg text-base leading-relaxed text-[#5C6578] dark:text-slate-400">
              Every completion ships with a public verification page and QR code — so employers and peers can check it in seconds.
            </p>
            <Link
              href="/verify/certificate"
              className="relative mt-8 inline-flex items-center gap-2 border border-[#0057FF] px-5 py-2.5 font-display text-sm font-semibold text-[#0057FF] transition hover:bg-[#0057FF] hover:text-white dark:border-[#4D8BFF] dark:text-[#4D8BFF] dark:hover:bg-[#4D8BFF] dark:hover:text-[#0B0D12]"
            >
              Verify a certificate <ArrowUpRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      {/* Close — ink strip, split layout (not another hero) */}
      <section className="relative overflow-hidden bg-[#0B0D12] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,_rgba(0,87,255,0.35),_transparent_65%)]"
        />
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[#0057FF]" />
        <Container className="relative grid gap-10 py-16 md:grid-cols-[1fr_auto] md:items-center md:gap-16 md:py-20">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[#4D8BFF]">
              Next step
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Start tonight.
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/55">
              Create a free account and open your first lesson in minutes.
            </p>
          </div>
          <Link href="/register" className="md:justify-self-end">
            <Button
              size="lg"
              className="rounded-md border border-white/20 bg-white px-8 text-[#0B0D12] hover:bg-[#E8F0FF]"
            >
              Create account
              <ArrowUpRight size={18} />
            </Button>
          </Link>
        </Container>
      </section>
    </div>
  );
}
