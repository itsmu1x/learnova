'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Card, CardBody, Container, Input, Spinner } from '@learnova/ui';
import { apiFetch } from '@/lib/api';

interface SearchItem {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
  slug?: string;
}
interface Results {
  courses: SearchItem[];
  lessons: SearchItem[];
  instructors: SearchItem[];
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await apiFetch<Results>(`/search?q=${encodeURIComponent(q)}`);
      setResults(res);
    } catch {
      setResults({ courses: [], lessons: [], instructors: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Search</h1>
      <form onSubmit={run} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-10" placeholder="Search courses, lessons, instructors…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </form>

      {loading ? <div className="mt-10 flex justify-center"><Spinner className="h-8 w-8" /></div> : null}

      {results ? (
        <div className="mt-8 space-y-8">
          <Section title="Courses">
            {results.courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`}>
                <Card><CardBody><p className="font-medium text-slate-900 dark:text-white">{c.title}</p><p className="text-sm text-slate-500">{c.subtitle}</p></CardBody></Card>
              </Link>
            ))}
          </Section>
          <Section title="Lessons">
            {results.lessons.map((l) => (
              <Card key={l.id}><CardBody><p className="font-medium text-slate-900 dark:text-white">{l.title}</p></CardBody></Card>
            ))}
          </Section>
          <Section title="Instructors">
            {results.instructors.map((i) => (
              <Card key={i.id}><CardBody><p className="font-medium text-slate-900 dark:text-white">{i.title}</p><p className="text-sm text-slate-500">{i.subtitle}</p></CardBody></Card>
            ))}
          </Section>
        </div>
      ) : null}
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children];
  if (arr.filter(Boolean).length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
