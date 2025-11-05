import { NextResponse } from 'next/server';
import { loadRedditPosts, pickRandomPosts } from '@/lib/reddit-source';

export const dynamic = 'force-static';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const countParam = url.searchParams.get('count');
  const count = countParam ? Math.max(1, Math.min(100, Number(countParam))) : 20;

  const allPosts = await loadRedditPosts();
  const posts = pickRandomPosts(allPosts, count);

  return NextResponse.json(
    { posts },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}


