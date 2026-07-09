'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { GraduationCap, Moon, Search, Sun } from 'lucide-react';
import { Button, Container } from '@learnova/ui';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, logout, can } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap size={20} />
          </span>
          <span className="text-lg">Learnova</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <Link href="/courses" className="hover:text-indigo-600">Courses</Link>
          <Link href="/pricing" className="hover:text-indigo-600">Pricing</Link>
          {user && can('VIEW_INSTRUCTOR_PANEL') ? (
            <Link href="/instructor" className="hover:text-indigo-600">Teach</Link>
          ) : null}
          {user && can('VIEW_ADMIN_PANEL') ? (
            <Link href="/admin" className="hover:text-indigo-600">Admin</Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 sm:block dark:hover:bg-slate-800">
            <Search size={18} />
          </Link>
          {mounted ? (
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          ) : null}

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
              <button
                onClick={() => void logout()}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
