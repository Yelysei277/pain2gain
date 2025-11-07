'use client';

import { Fragment, useMemo } from 'react';
import { useSubscription } from '@/hooks/use-subscription';

type ProfileSubscriptionFormProps = {
  initialEmail: string | null | undefined;
};

export default function ProfileSubscriptionForm({ initialEmail }: ProfileSubscriptionFormProps) {
  const subscription = useSubscription(initialEmail);

  const {
    email,
    setEmail,
    topicOptions,
    topics,
    toggleTopic,
    isActive,
    hasSubscription,
    loading,
    saving,
    unsubscribing,
    saveSubscription,
    unsubscribe,
    success,
    error,
    missingConfig,
    hasFetchedOnce,
    isValidEmail,
  } = subscription;

  const disabled = useMemo(() => loading || saving || unsubscribing, [loading, saving, unsubscribing]);
  const canSubmit = useMemo(() => {
    return isValidEmail(email) && topics.length > 0 && !disabled;
  }, [disabled, email, isValidEmail, topics.length]);

  const showUnsubscribe = isActive && hasSubscription;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {!hasFetchedOnce ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            borderRadius: 12,
            background: 'rgba(148, 163, 184, 0.12)',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}
        >
          Loading subscription details...
        </div>
      ) : null}

      {missingConfig ? (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(14, 165, 233, 0.35)',
            background: 'rgba(14, 165, 233, 0.12)',
            color: 'var(--text-primary)',
            padding: '1rem 1.25rem',
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          Supabase credentials are missing. Please set `NEXT_PUBLIC_SUPABASE_URL` and
          `NEXT_PUBLIC_SUPABASE_ANON_KEY` to manage subscriptions.
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(248, 113, 113, 0.35)',
            background: 'rgba(248, 113, 113, 0.12)',
            color: 'rgba(220, 38, 38, 0.92)',
            padding: '1rem 1.25rem',
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(34, 197, 94, 0.35)',
            background: 'rgba(34, 197, 94, 0.12)',
            color: 'rgba(21, 128, 61, 0.92)',
            padding: '1rem 1.25rem',
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          {success}
        </div>
      ) : null}

      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            letterSpacing: '0.03em',
          }}
        >
          Subscription email
        </span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={disabled}
          placeholder="name@example.com"
          type="email"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.04)',
            color: 'var(--text-primary)',
            fontSize: '15px',
            letterSpacing: '0.01em',
            outline: 'none',
          }}
        />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            letterSpacing: '0.03em',
          }}
        >
          Topics you care about
        </span>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {topicOptions.map((topic) => {
            const selected = topics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                disabled={disabled}
                style={{
                  padding: '0.65rem 1.1rem',
                  borderRadius: 999,
                  border: selected
                    ? '1px solid rgba(56, 189, 248, 0.6)'
                    : '1px solid rgba(148, 163, 184, 0.35)',
                  background: selected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <button
          type="button"
          onClick={saveSubscription}
          disabled={!canSubmit}
          style={{
            padding: '0.9rem 1.75rem',
            borderRadius: 999,
            border: 'none',
            background: canSubmit
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(56, 189, 248, 0.88))'
              : 'rgba(148, 163, 184, 0.2)',
            color: canSubmit ? '#e0f2fe' : 'rgba(148, 163, 184, 0.9)',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.03em',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit ? '0 18px 32px rgba(37, 99, 235, 0.35)' : 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
          }}
        >
          {saving ? 'Saving...' : hasSubscription ? 'Update subscription' : 'Save subscription'}
        </button>

        {showUnsubscribe ? (
          <button
            type="button"
            onClick={unsubscribe}
            disabled={disabled}
            style={{
              padding: '0.9rem 1.75rem',
              borderRadius: 999,
              border: '1px solid rgba(248, 113, 113, 0.4)',
              background: disabled ? 'rgba(248, 113, 113, 0.12)' : 'rgba(248, 113, 113, 0.18)',
              color: disabled ? 'rgba(248, 113, 113, 0.55)' : 'rgba(248, 113, 113, 0.92)',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
          >
            {unsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
          </button>
        ) : null}
      </div>

      {isActive ? (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          Stay updated with weekly digests on the topics you select.
        </p>
      ) : (
        <Fragment>
          {hasSubscription ? (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}
            >
              You&apos;re currently unsubscribed. Choose topics and save to resume receiving updates.
            </p>
          ) : (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}
            >
              Pick a few topics and we&apos;ll send you curated insights to your inbox.
            </p>
          )}
        </Fragment>
      )}
    </div>
  );
}


