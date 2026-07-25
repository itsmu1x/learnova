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
    accent: '#0057FF',
  },
  {
    id: 'design',
    label: 'Level up design',
    icon: Palette,
    copy: 'Craft interfaces people love. Product thinking, visual systems, and prototyping.',
    href: '/search?q=design',
    accent: '#E11D48',
  },
  {
    id: 'career',
    label: 'Grow your career',
    icon: Briefcase,
    copy: 'Communication, leadership, and portfolio skills that show up in interviews.',
    href: '/search?q=career',
    accent: '#0F766E',
  },
  {
    id: 'ai',
    label: 'Work with AI',
    icon: Bot,
    copy: 'Use AI as a co-pilot — prompting, workflows, and building with modern models.',
    href: '/search?q=ai',
    accent: '#0369A1',
  },
  {
    id: 'business',
    label: 'Build & market',
    icon: TrendingUp,
    copy: 'Strategy, growth, and storytelling for founders and operators.',
    href: '/search?q=business',
    accent: '#C2410C',
  },
] as const;

export function GoalPicker() {
  const [active, setActive] = useState<(typeof GOALS)[number]['id']>('dev');
  const goal = GOALS.find((g) => g.id === active) ?? GOALS[0];
  const Icon = goal.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {GOALS.map((g) => {
          const selected = g.id === active;
          const GIcon = g.icon;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setActive(g.id)}
              className={`flex shrink-0 items-center gap-3 border px-4 py-3 text-left font-display text-sm font-semibold transition ${
                selected
                  ? 'border-white bg-white text-[#0B0D12]'
                  : 'border-white/20 bg-white/5 text-white/70 hover:border-white/45 hover:text-white'
              }`}
            >
              <GIcon size={18} />
              {g.label}
            </button>
          );
        })}
      </div>

      <div
        className="relative overflow-hidden p-8 text-white md:p-10"
        style={{ background: `linear-gradient(135deg, ${goal.accent} 0%, #0B0D12 78%)` }}
      >
        <Icon className="mb-6 opacity-90" size={36} />
        <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{goal.label}</h3>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-white/75">{goal.copy}</p>
        <Link
          href={goal.href}
          className="mt-8 inline-flex items-center gap-2 bg-white px-5 py-2.5 font-display text-sm font-semibold text-[#0B0D12] transition hover:bg-white/90"
        >
          Browse matching courses →
        </Link>
      </div>
    </div>
  );
}
