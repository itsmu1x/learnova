import Link from 'next/link';
import { ArrowRight, BadgeCheck, Sparkles } from 'lucide-react';
import { Container } from '@learnova/ui';
import { safeFetch } from '@/lib/api';
import { CourseShelf } from '@/components/home/course-shelf';
import { FeaturedSpotlight } from '@/components/home/featured-spotlight';
import { GoalPicker } from '@/components/home/goal-picker';
import { HomeSearch } from '@/components/home/home-search';
import { LearnFlow } from '@/components/home/learn-flow';
import { LessonPreview } from '@/components/home/lesson-preview';
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
    <div className="text-paper-ink dark:text-white">
      {/* Hero */}
      <section className="ruled relative overflow-hidden border-b border-paper-line">
        <Container className="relative grid items-center gap-14 pb-20 pt-14 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-24">
          <div>
            <h1 className="animate-fade-up text-balance font-display text-[clamp(2.75rem,7vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
              Learn it properly. Then prove it.
            </h1>
            <p className="animate-fade-up delay-1 mt-6 max-w-xl text-lg leading-relaxed text-paper-mute md:text-xl">
              Video courses from working experts, an AI tutor that knows which lesson you&apos;re on, and a
              certificate anyone can check.
            </p>
            <div className="animate-fade-up delay-2 mt-10">
              <HomeSearch />
            </div>
          </div>

          <div className="animate-fade-up delay-3">
            <LessonPreview course={popular[0] ?? null} />
          </div>
        </Container>
      </section>

      {popular.length > 0 ? (
        <section>
          <Container className="pt-16 md:pt-24">
            <FeaturedSpotlight courses={popular} />
          </Container>
        </section>
      ) : null}

      {/* Topics */}
      <section>
        <Container className="py-16 md:py-24">
          <SectionHead
            title="Browse by topic"
            body="Pick a subject to see a few of its courses."
            href="/courses"
            cta="All courses"
          />
          <TopicExplorer categories={categories} courses={popular} />
        </Container>
      </section>

      {/* Shelves */}
      <section className="border-y border-paper-line bg-paper-elev">
        <Container className="space-y-16 py-16 md:space-y-20 md:py-24">
          <CourseShelf title="Popular right now" subtitle="What other learners are taking this week" courses={popular} />
          <CourseShelf title="Just published" subtitle="New courses from our instructors" courses={newest} />
          <CourseShelf title="Highest rated" subtitle="Courses learners scored best" courses={topRated} />
        </Container>
      </section>

      {/* How it works */}
      <section>
        <Container className="py-16 md:py-24">
          <SectionHead
            title="How a course works"
            body="Three steps, from the first lesson to a certificate with your name on it."
          />
          <LearnFlow />
        </Container>
      </section>

      {/* Goals */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[88rem] rounded-4xl bg-paper-ink text-white">
          <Container className="py-16 md:py-20">
            <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
              What are you working toward?
            </h2>
            <p className="mt-3 max-w-lg text-lg text-white/60">Pick a goal and we&apos;ll show you where to start.</p>
            <div className="mt-10">
              <GoalPicker />
            </div>
          </Container>
        </div>
      </section>

      {/* Closing */}
      <section>
        <Container className="grid gap-4 py-16 md:grid-cols-3 md:py-24">
          <Link
            href="/register"
            className="group flex min-h-[240px] flex-col justify-between rounded-4xl bg-signal p-8 text-white transition-colors hover:bg-signal-deep md:col-span-2 md:p-10"
          >
            <h2 className="max-w-md font-display text-3xl font-semibold leading-tight tracking-tight md:text-[2.5rem]">
              Your first lesson is a few minutes away.
            </h2>
            <span className="inline-flex items-center gap-2 font-semibold">
              Create a free account
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <div className="grid gap-4">
            <Tile
              href="/pricing"
              icon={<Sparkles size={20} className="text-marigold-deep dark:text-marigold" />}
              title="Go Pro"
              body="Every Pro course and priority tutor answers."
            />
            <Tile
              href="/verify/certificate"
              icon={<BadgeCheck size={20} className="text-signal dark:text-signal-bright" />}
              title="Verify a certificate"
              body="Check a Learnova certificate by its code."
            />
          </div>
        </Container>
      </section>
    </div>
  );
}

function SectionHead({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-lg text-lg text-paper-mute">{body}</p>
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-signal hover:underline dark:text-signal-bright"
        >
          {cta}
          <ArrowRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}

function Tile({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between gap-6 rounded-4xl border border-paper-line bg-paper-elev p-7 transition-colors hover:border-paper-ink/40 dark:hover:border-white/30"
    >
      {icon}
      <div>
        <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-paper-mute">{body}</p>
      </div>
    </Link>
  );
}
