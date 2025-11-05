import { loadIdeas } from '@/lib/idea-generator';

export const revalidate = 60;

export default async function IdeasPage() {
  const ideas = await loadIdeas();
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Generated Ideas</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <form action="/api/ideas" method="post">
          <button
            type="submit"
            style={{
              border: '1px solid #111827',
              borderRadius: 8,
              padding: '8px 12px',
              background: '#111827',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Generate Ideas
          </button>
        </form>
      </div>
      {ideas.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No ideas yet. Click Generate Ideas.</p>
      ) : (
        <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
          {ideas.map((idea, idx) => (
            <li
              key={`${idea.title}-${idx}`}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Topic: {idea.topic} · Score: {idea.score} · r/{idea.source.subreddit}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{idea.title}</div>
              <div style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>{idea.elevatorPitch}</div>
              <details>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: '#2563eb' }}>Pain Point</summary>
                <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>{idea.painPoint}</div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


