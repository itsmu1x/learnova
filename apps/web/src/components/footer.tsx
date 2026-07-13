import Link from 'next/link';
import { Container } from '@learnova/ui';
import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <Container className="grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Logo variant="mark" height={32} />
            Learnova
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Premium video courses with AI-powered learning to help you master new skills.
          </p>
        </div>
        <FooterCol title="Platform" links={[['Browse courses', '/courses'], ['Pricing', '/pricing'], ['Become an instructor', '/instructor']]} />
        <FooterCol title="Company" links={[['About', '#'], ['Careers', '#'], ['Blog', '#']]} />
        <FooterCol title="Support" links={[['Help center', '#'], ['Verify certificate', '/verify/certificate'], ['Contact', '#']]} />
      </Container>
      <div className="border-t border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} Learnova. Built as a portfolio project.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-slate-500">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-indigo-600">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
