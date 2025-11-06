import type { ProductIdea } from '@/types/ideas';
import { getSupabaseClient } from './supabase-client';

export async function upsertSource(subreddit: string, url?: string): Promise<number | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    // First, try to find existing source
    let query = supabase
      .from('sources')
      .select('id')
      .eq('subreddit', subreddit);

    if (url) {
      query = query.eq('url', url);
    } else {
      query = query.is('url', null);
    }

    const { data: existingSource, error: selectError } = await query.maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    const sourceData = existingSource as { id?: number } | null;
    if (sourceData?.id && typeof sourceData.id === 'number') {
      return sourceData.id;
    }

    // Source doesn't exist, insert it
    const { data: newSource, error: insertError } = await supabase
      .from('sources')
      .insert({ subreddit, url: url ?? null } as never)
      .select('id')
      .single();

    // Handle race condition: if insert fails due to unique constraint, retry select
    if (insertError) {
      // Check if it's a unique constraint violation (race condition)
      if (insertError.code === '23505' || insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
        // Another process inserted the same source, retry select
        const { data: retrySource } = await query.maybeSingle();
        const retryData = retrySource as { id?: number } | null;
        if (retryData?.id && typeof retryData.id === 'number') {
          return retryData.id;
        }
      }
      throw insertError;
    }

    const newSourceData = newSource as { id?: number } | null;
    if (!newSourceData?.id || typeof newSourceData.id !== 'number') {
      throw new Error('Failed to get source ID after insert');
    }

    return newSourceData.id;
  } catch (error) {
    throw new Error(`Failed to upsert source: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function checkIdeaExists(title: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const normalizedTitle = title.toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('id')
      .ilike('title', normalizedTitle)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    throw new Error(`Failed to check idea existence: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function insertIdea(idea: ProductIdea, sourceId: number | null): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const { error } = await supabase.from('ideas').insert({
      title: idea.title,
      elevator_pitch: idea.elevatorPitch,
      pain_point: idea.painPoint,
      topic: idea.topic,
      score: idea.score,
      source_id: sourceId,
    } as never);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to insert idea: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function saveIdeasToDB(ideas: ProductIdea[]): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (ideas.length === 0) {
    return 0;
  }

  try {
    const normalizedTitles = ideas.map((idea) => idea.title.toLowerCase().trim());
    const existingTitles = new Set<string>();

    const { data: existingIdeas } = await supabase
      .from('ideas')
      .select('title');

    if (existingIdeas) {
      const ideasArray = existingIdeas as Array<{ title?: string }>;
      for (const idea of ideasArray) {
        if (idea?.title && typeof idea.title === 'string') {
          existingTitles.add(idea.title.toLowerCase().trim());
        }
      }
    }

    const uniqueNewIdeas = ideas.filter(
      (idea, index) => !existingTitles.has(normalizedTitles[index])
    );

    if (uniqueNewIdeas.length === 0) {
      return 0;
    }

    const sourceMap = new Map<string, number | null>();

    for (const idea of uniqueNewIdeas) {
      const sourceKey = `${idea.source.subreddit}|${idea.source.url ?? ''}`;

      if (!sourceMap.has(sourceKey)) {
        try {
          const sourceId = await upsertSource(idea.source.subreddit, idea.source.url);
          sourceMap.set(sourceKey, sourceId);
        } catch (error) {
          sourceMap.set(sourceKey, null);
        }
      }
    }

    const inserts = uniqueNewIdeas.map((idea) => {
      const sourceKey = `${idea.source.subreddit}|${idea.source.url ?? ''}`;
      const sourceId = sourceMap.get(sourceKey) ?? null;

      return {
        title: idea.title,
        elevator_pitch: idea.elevatorPitch,
        pain_point: idea.painPoint,
        topic: idea.topic,
        score: idea.score,
        source_id: sourceId,
      };
    });

    const { error } = await supabase.from('ideas').insert(inserts as never[]);

    if (error) {
      throw error;
    }

    return uniqueNewIdeas.length;
  } catch (error) {
    throw new Error(`Failed to save ideas to database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseIdeaRow(row: unknown): ProductIdea | null {
  const rowData = row as {
    title?: unknown;
    elevator_pitch?: unknown;
    pain_point?: unknown;
    topic?: unknown;
    score?: unknown;
    sources?: unknown;
  };

  if (
    typeof rowData.title === 'string' &&
    typeof rowData.elevator_pitch === 'string' &&
    typeof rowData.pain_point === 'string' &&
    typeof rowData.topic === 'string' &&
    typeof rowData.score === 'number'
  ) {
    const topic = ['devtools', 'health', 'education', 'finance', 'business', 'other'].includes(rowData.topic)
      ? (rowData.topic as ProductIdea['topic'])
      : 'other';

    const sourceRow = rowData.sources;
    const source = Array.isArray(sourceRow) && sourceRow.length > 0 ? sourceRow[0] : sourceRow;
    const sourceObj = source && typeof source === 'object' ? (source as { subreddit?: string; url?: string | null }) : null;

    return {
      title: rowData.title.trim(),
      elevatorPitch: rowData.elevator_pitch.trim(),
      painPoint: rowData.pain_point.trim(),
      topic,
      score: Math.max(0, Math.min(100, Math.round(rowData.score))),
      source: {
        subreddit: sourceObj?.subreddit ?? 'unknown',
        url: sourceObj?.url ?? undefined,
      },
    };
  }

  return null;
}

export async function loadIdeasFromDB(): Promise<ProductIdea[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        elevator_pitch,
        pain_point,
        topic,
        score,
        created_at,
        sources (
          id,
          subreddit,
          url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    const ideas: ProductIdea[] = [];

    for (const row of data) {
      const idea = parseIdeaRow(row);
      if (idea) {
        ideas.push(idea);
      }
    }

    return ideas;
  } catch (error) {
    throw new Error(`Failed to load ideas from database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function loadIdeasFromLast24Hours(): Promise<ProductIdea[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const isoString = twentyFourHoursAgo.toISOString();

    const { data, error } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        elevator_pitch,
        pain_point,
        topic,
        score,
        created_at,
        sources (
          id,
          subreddit,
          url
        )
      `)
      .gte('created_at', isoString)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    const ideas: ProductIdea[] = [];

    for (const row of data) {
      const idea = parseIdeaRow(row);
      if (idea) {
        ideas.push(idea);
      }
    }

    return ideas;
  } catch (error) {
    throw new Error(`Failed to load ideas from last 24 hours: ${error instanceof Error ? error.message : String(error)}`);
  }
}