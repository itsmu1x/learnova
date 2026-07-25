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
        className={`flex overflow-hidden border-2 bg-white transition dark:bg-slate-950 ${
          focused ? 'border-[#0057FF] shadow-[0_0_0_4px_rgba(0,87,255,0.12)]' : 'border-[#0B0D12] dark:border-slate-600'
        }`}
      >
        <div className="flex flex-1 items-center gap-3 px-4">
          <Search size={20} className="shrink-0 text-[#5C6578]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="What do you want to learn?"
            className="h-14 w-full bg-transparent text-base text-[#0B0D12] outline-none placeholder:text-[#5C6578] dark:text-white"
            aria-label="Search courses"
          />
        </div>
        <button
          type="submit"
          className="bg-[#0057FF] px-6 font-display text-sm font-semibold text-white transition hover:bg-[#003FBB]"
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#5C6578] dark:text-slate-400">
        <span className="font-medium">Popular:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
            className="border border-[#0B0D12]/15 bg-white px-3 py-1 text-[#0B0D12] shadow-sm transition hover:border-[#0057FF] hover:text-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-none dark:hover:border-[#4D8BFF] dark:hover:text-[#4D8BFF]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
