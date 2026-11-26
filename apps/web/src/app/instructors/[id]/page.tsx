import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { Container } from '@learnova/ui';
import { CourseCard } from '@/components/course-card';
import { apiFetch } from '@/lib/api';
import type { CourseCard as CourseCardType } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface InstructorProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  joinedAt: string;
  stats: { courses: number; students: number; reviews: number; rating: number };
  courses: CourseCardType[];
}

async function load(id: string): Promise<InstructorProfile | null> {
  try {
    return await apiFetch<InstructorProfile>(`/instructors/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await load(params.id);
  if (!p) return { title: 'Instructor not found | Learnova' };
  return {
    title: `${p.name} | Learnova instructor`,
    description: p.headline ?? `Courses by ${p.name} on Learnova.`,
    openGraph: { title: p.name, description: p.headline ?? undefined, images: p.avatarUrl ? [p.avatarUrl] : undefined },
  };
}

export default async function InstructorPage({ params }: { params: { id: string } }) {
  const p = await load(params.id);
  if (!p) notFound();

  const firstName = p.name.split(' ')[0];
  const stats: [string, string][] = [
    [String(p.stats.courses), p.stats.courses === 1 ? 'Course' : 'Courses'],
    [p.stats.students.toLocaleString(), p.stats.students === 1 ? 'Learner' : 'Learners'],
    [p.stats.reviews ? p.stats.rating.toFixed(1) : 'New', p.stats.reviews ? `Rating (${p.stats.reviews})` : 'No ratings yet'],
  ];

  return (
    <>
      <section className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-[88rem] overflow-hidden rounded-4xl bg-paper-ink text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-signal/40 blur-3xl"
          />
          <Container className="relative grid gap-10 py-12 md:grid-cols-[auto_1fr] md:items-center md:py-16">
            {p.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.avatarUrl}
                alt=""
                className="h-32 w-32 rounded-full object-cover ring-4 ring-marigold md:h-40 md:w-40"
              />
            ) : (
              <span
                aria-hidden
                className="grid h-32 w-32 place-items-center rounded-full bg-marigold font-display text-6xl font-semibold text-paper-ink md:h-40 md:w-40"
              >
                {p.name[0]?.toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-marigold">Instructor</p>
              <h1 className="mt-1 text-balance font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                {p.name}
              </h1>
              {p.headline ? <p className="mt-3 max-w-2xl text-lg text-white/70 md:text-xl">{p.headline}</p> : null}
              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
                {stats.map(([value, label], i) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd className="flex items-center gap-1.5 font-display text-3xl font-semibold">
                      {i === 2 && p.stats.reviews ? <Star size={22} className="fill-marigold text-marigold" /> : null}
                      {value}
                    </dd>
                    <p aria-hidden className="text-sm text-white/55">
                      {label}
                    </p>
                  </div>
                ))}
              </dl>
            </div>
          </Container>
        </div>
      </section>

      <Container className="grid gap-12 py-14 lg:grid-cols-[1fr_2fr]">
        <aside>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-paper-ink dark:text-white">
            About {firstName}
          </h2>
          {p.bio ? (
            <p className="mt-3 whitespace-pre-line leading-relaxed text-paper-mute">{p.bio}</p>
          ) : (
            <p className="mt-3 text-paper-mute">{firstName} hasn&apos;t written a bio yet.</p>
          )}
          <p className="mt-6 text-sm text-paper-mute">
            Teaching on Learnova since{' '}
            {new Date(p.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </aside>

        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-paper-ink dark:text-white">
            Courses by {firstName}
          </h2>
          {p.courses.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {p.courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-3xl border border-dashed border-paper-line p-10 text-center text-paper-mute">
              No published courses yet. Check back soon.
            </p>
          )}
        </section>
      </Container>
    </>
  );
}
