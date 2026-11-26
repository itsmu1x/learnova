import type { ReactNode } from 'react';
import { BadgeCheck, Bot, PlayCircle } from 'lucide-react';

const PERKS = [
  { icon: PlayCircle, text: 'Video lessons that remember where you stopped' },
  { icon: Bot, text: 'An AI tutor that knows the lesson you are on' },
  { icon: BadgeCheck, text: 'Certificates with a public link anyone can check' },
];

/** Form on the left, a short "what you get" panel on the right (desktop only). */
export function AuthShell({
  mode = 'login',
  children,
}: {
  mode?: 'login' | 'register';
  children: ReactNode;
}) {
  const caption = mode === 'login' ? 'Your next lesson is waiting.' : 'Every skill starts with one lesson.';

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,30rem)_1fr]">
        <div className="animate-fade-up rounded-4xl border border-paper-line bg-paper-elev p-7 sm:p-10">{children}</div>

        <aside className="animate-fade-up delay-1 relative hidden overflow-hidden rounded-4xl bg-paper-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-signal/40 blur-3xl"
          />
          <p className="relative max-w-md text-balance font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em]">
            {caption}
          </p>

          <ul className="relative space-y-5">
            {PERKS.map(({ icon: Icon, text }, i) => (
              <li key={text} className="flex items-center gap-4 text-lg text-white/80">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                    i === PERKS.length - 1 ? 'bg-marigold text-paper-ink' : 'bg-white/10'
                  }`}
                >
                  <Icon size={20} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
