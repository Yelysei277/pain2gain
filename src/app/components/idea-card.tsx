'use client';

import type { ProductIdea } from '@/types/ideas';

interface IdeaCardProps {
  idea: ProductIdea;
}

const topicColors: Record<ProductIdea['topic'], string> = {
  devtools: '#38bdf8',
  health: '#38d391',
  education: '#a855f7',
  finance: '#fbbf24',
  business: '#f97316',
  other: '#94a3b8',
};

export default function IdeaCard({ idea }: IdeaCardProps) {
  const topicColor = topicColors[idea.topic] || topicColors.other;
  const showNewBadge = idea.isNew === true;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 18,
        padding: '24px',
        boxShadow: 'var(--shadow-soft)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
        e.currentTarget.style.boxShadow = '0 24px 48px rgba(8, 47, 73, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {showNewBadge ? (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              background: 'rgba(56, 211, 145, 0.18)',
              padding: '6px 12px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              boxShadow: '0 4px 12px rgba(56, 211, 145, 0.25)',
            }}
          >
            NEW
          </span>
        ) : null}
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#020617',
            background: topicColor,
            padding: '6px 12px',
            borderRadius: '999px',
            textTransform: 'capitalize',
            letterSpacing: '0.05em',
          }}
        >
          {idea.topic}
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            letterSpacing: '0.04em',
          }}
        >
          Score: {idea.score}
        </span>
        {idea.source.url ? (
          <a
            href={idea.source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: 'var(--accent-blue)',
              textDecoration: 'none',
              letterSpacing: '0.03em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: 0.9,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
          >
            <span>r/{idea.source.subreddit}</span>
            <span aria-hidden>→</span>
          </a>
        ) : (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            {idea.source.subreddit}
          </span>
        )}
      </div>

      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: '1.45',
          letterSpacing: '-0.005em',
        }}
      >
        {idea.title}
      </h2>

      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: '1.7',
          letterSpacing: '0.01em',
        }}
      >
        {idea.elevatorPitch}
      </p>

      <div
        style={{
          padding: '18px',
          background: 'rgba(239, 68, 68, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(248, 113, 113, 0.9)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Pain Point
        </div>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: '1.7',
            letterSpacing: '0.01em',
          }}
        >
          {idea.painPoint}
        </p>
      </div>
    </div>
  );
}

