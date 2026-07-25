'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Search, Sun } from 'lucide-react';
import { Button, Container } from '@learnova/ui';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, logout, can } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-paper-line/80 bg-paper/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-paper-ink/85">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 text-paper-ink dark:text-white">
          <Logo variant="mark" height={32} priority />
          <span className="font-display text-lg font-semibold tracking-tight">Learnova</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-paper-mute md:flex">
          <Link href="/courses" className="transition-colors hover:text-paper-ink dark:hover:text-white">
            Courses
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-paper-ink dark:hover:text-white">
            Pricing
          </Link>
          {user && can('VIEW_INSTRUCTOR_PANEL') ? (
            <Link href="/instructor" className="transition-colors hover:text-paper-ink dark:hover:text-white">
              Teach
            </Link>
          ) : !user ? (
            <Link href="/register/instructor" className="transition-colors hover:text-paper-ink dark:hover:text-white">
              Teach
            </Link>
          ) : null}
          {user && can('VIEW_ADMIN_PANEL') ? (
            <Link href="/admin" className="transition-colors hover:text-paper-ink dark:hover:text-white">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            className="hidden rounded-md p-2 text-paper-mute transition-colors hover:bg-black/5 hover:text-paper-ink sm:block dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Search size={18} />
          </Link>
          {mounted ? (
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-md p-2 text-paper-mute transition-colors hover:bg-black/5 hover:text-paper-ink dark:hover:bg-white/10 dark:hover:text-white"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          ) : null}

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="secondary" size="sm" className="rounded-md">
                  Dashboard
                </Button>
              </Link>
              <button
                onClick={() => void logout()}
                className="px-2 text-sm font-medium text-paper-mute transition-colors hover:text-paper-ink dark:hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-md">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-md">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
