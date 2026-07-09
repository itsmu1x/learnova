'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@learnova/ui';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Match pathname exactly (default: prefix match). */
  exact?: boolean;
  /** Paths that should not activate this item when using prefix match. */
  exclude?: string[];
}

interface DashboardShellProps {
  badge: string;
  nav: DashboardNavItem[];
  children: React.ReactNode;
}

export function DashboardShell({ badge, nav, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100/80 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            L
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Learnova</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-600">{badge}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
                !(item.exclude ?? []).some((ex) => pathname === ex || pathname.startsWith(`${ex}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                )}
              >
                <span className={cn('shrink-0', active ? 'text-indigo-600 dark:text-indigo-400' : '')}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-slate-200/80 p-3 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to site
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 dark:hover:bg-slate-900"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-[260px]">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
