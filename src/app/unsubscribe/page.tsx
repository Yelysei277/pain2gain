'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Status = 'loading' | 'success' | 'error';

export default function UnsubscribePage() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid or expired unsubscribe link.');
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`);

        if (!response.ok) {
          let errorMessage = 'Failed to unsubscribe. Please try again.';
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // Response is not JSON, use default error message
          }
          setStatus('error');
          setMessage(errorMessage);
          return;
        }

        const data = await response.json();
        setStatus('success');
        setMessage(data.message || 'You have successfully unsubscribed.');
      } catch {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again later.');
      }
    };

    unsubscribe();
  }, [searchParams]);

  return (
    <div
      style={{
        maxWidth: 540,
        margin: '4.5rem auto',
        padding: '2.5rem',
        background: 'var(--bg-card)',
        borderRadius: 18,
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <h1
        style={{
          fontSize: '26px',
          fontWeight: 700,
          marginBottom: '1.75rem',
          color: 'var(--text-primary)',
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        Unsubscribe
      </h1>

      {status === 'loading' && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-muted)',
            fontSize: '16px',
          }}
        >
          Processing your request...
        </div>
      )}

      {status === 'success' && (
        <div
          style={{
            padding: '1.75rem',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: 12,
            color: 'rgba(187, 247, 208, 0.92)',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '1.5rem',
            letterSpacing: '0.02em',
          }}
        >
          <span aria-hidden style={{ marginRight: '8px' }}>
            ✅
          </span>
          {message}
        </div>
      )}

      {status === 'error' && (
        <div
          style={{
            padding: '1.75rem',
            background: 'rgba(248, 113, 113, 0.12)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            borderRadius: 12,
            color: 'rgba(254, 202, 202, 0.92)',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '1.5rem',
            letterSpacing: '0.02em',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link
          href="/"
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <span aria-hidden>←</span>
          <span>Back to Ideas</span>
        </Link>
      </div>
    </div>
  );
}

