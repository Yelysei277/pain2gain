import { NextResponse } from 'next/server';
import { loadRedditPosts } from '@/lib/reddit-source';
import { filterRelevantPosts, generateIdeasFromPosts, saveIdeas, loadIdeas } from '@/lib/idea-generator';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const ideas = await loadIdeas();
    return NextResponse.json({ ideas });
  } catch {
    return NextResponse.json({ ideas: [] }, { status: 200 });
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    const allPosts = await loadRedditPosts();
    const relevant = await filterRelevantPosts(allPosts);
    const ideas = await generateIdeasFromPosts(relevant);
    await saveIdeas(ideas);
    return NextResponse.json({ ideas });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate ideas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


