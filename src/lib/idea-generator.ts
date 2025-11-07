import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';
import {
  buildFilterRelevantPostsPrompt,
  buildGenerateIdeasPrompt,
  type GenerateIdeasResultItem
} from '@/lib/llm-prompts';
import { applyIdeaFreshness } from './idea-freshness';
import { isSupabaseAvailable } from './supabase-client';
import { saveIdeasToDB, loadIdeasFromDB } from './db-ideas';

const IDEAS_FILE_RELATIVE_PATH = path.join('data', 'ideas.json');

const VALID_TOPICS: ProductIdea['topic'][] = ['devtools', 'health', 'education', 'finance', 'business', 'other'];

function isValidTopic(topic: unknown): topic is ProductIdea['topic'] {
  return typeof topic === 'string' && VALID_TOPICS.includes(topic as ProductIdea['topic']);
}

export async function filterRelevantPosts(posts: RedditPost[], maxPosts: number = 50): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  const { prompt, parse, model } = buildFilterRelevantPostsPrompt({ posts, maxPosts });
  const rawResult = await callLLM(prompt, { model });
  const parsed = parse(rawResult);
  const keepIds = Array.isArray(parsed?.keepIds) ? parsed.keepIds : [];

  if (keepIds.length === 0) {
    // Heuristic fallback: keep top N by upvotes
    return [...posts].sort((a, b) => b.upvotes - a.upvotes).slice(0, Math.min(15, posts.length));
  }

  const idSet = new Set(keepIds);
  return posts.filter((p) => idSet.has(p.id));
}

export async function generateIdeasFromPosts(posts: RedditPost[]): Promise<ProductIdea[]> {
  if (posts.length === 0) return [];

  const { prompt, parse, model } = buildGenerateIdeasPrompt({ posts });
  const rawResult = await callLLM(prompt, { model });
  const parsed = parse(rawResult);
  const rawIdeas: GenerateIdeasResultItem[] = parsed?.ideas ?? [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: { subreddit?: unknown; url?: unknown } };
    const normalizedTopic: ProductIdea['topic'] = isValidTopic(candidate?.topic) ? candidate.topic : 'other';
    const scoreNum = Number(candidate?.score);
    if (
      typeof candidate?.title === 'string' &&
      typeof candidate?.elevatorPitch === 'string' &&
      typeof candidate?.painPoint === 'string' &&
      Number.isFinite(scoreNum) &&
      candidate?.source && typeof candidate.source.subreddit === 'string'
    ) {
      ideas.push({
        title: candidate.title.trim(),
        elevatorPitch: candidate.elevatorPitch.trim(),
        painPoint: candidate.painPoint.trim(),
        topic: normalizedTopic,
        score: Math.max(0, Math.min(100, Math.round(scoreNum))),
        source: { subreddit: String(candidate.source.subreddit), url: candidate.source.url },
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Fallback: simple heuristic if LLM yields nothing
  if (ideas.length === 0) {
    return posts.slice(0, Math.min(10, posts.length)).map((p) => ({
      title: p.title,
      elevatorPitch: `A solution addressing: ${p.body.slice(0, 140)}...`,
      painPoint: p.body,
      topic: 'other',
      score: Math.max(10, Math.min(90, Math.round(p.upvotes / 10))),
      source: { subreddit: p.subreddit },
      createdAt: new Date().toISOString(),
    }));
  }

  return ideas;
}

async function saveIdeasToJSON(ideas: ProductIdea[]): Promise<void> {
  const filePath = path.join(process.cwd(), IDEAS_FILE_RELATIVE_PATH);
  const ideasForStorage = ideas.map(({ isNew, ...rest }) => rest);
  const serialized = JSON.stringify(ideasForStorage, null, 2);
  // Write atomically to reduce risk of partial writes
  const tmpPath = `${filePath}.tmp`;
  try {
    await fs.writeFile(tmpPath, serialized, 'utf-8');
    await fs.rename(tmpPath, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

export async function saveIdeas(ideas: ProductIdea[]): Promise<void> {
  if (isSupabaseAvailable()) {
    try {
      await saveIdeasToDB(ideas);
      return;
    } catch (error) {
      // Fallback to JSON file on database error
    }
  }

  try {
    await saveIdeasToJSON(ideas);
  } catch (error) {
    throw new Error(`Failed to save ideas: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function loadIdeasFromJSON(): Promise<ProductIdea[]> {
  const filePath = path.join(process.cwd(), IDEAS_FILE_RELATIVE_PATH);
  try {
    const buf = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(buf);
    if (!Array.isArray(parsed)) return [];
    // Lightweight validation
    const ideas: ProductIdea[] = [];
    for (const item of parsed) {
      const c = item as Partial<ProductIdea>;
      if (
        typeof c?.title === 'string' &&
        typeof c?.elevatorPitch === 'string' &&
        typeof c?.painPoint === 'string' &&
        isValidTopic(c?.topic) &&
        typeof c?.score === 'number' &&
        Number.isFinite(c.score) &&
        typeof c?.source?.subreddit === 'string'
      ) {
        const createdAtRaw = (c as { createdAt?: unknown }).createdAt;
        const createdAt = typeof createdAtRaw === 'string' ? createdAtRaw : undefined;
        ideas.push({
          title: c.title.trim(),
          elevatorPitch: c.elevatorPitch.trim(),
          painPoint: c.painPoint.trim(),
          topic: c.topic,
          score: Math.max(0, Math.min(100, Math.round(c.score))),
          source: { subreddit: c.source.subreddit, url: c.source.url },
          createdAt,
        });
      }
    }
    return ideas;
  } catch (error) {
    // Return empty array on any file read/parse error
    return [];
  }
}

export async function loadIdeas(): Promise<ProductIdea[]> {
  if (isSupabaseAvailable()) {
    try {
      const dbIdeas = await loadIdeasFromDB();
      if (dbIdeas.length > 0) {
        return applyIdeaFreshness(dbIdeas);
      }
    } catch {
      // Fallback to JSON file on error or empty result
    }
  }

  const jsonIdeas = await loadIdeasFromJSON();
  return applyIdeaFreshness(jsonIdeas);
}
