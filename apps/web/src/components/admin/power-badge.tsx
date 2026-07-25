export function PowerBadge({ power, compact }: { power: number; compact?: boolean }) {
  const tone =
    power >= 90 ? 'bg-[#0B0D12] text-white dark:bg-white dark:text-[#0B0D12]' : power >= 40 ? 'bg-[#0057FF] text-white' : 'bg-[#E8F0FF] text-[#003FBB] dark:bg-slate-800 dark:text-[#4D8BFF]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-display font-semibold uppercase tracking-wider ${
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
      <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-500">
        <span>Power</span>
        <span className="tabular-nums text-slate-700 dark:text-slate-300">{power}</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-[#0057FF] transition-all dark:bg-[#4D8BFF]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
