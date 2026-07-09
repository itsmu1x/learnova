import Link from 'next/link';
import { ArrowRight, Bot, ShieldCheck, Sparkles, Video } from 'lucide-react';
import { Button, Container } from '@learnova/ui';
import { safeFetch } from '@/lib/api';
import { CourseCard } from '@/components/course-card';
import type { CourseCard as CourseCardType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const courses = await safeFetch<CourseCardType[]>('/courses?limit=8&sort=popular', []);

  return (
    <>
      <section className="gradient-hero">
        <Container className="py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
            <Sparkles size={15} /> AI-powered learning platform
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl dark:text-white">
            Learn in-demand skills, <span className="text-indigo-600">without limits</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Premium video courses taught by experts, an AI tutor that answers your questions, and
            certificates you can verify. Learn at your own pace.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/courses">
              <Button size="lg" className="gap-2">
                Explore courses <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">Start free</Button>
            </Link>
          </div>
        </Container>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <Container className="grid gap-8 md:grid-cols-3">
          <Feature icon={<Bot />} title="AI Tutor" desc="Ask questions about any lesson and get instant, context-aware explanations." />
          <Feature icon={<Video />} title="Secure streaming" desc="DRM-protected video via Mux — no raw files, no leaks." />
          <Feature icon={<ShieldCheck />} title="Verified certificates" desc="Earn certificates with QR-code public verification on completion." />
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Popular courses</h2>
              <p className="mt-1 text-slate-500">Handpicked courses loved by our learners.</p>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-700">
              No courses yet. Once the API is running and seeded, courses will appear here.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 md:mx-0 dark:bg-indigo-950/50 dark:text-indigo-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-slate-500">{desc}</p>
    </div>
  );
}
