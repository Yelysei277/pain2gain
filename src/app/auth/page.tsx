'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = '/';

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
          router.push(redirectTarget);
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
          router.push(redirectTarget);
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
        maxWidth: 420,
        margin: '4rem auto',
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
          letterSpacing: '-0.01em',
          textAlign: 'center',
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
              color: 'var(--text-secondary)',
              letterSpacing: '0.02em',
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
              padding: '0.85rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              fontSize: '14px',
              background: 'rgba(15, 23, 42, 0.65)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.55)';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(56, 189, 248, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
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
              color: 'var(--text-secondary)',
              letterSpacing: '0.02em',
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
              padding: '0.85rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              fontSize: '14px',
              background: 'rgba(15, 23, 42, 0.65)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.55)';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(56, 189, 248, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
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
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
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
                padding: '0.85rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                fontSize: '14px',
                background: 'rgba(15, 23, 42, 0.65)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.55)';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(56, 189, 248, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.85rem',
              marginBottom: '1rem',
              background: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              borderRadius: 10,
              color: 'rgba(254, 226, 226, 0.92)',
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
            padding: '0.85rem',
            background: loading
              ? 'rgba(148, 163, 184, 0.35)'
              : 'linear-gradient(135deg, rgba(56, 211, 145, 0.92), rgba(56, 189, 248, 0.92))',
            color: loading ? 'rgba(226, 232, 240, 0.6)' : '#020617',
            border: 'none',
            borderRadius: 999,
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1.25rem',
            boxShadow: loading ? 'none' : '0 16px 32px rgba(56, 211, 145, 0.25)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 22px 38px rgba(56, 211, 145, 0.35)';
          }}
          onMouseLeave={(e) => {
            if (loading) return;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 16px 32px rgba(56, 211, 145, 0.25)';
          }}
        >
          {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <div
        style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}
      >
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
            color: 'var(--accent-blue)',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none',
            letterSpacing: '0.02em',
            transition: 'opacity 0.2s ease',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            maxWidth: 420,
            margin: '4rem auto',
            padding: '2.5rem',
            background: 'var(--bg-card)',
            borderRadius: 18,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-soft)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontSize: '15px',
            letterSpacing: '0.01em',
          }}
        >
          Loading authentication...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

