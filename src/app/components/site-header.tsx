'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavAuth from './nav-auth';

type SiteHeaderProps = {
  hasSession: boolean;
};

export default function SiteHeader({ hasSession }: SiteHeaderProps) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <header
      style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 18px 38px rgba(2, 6, 23, 0.55)',
      }}
    >
      <nav
        style={{
          maxWidth: 1080,
          width: '95vw',
          margin: '0 auto',
          padding: '1.25rem 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
          <Image src="/logo.svg" alt="Pain2Gain logo" width={150} height={28} priority />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          {isLanding ? (
            hasSession ? (
              <Link
                href="/ideas"
                style={{
                  padding: '0.65rem 1.6rem',
                  borderRadius: 999,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  color: '#020617',
                  background: 'linear-gradient(135deg, rgba(56, 211, 145, 0.95), rgba(56, 189, 248, 0.95))',
                  boxShadow: '0 14px 28px rgba(56, 211, 145, 0.25)',
                  textDecoration: 'none',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                Go to Ideas
              </Link>
            ) : (
              <Link
                href="/auth?redirect=%2Fideas"
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  opacity: 0.88,
                  transition: 'opacity 0.2s ease',
                }}
              >
                Login
              </Link>
            )
          ) : (
            <>
              <Link href="/ideas" className="nav-link">
                Ideas
              </Link>
              <Suspense fallback={null}>
                <NavAuth />
              </Suspense>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}


