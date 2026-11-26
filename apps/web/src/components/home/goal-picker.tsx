'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bot, Briefcase, Code2, Palette, TrendingUp } from 'lucide-react';

const GOALS = [
  {
    id: 'dev',
    label: 'Become a developer',
    icon: Code2,
    copy: 'Ship production apps with modern stacks — from fundamentals to system design.',
    href: '/search?q=development',
  },
  {
    id: 'design',
    label: 'Level up design',
    icon: Palette,
    copy: 'Craft interfaces people love. Product thinking, visual systems, and prototyping.',
    href: '/search?q=design',
  },
  {
    id: 'career',
    label: 'Grow your career',
    icon: Briefcase,
    copy: 'Communication, leadership, and portfolio skills that show up in interviews.',
    href: '/search?q=career',
  },
  {
    id: 'ai',
    label: 'Work with AI',
    icon: Bot,
    copy: 'Use AI as a co-pilot — prompting, workflows, and building with modern models.',
    href: '/search?q=ai',
  },
  {
    id: 'business',
    label: 'Build & market',
    icon: TrendingUp,
    copy: 'Strategy, growth, and storytelling for founders and operators.',
    href: '/search?q=business',
  },
] as const;

export function GoalPicker() {
  const [active, setActive] = useState<(typeof GOALS)[number]['id']>('dev');
  const goal = GOALS.find((g) => g.id === active) ?? GOALS[0];
  const Icon = goal.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="scrollbar-none flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {GOALS.map((g) => {
          const selected = g.id === active;
          const GIcon = g.icon;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setActive(g.id)}
              className={`flex shrink-0 items-center gap-3 rounded-full px-5 py-3 text-left text-[15px] font-semibold transition-colors ${
                selected ? 'bg-white text-paper-ink' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <GIcon size={18} />
              {g.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-white/[0.06] p-8 text-white ring-1 ring-white/10 md:p-10">
        <span className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-marigold text-paper-ink">
          <Icon size={28} />
        </span>
        <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{goal.label}</h3>
        <p className="mt-3 max-w-lg text-lg leading-relaxed text-white/65">{goal.copy}</p>
        <Link
          href={goal.href}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-paper-ink transition-colors hover:bg-marigold"
        >
          See matching courses
        </Link>
      </div>
    </div>
  );
}
