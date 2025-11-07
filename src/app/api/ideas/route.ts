import { NextResponse } from 'next/server';
import { loadIdeasFromDB } from '@/lib/db-ideas';
import { applyIdeaFreshness } from '@/lib/idea-freshness';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import { loadIdeas } from '@/lib/idea-generator';
import { createServerComponentClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const supabaseReady = isSupabaseAvailable();

  if (supabaseReady) {
    try {
      const supabase = await createServerComponentClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (supabaseReady) {
    try {
      const ideasFromDb = await loadIdeasFromDB();
      if (ideasFromDb.length > 0) {
        return NextResponse.json({ ideas: applyIdeaFreshness(ideasFromDb) });
      }
    } catch {
      // Fall back to JSON-backed loader below
    }
  }

  try {
    const fallbackIdeas = await loadIdeas();
    return NextResponse.json({ ideas: fallbackIdeas });
  } catch {
    return NextResponse.json({ ideas: [] }, { status: 200 });
  }
}
