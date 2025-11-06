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
          maxWidth: 800,
          margin: '2rem auto',
          padding: '0 1rem',
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '2rem',
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
            Profile
          </h1>

          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '0.25rem',
              }}
            >
              Email
            </div>
            <div
              style={{
                fontSize: '16px',
                color: '#111827',
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
                color: '#6b7280',
                marginBottom: '0.5rem',
              }}
            >
              Subscription Topics
            </div>
            {topics.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                {topics.map((topic) => (
                  <span
                    key={topic}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: '#f3f4f6',
                      borderRadius: 16,
                      fontSize: '14px',
                      color: '#111827',
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
                  color: '#6b7280',
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

