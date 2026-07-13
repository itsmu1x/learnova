import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { SiteChrome } from '@/components/site-chrome';

export const metadata: Metadata = {
  title: 'Learnova — Learn without limits',
  description:
    'Premium video courses with AI-powered learning, secure streaming, and certificates.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Learnova — Learn without limits',
    description:
      'Premium video courses with AI-powered learning, secure streaming, and certificates.',
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
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <AuthProvider>
            <SiteChrome>{children}</SiteChrome>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
