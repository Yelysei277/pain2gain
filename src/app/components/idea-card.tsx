import type { ProductIdea } from '@/types/ideas';

interface IdeaCardProps {
  idea: ProductIdea;
}

const topicColors: Record<ProductIdea['topic'], string> = {
  devtools: '#3B82F6',
  health: '#10B981',
  education: '#8B5CF6',
  finance: '#F59E0B',
  business: '#EF4444',
  other: '#6B7280',
};

export default function IdeaCard({ idea }: IdeaCardProps) {
  const topicColor = topicColors[idea.topic] || topicColors.other;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '20px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
            background: topicColor,
            padding: '4px 10px',
            borderRadius: '6px',
            textTransform: 'capitalize',
          }}
        >
          {idea.topic}
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#22C55E',
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
              color: '#3B82F6',
              textDecoration: 'none',
            }}
          >
            r/{idea.source.subreddit} →
          </a>
        ) : (
          <span
            style={{
              fontSize: '12px',
              color: '#6B7280',
            }}
          >
            r/{idea.source.subreddit}
          </span>
        )}
      </div>

      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#111827',
          margin: 0,
          lineHeight: '1.4',
        }}
      >
        {idea.title}
      </h2>

      <p
        style={{
          fontSize: '14px',
          color: '#374151',
          margin: 0,
          lineHeight: '1.6',
        }}
      >
        {idea.elevatorPitch}
      </p>

      <div
        style={{
          padding: '12px',
          background: '#FEF2F2',
          borderRadius: '8px',
          borderLeft: '3px solid #EF4444',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#EF4444',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Pain Point
        </div>
        <p
          style={{
            fontSize: '13px',
            color: '#374151',
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          {idea.painPoint}
        </p>
      </div>
    </div>
  );
}

