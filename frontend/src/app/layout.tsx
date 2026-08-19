import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });

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
