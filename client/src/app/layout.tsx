import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Learnova — Learn the skills that move your career forward',
    template: '%s · Learnova',
  },
  description:
    'Industry-grade, project-based courses in full-stack engineering, cloud, data and design — taught by engineers who ship.',
  keywords: ['online courses', 'full stack', 'next.js', 'express', 'learning management system'],
  authors: [{ name: 'Learnova' }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f1a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
