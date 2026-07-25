'use client';

import { useState } from 'react';
import { BadgeCheck, Bot, PlayCircle } from 'lucide-react';

const STEPS = [
  {
    id: 'watch',
    icon: PlayCircle,
    title: 'Watch',
    label: '01',
    body: 'Stream lessons on Mux — smooth playback on web and mobile, with progress that follows you.',
  },
  {
    id: 'ask',
    icon: Bot,
    title: 'Ask',
    label: '02',
    body: 'Stuck mid-lesson? Open the AI tutor with the current video context and get a clear answer.',
  },
  {
    id: 'prove',
    icon: BadgeCheck,
    title: 'Prove',
    label: '03',
    body: 'Finish the course, earn a QR-backed certificate, and share a public verification link.',
  },
] as const;

export function LearnFlow() {
  const [active, setActive] = useState<(typeof STEPS)[number]['id']>('watch');
  const step = STEPS.find((s) => s.id === active) ?? STEPS[0];
  const Icon = step.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
      <div className="flex flex-col gap-2">
        {STEPS.map((s) => {
          const selected = s.id === active;
          const SIcon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              onMouseEnter={() => setActive(s.id)}
              className={`flex items-center gap-4 border px-5 py-4 text-left transition ${
                selected
                  ? 'border-[#0057FF] bg-[#0057FF] text-white'
                  : 'border-[#D8DCE6] bg-white text-[#0B0D12] hover:border-[#0057FF]/50 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
              }`}
            >
              <span className={`font-display text-sm font-bold ${selected ? 'text-white/70' : 'text-[#5C6578]'}`}>
                {s.label}
              </span>
              <SIcon size={20} />
              <span className="font-display text-lg font-semibold">{s.title}</span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden border border-[#D8DCE6] bg-[#F3F4F6] p-8 dark:border-slate-700 dark:bg-[#0B0D12] md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#0057FF]/15 blur-2xl"
        />
        <Icon className="text-[#0057FF] dark:text-[#4D8BFF]" size={36} />
        <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight md:text-3xl">{step.title}</h3>
        <p className="mt-3 max-w-md text-base leading-relaxed text-[#5C6578] dark:text-slate-400">{step.body}</p>
        <div className="mt-8 flex gap-2">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={`h-1 flex-1 transition ${s.id === active ? 'bg-[#0057FF]' : 'bg-[#D8DCE6] dark:bg-slate-700'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
