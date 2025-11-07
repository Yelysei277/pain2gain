'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error during logout:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: '0.85rem 1.75rem',
        background: loading
          ? 'rgba(248, 113, 113, 0.2)'
          : 'linear-gradient(135deg, rgba(248, 113, 113, 0.92), rgba(239, 68, 68, 0.92))',
        color: loading ? 'rgba(254, 226, 226, 0.72)' : '#fee2e2',
        border: '1px solid rgba(248, 113, 113, 0.4)',
        borderRadius: 999,
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 18px 32px rgba(190, 18, 60, 0.35)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (loading) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 24px 42px rgba(190, 18, 60, 0.45)';
      }}
      onMouseLeave={(e) => {
        if (loading) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 18px 32px rgba(190, 18, 60, 0.35)';
      }}
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}

