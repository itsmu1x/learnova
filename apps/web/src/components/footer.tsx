import Link from 'next/link';
import { Container } from '@learnova/ui';
import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="border-t border-paper-line bg-paper dark:border-slate-800 dark:bg-paper-ink">
      <Container className="flex flex-col gap-10 py-14 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5 text-paper-ink dark:text-white">
            <Logo variant="mark" height={28} />
            <span className="font-display text-lg font-semibold tracking-tight">Learnova</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-paper-mute">
            A focused learning platform — courses, AI help, and certificates you can verify.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-12 gap-y-8 text-sm">
          <FooterCol
            title="Learn"
            links={[
              ['Courses', '/courses'],
              ['Pricing', '/pricing'],
              ['Search', '/search'],
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              ['Log in', '/login'],
              ['Register', '/register'],
              ['Dashboard', '/dashboard'],
            ]}
          />
          <FooterCol
            title="Trust"
            links={[
              ['Verify certificate', '/verify/certificate'],
              ['Become an instructor', '/register/instructor'],
            ]}
          />
        </div>
      </Container>
      <div className="border-t border-paper-line py-5 text-center text-xs text-paper-mute dark:border-slate-800">
        © {new Date().getFullYear()} Learnova
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold text-paper-ink dark:text-white">{title}</h4>
      <ul className="mt-3 space-y-2 text-paper-mute">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="transition-colors hover:text-paper-ink dark:hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
