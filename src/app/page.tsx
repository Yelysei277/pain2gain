import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase-server';

export default async function HomePage() {
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

  const ctaHref = hasSession ? '/ideas' : '/auth?mode=signup&redirect=%2Fideas';
  const ctaLabel = hasSession ? 'Continue to Ideas' : 'Join the Community';

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        padding: '6rem 0',
        gap: '2rem',
      }}
    >
      <div style={{ maxWidth: 760 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 1.1rem',
            borderRadius: 999,
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: 'rgba(224, 242, 254, 0.82)',
            fontSize: '13px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Product discovery, reimagined
        </span>
        <h1
          style={{
            marginTop: '1.75rem',
            fontSize: '3.25rem',
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: 'var(--text-primary)',
          }}
        >
          The future of idea validation is <span style={{ color: 'rgba(56, 211, 145, 0.92)' }}>human</span> +{' '}
          <span style={{ color: 'rgba(56, 189, 248, 0.92)' }}>AI</span>
        </h1>
        <p
          style={{
            marginTop: '1.25rem',
            fontSize: '1.2rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em',
          }}
        >
          Pain2Gain maps the signals you need, tracks the insights you have, and turns scattered feedback into ready-to-build startup ideas. Close your opportunity gaps and ship what people crave.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
        <Link
          href={ctaHref}
          style={{
            padding: '0.95rem 2.75rem',
            borderRadius: 999,
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: '#020617',
            background: 'linear-gradient(135deg, rgba(56, 211, 145, 0.95), rgba(56, 189, 248, 0.95))',
            boxShadow: '0 20px 38px rgba(56, 211, 145, 0.28)',
            textDecoration: 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {ctaLabel}
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No spam. Just traction-ready insights.</span>
      </div>
    </section>
  );
}
