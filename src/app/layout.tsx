import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pain2Gain',
  description: 'Transform pain points into business opportunities',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '1rem 0',
            background: '#fff',
          }}
        >
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Image src="/logo.svg" alt="Pain2Gain logo" width={150} height={28} />
            <Link
              href="/"
              style={{
                fontSize: '14px',
                color: '#111827',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Ideas
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
