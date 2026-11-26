export function PowerBadge({ power, compact }: { power: number; compact?: boolean }) {
  const tone =
    power >= 90 ? 'bg-paper-ink text-white dark:bg-white dark:text-paper-ink' : power >= 40 ? 'bg-signal text-white' : 'bg-signal-soft text-signal-deep dark:bg-slate-800 dark:text-signal-bright';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-display font-semibold ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'
      } ${tone}`}
      title={`Power ${power}`}
    >
      <span className="opacity-70">PWR</span>
      {power}
    </span>
  );
}

export function PowerMeter({ power, max = 100 }: { power: number; max?: number }) {
  const pct = Math.min(100, Math.round((power / max) * 100));
  return (
    <div className="w-full max-w-[120px]">
      <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-slate-500">
        <span>Power</span>
        <span className="tabular-nums text-slate-700 dark:text-slate-300">{power}</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-signal transition-all dark:bg-signal-bright"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
