'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@learnova/ui';
import { ArrowLeft, LogOut, Settings } from 'lucide-react';
import { Logo } from '@/components/logo';
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

  const isActive = (item: DashboardNavItem) =>
    item.exact
      ? pathname === item.href
      : (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
        !(item.exclude ?? []).some((ex) => pathname === ex || pathname.startsWith(`${ex}/`));

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-paper-ink text-white lg:flex">
        <Link href="/" className="flex h-[72px] items-center gap-3 px-6">
          <Logo variant="mark" height={30} />
          <div>
            <p className="font-display text-lg font-semibold leading-none tracking-tight">Learnova</p>
            <p className="mt-1 text-xs font-semibold text-marigold">{badge}</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-medium transition-colors',
                  active ? 'bg-white text-paper-ink' : 'text-white/65 hover:bg-white/[0.07] hover:text-white',
                )}
              >
                <span className={cn('shrink-0', active ? 'text-signal' : '')}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white/55 hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to site
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white/55 hover:bg-white/[0.07] hover:text-white"
          >
            <Settings size={16} />
            Settings
          </Link>
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marigold font-display text-sm font-semibold text-paper-ink">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-white/50">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar: below lg the sidebar collapses into a scrollable tab row. */}
      <header className="sticky top-0 z-40 bg-paper-ink text-white lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="mark" height={24} />
            <span className="font-display font-semibold">Learnova</span>
          </Link>
          <span className="text-xs font-semibold text-marigold">{badge}</span>
          <button
            type="button"
            onClick={() => void logout()}
            className="ml-auto rounded-lg p-2 text-white/60 hover:text-white"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium',
                isActive(item) ? 'bg-white text-paper-ink' : 'text-white/65',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="lg:pl-[264px]">
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
