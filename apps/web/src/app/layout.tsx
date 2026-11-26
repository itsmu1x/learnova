import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { SiteChrome } from '@/components/site-chrome';

const body = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Learnova — Learn with intent',
  description: 'Video courses, an AI tutor, and verifiable certificates — built for focused learning.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Learnova — Learn with intent',
    description: 'Video courses, an AI tutor, and verifiable certificates — built for focused learning.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Learnova' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${body.variable} ${display.variable} min-h-screen font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <SiteChrome>{children}</SiteChrome>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
