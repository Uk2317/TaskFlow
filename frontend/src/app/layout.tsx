import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import './globals.css';

// Self-hosted so the production build never reaches out to Google Fonts at build
// time (that made `next build` fail on any offline or firewalled runner).
// Variable weight file, latin subset, taken from @fontsource-variable/plus-jakarta-sans.
// Licensed under the SIL Open Font License 1.1 — see ./fonts/PlusJakartaSans-OFL.txt
const sans = localFont({
  src: './fonts/plus-jakarta-sans-latin-variable.woff2',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  variable: '--font-sans',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'TaskFlow — Personal tasks',
  description: 'JWT-secured task manager with weather, files, and email notifications.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} bg-slate-50 font-sans text-slate-800 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
