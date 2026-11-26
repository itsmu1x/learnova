'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

const SUGGESTIONS = ['React', 'Python', 'UI design', 'Machine learning', 'Public speaking'];

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      router.push('/search');
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={submit}
        className={`flex items-center overflow-hidden rounded-full border bg-paper-elev p-1.5 transition ${
          focused
            ? 'border-signal ring-4 ring-signal/15'
            : 'border-paper-line shadow-[0_12px_32px_-18px_rgba(15,26,58,0.35)]'
        }`}
      >
        <div className="flex flex-1 items-center gap-3 pl-4">
          <Search size={20} className="shrink-0 text-paper-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="What do you want to learn?"
            className="h-12 w-full bg-transparent text-base text-paper-ink outline-none placeholder:text-paper-mute dark:text-white"
            aria-label="Search courses"
          />
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-full bg-signal px-6 text-sm font-semibold text-white transition-colors hover:bg-signal-deep"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-paper-mute">
        <span className="mr-1">Try</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
            className="rounded-full border border-paper-line bg-paper-elev px-3.5 py-1.5 font-medium text-paper-ink transition-colors hover:border-paper-ink dark:text-slate-200 dark:hover:border-slate-300"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
