import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import SiteHeader from './components/site-header';
import { createServerComponentClient } from '@/lib/supabase-server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pain2Gain',
  description: 'Transform pain points into business opportunities',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  let hasSession = false;

  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    hasSession = Boolean(session);
  } catch {
    hasSession = false;
  }

  return (
    <html lang="en">
      <body className={`${inter.className} dark-body`}>
        <SiteHeader hasSession={hasSession} />
        <main
          style={{
            minHeight: '100vh',
            padding: '2.5rem 0 4rem',
          }}
        >
          <div
            style={{
              maxWidth: 1080,
              width: '95vw',
              margin: '0 auto',
            }}
          >
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
