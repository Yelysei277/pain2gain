import type { RedditPost } from '@/types/reddit';

async function fetchPosts(count: number): Promise<RedditPost[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/reddit?count=${count}`, {
    // Ensure fresh data on navigation; still cacheable at the edge per API route
    next: { revalidate: 300 }
  });
  if (!res.ok) {
    throw new Error('Failed to load posts');
  }
  const data = (await res.json()) as { posts: RedditPost[] };
  return data.posts;
}

export default async function FeedPage() {
  const posts = await fetchPosts(20);
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Feed</h1>
      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
        {posts.map((p) => (
          <li
            key={p.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              background: '#fff'
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{p.subreddit}</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>{p.body}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              <span>▲ {p.upvotes}</span>
              <span style={{ marginLeft: 12 }}>💬 {p.num_comments}</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
