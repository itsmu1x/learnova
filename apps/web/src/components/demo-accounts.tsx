'use client';

import { Info } from 'lucide-react';

const DEMOS = [
  { role: 'Instructor', email: 'instructor@learnova.dev', hint: 'Teach panel' },
  { role: 'Admin', email: 'admin@learnova.dev', hint: 'Admin panel' },
] as const;

const DEMO_PASSWORD = 'Password123';

export function DemoAccounts({
  onPick,
}: {
  onPick?: (email: string, password: string) => void;
}) {
  return (
    <div className="mt-8 border border-[#D8DCE6] bg-[#F3F4F6]/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex items-start gap-2.5">
        <Info size={16} className="mt-0.5 shrink-0 text-[#0057FF] dark:text-[#4D8BFF]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-[#0057FF] dark:text-[#4D8BFF]">
                  Demo accounts
                </p>
                <span className="border border-[#0057FF]/30 bg-[#0057FF]/10 px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-[#0057FF] dark:border-[#4D8BFF]/40 dark:bg-[#4D8BFF]/15 dark:text-[#4D8BFF]">
                  View only
                </span>
              </div>
              <p className="text-[11px] text-[#5C6578] dark:text-slate-500">
                Password <span className="font-medium text-[#0B0D12] dark:text-slate-300">{DEMO_PASSWORD}</span>
              </p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#5C6578] dark:text-slate-400">
              These accounts can view the instructor and admin panels only — they can&apos;t change anything.
              {onPick ? ' Click a role to fill the form.' : null}
            </p>
          </div>

          <ul className="divide-y divide-[#D8DCE6] border-t border-[#D8DCE6] dark:divide-slate-700 dark:border-slate-700">
            {DEMOS.map((demo) => {
              const content = (
                <>
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-semibold text-[#0B0D12] group-hover:text-[#0057FF] dark:text-white dark:group-hover:text-[#4D8BFF]">
                      {demo.role}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-[#5C6578] dark:text-slate-400">
                      {demo.email}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-[#5C6578] group-hover:text-[#0057FF] dark:text-slate-500 dark:group-hover:text-[#4D8BFF]">
                    {onPick ? `${demo.hint} →` : demo.hint}
                  </span>
                </>
              );

              return (
                <li key={demo.email}>
                  {onPick ? (
                    <button
                      type="button"
                      onClick={() => onPick(demo.email, DEMO_PASSWORD)}
                      className="group flex w-full items-center justify-between gap-3 px-2 py-3 text-left transition hover:bg-white/80 dark:hover:bg-slate-950/60"
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-3 px-2 py-3">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
