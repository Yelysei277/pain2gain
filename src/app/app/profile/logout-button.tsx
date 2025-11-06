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
        padding: '0.75rem 1.5rem',
        background: loading ? '#9ca3af' : '#ef4444',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        fontSize: '14px',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}

