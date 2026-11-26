import { BadgeCheck, Bot, PlayCircle } from 'lucide-react';

const STEPS = [
  {
    icon: PlayCircle,
    title: 'Watch',
    body: 'Stream lessons on web or mobile. Your place is saved, so you can pick up on any device.',
  },
  {
    icon: Bot,
    title: 'Ask',
    body: 'Stuck mid-lesson? Ask the AI tutor. It already knows which video you are watching.',
  },
  {
    icon: BadgeCheck,
    title: 'Prove',
    body: 'Finish the course to earn a certificate with a QR code and a public link anyone can check.',
  },
] as const;

export function LearnFlow() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {STEPS.map((s, i) => {
        const last = i === STEPS.length - 1;
        return (
          <li
            key={s.title}
            className={`relative rounded-4xl p-8 ${
              last ? 'bg-marigold text-paper-ink' : 'border border-paper-line bg-paper-elev'
            }`}
          >
            <div className="flex items-center justify-between">
              <s.icon size={28} className={last ? '' : 'text-signal dark:text-signal-bright'} />
              <span className={`font-display text-sm font-semibold ${last ? 'text-paper-ink/60' : 'text-paper-mute'}`}>
                Step {i + 1}
              </span>
            </div>
            <h3 className="mt-10 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
            <p className={`mt-2 leading-relaxed ${last ? 'text-paper-ink/75' : 'text-paper-mute'}`}>{s.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
