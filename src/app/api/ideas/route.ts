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
    const relevant = await filterRelevantPosts(allPosts, 5);
    const newIdeas = await generateIdeasFromPosts(relevant);
    
    // Load existing ideas and append new ones
    const existingIdeas = await loadIdeas();
    const existingTitles = new Set(existingIdeas.map((idea) => idea.title.toLowerCase().trim()));
    
    // Filter out duplicates based on title (case-insensitive)
    const uniqueNewIdeas = newIdeas.filter(
      (idea) => !existingTitles.has(idea.title.toLowerCase().trim())
    );
    
    const allIdeas = [...existingIdeas, ...uniqueNewIdeas];
    await saveIdeas(allIdeas);
    
    return NextResponse.json({ ideas: allIdeas, added: uniqueNewIdeas.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate ideas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
