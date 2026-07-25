import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button, Container } from '@learnova/ui';
import { safeFetch } from '@/lib/api';
import { CourseShelf } from '@/components/home/course-shelf';
import { FeaturedSpotlight } from '@/components/home/featured-spotlight';
import { GoalPicker } from '@/components/home/goal-picker';
import { HomeSearch } from '@/components/home/home-search';
import { LearnFlow } from '@/components/home/learn-flow';
import { TopicExplorer } from '@/components/home/topic-explorer';
import type { Category, CourseCard as CourseCardType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [popular, newest, topRated, categories] = await Promise.all([
    safeFetch<CourseCardType[]>('/courses?limit=12&sort=popular', []),
    safeFetch<CourseCardType[]>('/courses?limit=12&sort=newest', []),
    safeFetch<CourseCardType[]>('/courses?limit=12&sort=rating', []),
    safeFetch<Category[]>('/categories', []),
  ]);

  return (
    <div className="text-[#0B0D12] dark:text-slate-100">
      {/* Hero — grid + signal atmosphere (same energy as dark) */}
      <section className="relative overflow-hidden landing-grid">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,87,255,0.28),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(0,87,255,0.12),_transparent_45%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(0,87,255,0.35),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(77,139,255,0.12),_transparent_45%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-10 hidden h-[28rem] w-[28rem] rounded-full bg-[#0057FF]/20 blur-3xl md:block dark:bg-[#0057FF]/25"
        />
        <Container className="relative grid items-center gap-10 py-20 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:py-28 lg:gap-16 lg:py-32">
          <div>
            <p className="animate-fade-up text-clip-brand font-display text-[clamp(3rem,12vw,6.5rem)] font-extrabold leading-[0.88] tracking-tight">
              Learnova
            </p>
            <h1 className="animate-fade-up delay-1 mt-6 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
              Learn anything. Prove everything.
            </h1>
            <p className="animate-fade-up delay-2 mt-4 max-w-xl text-base leading-relaxed text-[#5C6578] dark:text-slate-400 md:text-lg">
              Expert-led video courses with an AI tutor in the lesson — and certificates employers can verify.
            </p>
            <div className="animate-fade-up delay-3 mt-10">
              <HomeSearch />
            </div>
          </div>

          <div className="animate-fade-up delay-4 relative mx-auto hidden w-full max-w-lg md:block lg:max-w-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/undraw_education.svg"
              alt=""
              className="h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(11,13,18,0.08)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            />
          </div>
        </Container>
      </section>

      {/* Featured spotlight */}
      {popular.length > 0 ? (
        <section className="relative bg-[#E8F0FF] dark:bg-[#12151c]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0057FF]/40 to-transparent dark:via-[#4D8BFF]/30"
          />
          <Container className="py-14 md:py-16">
            <FeaturedSpotlight courses={popular} />
          </Container>
        </section>
      ) : null}

      {/* Topics */}
      <section className="relative border-y border-[#D8DCE6] bg-white dark:border-slate-800 dark:bg-[#0B0D12]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(216,220,230,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(216,220,230,0.7) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <Container className="relative py-14 md:py-20">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[#0057FF] dark:text-[#4D8BFF]">
                Topics
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                A broad selection of courses
              </h2>
              <p className="mt-2 max-w-lg text-[#5C6578] dark:text-slate-400">
                Choose a topic to preview matching courses — then dive into the full catalog.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0057FF] hover:underline dark:text-[#4D8BFF]"
            >
              All courses <ArrowUpRight size={16} />
            </Link>
          </div>
          <TopicExplorer categories={categories} courses={popular} />
        </Container>
      </section>

      {/* Course shelves */}
      <section className="landing-mesh relative">
        <Container className="relative space-y-14 py-14 md:space-y-16 md:py-20">
          <CourseShelf
            title="Learners are viewing"
            subtitle="Trending across Learnova right now"
            courses={popular}
          />
          <CourseShelf title="Newest releases" subtitle="Fresh courses just published" courses={newest} />
          <CourseShelf title="Highest rated" subtitle="Loved by the community" courses={topRated} />
        </Container>
      </section>

      {/* Goals */}
      <section className="relative overflow-hidden bg-[#0B0D12] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(0,87,255,0.35),_transparent_55%)]"
        />
        <Container className="relative py-14 md:py-20">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[#4D8BFF]">Goals</p>
          <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight md:text-3xl">
            What are you working toward?
          </h2>
          <p className="mt-3 max-w-lg text-white/55">Pick a path — we&apos;ll point you at matching courses.</p>
          <div className="mt-10">
            <GoalPicker />
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="relative bg-[#F3F4F6] dark:bg-[#12151c]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#0057FF]/15 blur-3xl dark:bg-[#0057FF]/20"
        />
        <Container className="relative py-14 md:py-20">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[#0057FF] dark:text-[#4D8BFF]">
            How it works
          </p>
          <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Watch. Ask. Prove it.
          </h2>
          <p className="mt-3 max-w-lg text-[#5C6578] dark:text-slate-400">
            Hover a step to see how Learnova turns lessons into verified skills.
          </p>
          <div className="mt-10">
            <LearnFlow />
          </div>
        </Container>
      </section>

      {/* Pro + Teach */}
      <section className="landing-grid relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(0,87,255,0.14),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_bottom,_rgba(0,87,255,0.2),_transparent_55%)]"
        />
        <Container className="relative grid gap-4 py-14 md:grid-cols-2 md:py-16">
          <Link
            href="/pricing"
            className="group flex flex-col justify-between bg-[#0057FF] p-8 text-white shadow-[0_24px_50px_-28px_rgba(0,87,255,0.55)] transition hover:bg-[#003FBB] md:min-h-[220px] md:p-10"
          >
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Pro</p>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Unlock the full catalog
              </h3>
              <p className="mt-3 max-w-sm text-white/75">
                One subscription. Every Pro course. Priority AI tutor.
              </p>
            </div>
            <span className="mt-8 inline-flex items-center gap-1 font-display text-sm font-semibold">
              See Pro plans <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/instructor"
            className="group flex flex-col justify-between border border-[#0B0D12]/15 bg-white/90 p-8 backdrop-blur-sm transition hover:border-[#0057FF] dark:border-slate-700 dark:bg-slate-950/90 md:min-h-[220px] md:p-10"
          >
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[#0057FF] dark:text-[#4D8BFF]">
                Teach
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Share what you know
              </h3>
              <p className="mt-3 max-w-sm text-[#5C6578] dark:text-slate-400">
                Publish courses, upload lessons, and reach learners on web and mobile.
              </p>
            </div>
            <span className="mt-8 inline-flex items-center gap-1 font-display text-sm font-semibold text-[#0057FF] dark:text-[#4D8BFF]">
              Open instructor panel <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </Container>
      </section>

      {/* Proof */}
      <section className="bg-[#E8F0FF] dark:bg-[#0B0D12]">
        <Container className="py-14 md:py-20">
          <div className="relative overflow-hidden border border-[#0057FF]/25 bg-[#0B0D12] px-8 py-12 text-white md:px-12 md:py-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,_rgba(0,87,255,0.4),_transparent_65%)]"
            />
            <div className="relative grid gap-8 md:grid-cols-[1.2fr_auto] md:items-center">
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[#4D8BFF]">Proof</p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                  Certificates employers can check
                </h2>
                <p className="mt-3 max-w-lg text-white/55">
                  Finish a course, get a QR-backed certificate, and share a public verification link.
                </p>
              </div>
              <Link
                href="/verify/certificate"
                className="inline-flex items-center justify-center gap-2 border border-white/30 bg-white px-5 py-3 font-display text-sm font-semibold text-[#0B0D12] transition hover:bg-[#E8F0FF]"
              >
                Verify a certificate <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-[#0B0D12] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,_rgba(0,87,255,0.35),_transparent_65%)]"
        />
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[#0057FF]" />
        <Container className="relative flex flex-col items-start justify-between gap-8 py-14 md:flex-row md:items-center md:py-16">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Start learning tonight</h2>
            <p className="mt-2 max-w-md text-white/55">Free account. First lesson in minutes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg" className="rounded-none bg-white px-7 text-[#0B0D12] hover:bg-[#E8F0FF]">
                Create account
              </Button>
            </Link>
            <Link href="/courses">
              <Button
                size="lg"
                variant="outline"
                className="rounded-none border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Browse courses
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
