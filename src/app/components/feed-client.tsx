'use client';

import { useState } from 'react';
import type React from 'react';
import type { ProductIdea } from '@/types/ideas';
import IdeaCard from './idea-card';

interface FeedClientProps {
  ideas: ProductIdea[];
}

type TopicFilter = 'all' | ProductIdea['topic'];

function formatTopicLabel(topic: string): string {
  return topic === 'all' ? 'All Topics' : topic.charAt(0).toUpperCase() + topic.slice(1);
}

const buttonBaseStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '10px',
  padding: '12px 20px',
  background: 'linear-gradient(135deg, rgba(56, 211, 145, 0.92), rgba(56, 189, 248, 0.92))',
  boxShadow: '0 12px 30px rgba(56, 211, 145, 0.25)',
  color: '#020617',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const selectArrowDataUrl =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M10.59.59a1,1,0,0,1,0,1.41L6.7,5.9a1,1,0,0,1-1.41,0L1.41,2A1,1,0,0,1,2.83.59L6,3.76,9.17.59A1,1,0,0,1,10.59.59Z' fill='%23E2E8F0'/></svg>";

const selectStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-card)',
  fontSize: '14px',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontWeight: 500,
  minWidth: '180px',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `linear-gradient(135deg, rgba(148, 163, 184, 0.35) 0%, rgba(59, 130, 246, 0.35) 100%), url(${selectArrowDataUrl})`,
  backgroundOrigin: 'border-box',
  backgroundRepeat: 'no-repeat, no-repeat',
  backgroundPosition: 'center, calc(100% - 16px) center',
  backgroundSize: '100% 100%, 12px 8px',
  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.45) inset',
  paddingRight: '42px',
};

const emptyStateStyle: React.CSSProperties = {
  padding: '48px 32px',
  textAlign: 'center',
  color: 'var(--text-muted)',
  background: 'var(--bg-card)',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)',
  boxShadow: 'var(--shadow-soft)',
};

export default function FeedClient({ ideas }: FeedClientProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicFilter>('all');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [didGenerateError, setDidGenerateError] = useState(false);
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  const [digestMessage, setDigestMessage] = useState<string | null>(null);
  const [didDigestError, setDidDigestError] = useState(false);

  async function handleGenerateIdeas() {
    if (isGeneratingIdeas) {
      return;
    }

    setIsGeneratingIdeas(true);
    setGenerateMessage(null);
    setDidGenerateError(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ideas');
      }

      const message =
        data.generated > 0
          ? `Generated ${data.generated} new ${data.generated === 1 ? 'idea' : 'ideas'}!`
          : 'No new ideas generated.';

      setGenerateMessage(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate ideas';
      setDidGenerateError(true);
      setGenerateMessage(message);
    } finally {
      setIsGeneratingIdeas(false);
    }
  }

  async function handleSendDigest() {
    if (isSendingDigest) {
      return;
    }

    setIsSendingDigest(true);
    setDigestMessage(null);
    setDidDigestError(false);

    try {
      const response = await fetch('/api/notifications/send-digest', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send digest email');
      }

      const message =
        data.message ||
        (data.sent > 0
          ? `Sent ${data.sent} digest ${data.sent === 1 ? 'email' : 'emails'}.`
          : 'Digest request completed.');

      setDigestMessage(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send digest email';
      setDidDigestError(true);
      setDigestMessage(message);
    } finally {
      setIsSendingDigest(false);
    }
  }

  const topics: TopicFilter[] = ['all', 'devtools', 'health', 'education', 'finance', 'business', 'other'];

  const filteredIdeas =
    selectedTopic === 'all'
      ? ideas
      : ideas.filter((idea) => idea.topic === selectedTopic);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '16px',
        }}
      >
        <h1
          style={{
            fontSize: '30px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Generated Ideas
        </h1>

        <div
          style={{
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            rowGap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
            <button
              type="button"
              style={{
                ...buttonBaseStyle,
                cursor: isGeneratingIdeas ? 'not-allowed' : buttonBaseStyle.cursor,
                opacity: isGeneratingIdeas ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (isGeneratingIdeas) return;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 18px 38px rgba(56, 211, 145, 0.32)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(56, 211, 145, 0.25)';
              }}
              disabled={isGeneratingIdeas}
              onClick={handleGenerateIdeas}
            >
              {isGeneratingIdeas ? 'Generating…' : 'Generate Ideas'}
            </button>
            {generateMessage ? (
              <span
                style={{
                  fontSize: '13px',
                  color: didGenerateError ? '#dc2626' : '#047857',
                }}
                aria-live="polite"
              >
                {generateMessage}
              </span>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
            <button
              type="button"
              style={{
                ...buttonBaseStyle,
                cursor: isSendingDigest ? 'not-allowed' : buttonBaseStyle.cursor,
                opacity: isSendingDigest ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (isSendingDigest) return;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 18px 38px rgba(56, 211, 145, 0.32)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(56, 211, 145, 0.25)';
              }}
              disabled={isSendingDigest}
              onClick={handleSendDigest}
            >
              {isSendingDigest ? 'Sending…' : 'Send Digest Email'}
            </button>
            {digestMessage ? (
              <span
                style={{
                  fontSize: '13px',
                  color: didDigestError ? '#dc2626' : '#047857',
                }}
                aria-live="polite"
              >
                {digestMessage}
              </span>
            ) : null}
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as TopicFilter)}
              style={selectStyle}
            >
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {formatTopicLabel(topic)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredIdeas.length === 0 ? (
        <div style={emptyStateStyle}>
          {ideas.length === 0 ? (
            <p style={{ margin: 0, fontSize: '15px', letterSpacing: '0.01em' }}>
              No ideas yet. Click Generate Ideas and refresh the page.
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '15px', letterSpacing: '0.01em' }}>
              No ideas found for this topic.
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'stretch',
          }}
        >
          {filteredIdeas.map((idea) => (
            <IdeaCard key={`${idea.title}-${idea.source.subreddit}`} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}

