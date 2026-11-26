'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';

/** Public marketing chrome — hidden on instructor/admin dashboard routes. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard =
    pathname?.startsWith('/instructor') || pathname?.startsWith('/admin');

  if (isDashboard) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
