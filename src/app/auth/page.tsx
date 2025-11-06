'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (!isLogin && password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          router.push('/app/profile');
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          router.push('/app/profile');
          router.refresh();
        } else {
          setError('Please check your email to confirm your account before signing in.');
          setLoading(false);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
        setError('Supabase is not configured. Please set up your environment variables.');
      } else {
        setError('An unexpected error occurred');
      }
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
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
        }}
      >
        {isLogin ? 'Sign In' : 'Sign Up'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151',
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151',
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: '14px',
            }}
          />
        </div>

        {!isLogin && (
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#374151',
              }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: '14px',
              }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#991b1b',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: loading ? '#9ca3af' : '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem',
          }}
        >
          {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            setPassword('');
            setConfirmPassword('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#111827',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
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

