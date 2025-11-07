'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';

export default function NavAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const authHref = useMemo(() => {
    if (!pathname) {
      return '/auth?redirect=%2Fideas';
    }

    const searchString = searchParams?.toString() ?? '';
    const redirectTarget = `${pathname}${searchString ? `?${searchString}` : ''}`;

    if (pathname.startsWith('/auth')) {
      return '/auth';
    }

    const normalizedTarget = !redirectTarget || redirectTarget === '/' ? '/ideas' : redirectTarget;

    return `/auth?redirect=${encodeURIComponent(normalizedTarget)}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
      setSupabaseConfigured(true);
    } catch (error) {
      console.error('Supabase not configured:', error);
      setSupabaseConfigured(false);
      setLoading(false);
      return;
    }

    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch {
      // Silently fail - user can try again
    }
  };

  if (loading) {
    return null;
  }

  if (!supabaseConfigured) {
    return (
      <Link
        href={authHref}
        style={{
          fontSize: '14px',
          color: 'var(--text-primary)',
          textDecoration: 'none',
          fontWeight: 500,
          letterSpacing: '0.02em',
          opacity: 0.88,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.88';
        }}
      >
        Login
      </Link>
    );
  }

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          href="/app/profile"
          style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: 500,
            letterSpacing: '0.02em',
            opacity: 0.88,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.88';
          }}
        >
          Profile
        </Link>
        <button
          onClick={handleLogout}
          style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            background: 'rgba(56, 211, 145, 0.12)',
            border: '1px solid rgba(56, 211, 145, 0.35)',
            cursor: 'pointer',
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: '999px',
            letterSpacing: '0.02em',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(56, 211, 145, 0.22)';
            e.currentTarget.style.borderColor = 'rgba(56, 211, 145, 0.55)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(56, 211, 145, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(56, 211, 145, 0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href={authHref}
      style={{
        fontSize: '14px',
        color: 'var(--text-primary)',
        textDecoration: 'none',
        fontWeight: 500,
        letterSpacing: '0.02em',
        opacity: 0.88,
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.88';
      }}
    >
      Login
    </Link>
  );
}

