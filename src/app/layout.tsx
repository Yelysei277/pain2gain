import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pain2Gain',
  description: 'Transform pain points into business opportunities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

