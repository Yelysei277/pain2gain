'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';

export default function NavAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    try {
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

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          href="/app/profile"
          style={{
            fontSize: '14px',
            color: '#111827',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Profile
        </Link>
        <button
          onClick={handleLogout}
          style={{
            fontSize: '14px',
            color: '#111827',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            padding: 0,
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      style={{
        fontSize: '14px',
        color: '#111827',
        textDecoration: 'none',
        fontWeight: 500,
      }}
    >
      Login
    </Link>
  );
}

