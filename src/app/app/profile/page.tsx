import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase-server';
import ProfileSubscriptionForm from '@/app/components/profile-subscription-form';
import LogoutButton from './logout-button';

export default async function ProfilePage() {
  const loginRedirect = `/auth?redirect=${encodeURIComponent('/app/profile')}`;

  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      redirect(loginRedirect);
    }

    return (
      <div
        style={{
          maxWidth: 880,
          margin: '3rem auto',
          padding: '0 1.5rem',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '2.5rem',
            borderRadius: 18,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '1.75rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Profile
          </h1>

          <div style={{ marginBottom: '2.25rem' }}>
            <ProfileSubscriptionForm initialEmail={session.user.email} />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  } catch {
    redirect(loginRedirect);
  }
}

