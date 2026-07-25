'use client';

import { useMemo } from 'react';
import type { PermissionKey } from '@learnova/shared';
import { Button } from '@learnova/ui';

export interface PermissionMeta {
  key: string;
  label: string;
  description: string | null;
  category: string;
  kind: 'page' | 'action';
}

export function RolePermissionEditor({
  catalog,
  selected,
  onChange,
  disabled,
  onSave,
  saving,
}: {
  catalog: PermissionMeta[];
  selected: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  onSave?: () => void;
  saving?: boolean;
}) {
  const byCategory = useMemo(() => {
    const map = new Map<string, PermissionMeta[]>();
    for (const p of catalog) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [catalog]);

  function toggle(key: string) {
    if (disabled) return;
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  return (
    <div className="space-y-5">
      {byCategory.map(([category, perms]) => (
        <section key={category}>
          <h4 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-[#0057FF] dark:text-[#4D8BFF]">
            {category}
          </h4>
          <ul className="mt-2 space-y-1">
            {perms.map((p) => {
              const on = selected.includes(p.key);
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(p.key)}
                    className={`flex w-full items-start justify-between gap-3 border px-3 py-2.5 text-left transition ${
                      on
                        ? 'border-[#0057FF] bg-[#E8F0FF]/60 dark:border-[#4D8BFF] dark:bg-[#0f1a33]'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900 dark:text-white">{p.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{p.description}</span>
                    </span>
                    <span className="shrink-0 font-display text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {p.kind}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {onSave ? (
        <Button className="w-full rounded-none" disabled={disabled || saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save permissions'}
        </Button>
      ) : null}
    </div>
  );
}

export type { PermissionKey };
