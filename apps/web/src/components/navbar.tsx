'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Menu, Moon, Search, Sun, X } from 'lucide-react';
import { Button, Container, cn } from '@learnova/ui';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, logout, can } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  const links: [string, string][] = [
    ['Courses', '/courses'],
    ['Pricing', '/pricing'],
  ];
  if (user && can('VIEW_INSTRUCTOR_PANEL')) links.push(['Teach', '/instructor']);
  else if (!user) links.push(['Teach', '/register/instructor']);
  if (user && can('VIEW_ADMIN_PANEL')) links.push(['Admin', '/admin']);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-paper-line bg-paper/80 backdrop-blur-xl">
      <Container className="flex h-[68px] items-center gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-paper-ink dark:text-white">
          <Logo variant="mark" height={30} priority />
          <span className="font-display text-xl font-semibold tracking-tight">Learnova</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors',
                isActive(href)
                  ? 'bg-paper-ink text-white dark:bg-white dark:text-paper-ink'
                  : 'text-paper-mute hover:text-paper-ink dark:hover:text-white',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Search courses"
            className="rounded-full p-2.5 text-paper-mute transition-colors hover:bg-paper-ink/5 hover:text-paper-ink dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Search size={18} />
          </Link>
          {mounted ? (
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded-full p-2.5 text-paper-mute transition-colors hover:bg-paper-ink/5 hover:text-paper-ink dark:hover:bg-white/10 dark:hover:text-white"
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          ) : null}

          <div className="ml-2 hidden items-center gap-2 sm:flex">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="px-2 text-sm font-medium text-paper-mute transition-colors hover:text-paper-ink dark:hover:text-white"
                >
                  Sign out
                </button>
                <Link href="/dashboard">
                  <Button size="sm">My learning</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Start learning</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="rounded-full p-2.5 text-paper-ink md:hidden dark:text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-paper-line bg-paper md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl px-4 py-3 font-display text-lg font-medium text-paper-ink hover:bg-paper-ink/5 dark:text-white dark:hover:bg-white/10"
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-paper-line pt-4">
              {user ? (
                <>
                  <Link href="/dashboard" className="flex-1">
                    <Button className="w-full">My learning</Button>
                  </Link>
                  <Button variant="outline" onClick={() => void logout()}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full">Start learning</Button>
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
