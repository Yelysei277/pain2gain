import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/db-types';
import LogoutButton from './logout-button';

type SubscriptionData = Database['public']['Tables']['subscriptions']['Row'] | null;

export default async function ProfilePage() {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      redirect('/auth');
    }

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('topics')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle();

    const subscription = subscriptions as SubscriptionData;
    const topics =
      subscription?.topics && Array.isArray(subscription.topics)
        ? subscription.topics.filter((topic): topic is string => typeof topic === 'string')
        : [];

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

          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '0.45rem',
                letterSpacing: '0.03em',
              }}
            >
              Email
            </div>
            <div
              style={{
                fontSize: '16px',
                color: 'var(--text-primary)',
                letterSpacing: '0.01em',
              }}
            >
              {session.user.email || 'No email provided'}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '0.75rem',
                letterSpacing: '0.03em',
              }}
            >
              Subscription Topics
            </div>
            {topics.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                }}
              >
                {topics.map((topic) => (
                  <span
                    key={topic}
                    style={{
                      padding: '0.35rem 0.85rem',
                      background: 'rgba(56, 189, 248, 0.12)',
                      borderRadius: 999,
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                No subscription topics yet
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  } catch {
    redirect('/auth');
  }
}

