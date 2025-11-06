import { NextResponse } from 'next/server';
import { loadRedditPosts } from '@/lib/reddit-source';
import { filterRelevantPosts, generateIdeasFromPosts, saveIdeas, loadIdeas } from '@/lib/idea-generator';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import { saveIdeasToDB, loadIdeasFromDB } from '@/lib/db-ideas';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  try {
    const allPosts = await loadRedditPosts();
    const relevant = await filterRelevantPosts(allPosts, 50);
    const newIdeas = await generateIdeasFromPosts(relevant);

    if (newIdeas.length === 0) {
      const totalCount = isSupabaseAvailable()
        ? (await loadIdeasFromDB()).length
        : (await loadIdeas()).length;
      return NextResponse.json({ generated: 0, total: totalCount }, { status: 200 });
    }

    if (isSupabaseAvailable()) {
      const insertedCount = await saveIdeasToDB(newIdeas);
      const totalCount = (await loadIdeasFromDB()).length;
      return NextResponse.json({ generated: insertedCount, total: totalCount }, { status: 200 });
    } else {
      // For JSON fallback: maintain existing behavior
      const existingIdeas = await loadIdeas();
      const existingTitles = new Set(existingIdeas.map((idea) => idea.title.toLowerCase().trim()));

      const uniqueNewIdeas = newIdeas.filter(
        (idea) => !existingTitles.has(idea.title.toLowerCase().trim())
      );

      const allIdeas = [...existingIdeas, ...uniqueNewIdeas];
      await saveIdeas(allIdeas);

      return NextResponse.json(
        { generated: uniqueNewIdeas.length, total: allIdeas.length },
        { status: 200 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate ideas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
