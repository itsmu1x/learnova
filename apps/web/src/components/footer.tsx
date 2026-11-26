import Link from 'next/link';
import { Container } from '@learnova/ui';
import { Logo } from '@/components/logo';

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Learn',
    links: [
      ['Courses', '/courses'],
      ['Pricing', '/pricing'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['Log in', '/login'],
      ['Create account', '/register'],
      ['My learning', '/dashboard'],
    ],
  },
  {
    title: 'More',
    links: [
      ['Verify a certificate', '/verify/certificate'],
      ['Teach on Learnova', '/register/instructor'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-paper-ink text-white">
      <Container className="grid gap-12 pb-10 pt-16 md:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Logo variant="mark" height={28} />
            <span className="font-display text-xl font-semibold tracking-tight">Learnova</span>
          </div>
          <p className="mt-4 leading-relaxed text-white/60">
            Video courses with an AI tutor beside every lesson, and certificates anyone can verify.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-marigold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-[15px] text-white/70">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-white/10 py-6 text-sm text-white/45 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Learnova</span>
        <span>Learn it, then prove it.</span>
      </Container>
    </footer>
  );
}
