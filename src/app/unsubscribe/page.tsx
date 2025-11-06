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
        maxWidth: 500,
        margin: '4rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 600,
          marginBottom: '1.5rem',
          color: '#111827',
          textAlign: 'center',
        }}
      >
        Unsubscribe
      </h1>

      {status === 'loading' && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280',
            fontSize: '16px',
          }}
        >
          Processing your request...
        </div>
      )}

      {status === 'success' && (
        <div
          style={{
            padding: '1.5rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            color: '#166534',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          ✅ {message}
        </div>
      )}

      {status === 'error' && (
        <div
          style={{
            padding: '1.5rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            color: '#991b1b',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '1.5rem',
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
            color: '#6b7280',
            textDecoration: 'none',
          }}
        >
          ← Back to Ideas
        </Link>
      </div>
    </div>
  );
}

