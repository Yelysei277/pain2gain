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
  borderRadius: '8px',
  padding: '10px 16px',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'background 0.2s',
};

export default function FeedClient({ ideas }: FeedClientProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicFilter>('all');

  const topics: TopicFilter[] = ['all', 'devtools', 'health', 'education', 'finance', 'business', 'other'];

  const filteredIdeas =
    selectedTopic === 'all'
      ? ideas
      : ideas.filter((idea) => idea.topic === selectedTopic);

  return (
    <div
      style={{
        background: '#F9FAFB',
        minHeight: '100vh',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#111827',
              margin: 0,
            }}
          >
            Generated Ideas
          </h1>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <form action="/api/generate" method="post">
              <button
                type="submit"
                style={buttonBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1F2937';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#111827';
                }}
              >
                Generate Ideas
              </button>
            </form>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as TopicFilter)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: '#fff',
                fontSize: '14px',
                color: '#111827',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {formatTopicLabel(topic)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredIdeas.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: '#6B7280',
              background: '#fff',
              borderRadius: '12px',
            }}
          >
            {ideas.length === 0 ? (
              <p style={{ margin: 0, fontSize: '14px' }}>
                No ideas yet. Click Generate Ideas and refresh the page.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '14px' }}>
                No ideas found for this topic.
              </p>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: '1fr',
            }}
          >
            {filteredIdeas.map((idea) => (
              <IdeaCard key={`${idea.title}-${idea.source.subreddit}`} idea={idea} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

