import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

const IDEAS_FILE_RELATIVE_PATH = path.join('data', 'ideas.json');

export async function filterRelevantPosts(posts: RedditPost[]): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, or education.

Posts JSON:\n${JSON.stringify(posts.slice(0, 50))}`; // cap payload size

  const result = await callLLM(prompt);
  const keepIds: string[] = Array.isArray((result as any)?.keepIds)
    ? ((result as any).keepIds as unknown[]).filter((v) => typeof v === 'string') as string[]
    : [];

  if (keepIds.length === 0) {
    // Heuristic fallback: keep top N by upvotes
    return [...posts].sort((a, b) => b.upvotes - a.upvotes).slice(0, Math.min(15, posts.length));
  }

  const idSet = new Set(keepIds);
  return posts.filter((p) => idSet.has(p.id));
}

export async function generateIdeasFromPosts(posts: RedditPost[]): Promise<ProductIdea[]> {
  if (posts.length === 0) return [];

  const prompt = `From the following posts, extract concrete product ideas.
Return JSON with key "ideas" as an array of items with fields: title, elevatorPitch, painPoint, topic (one of devtools|health|education|other), score (0-100), source { subreddit }.
Keep titles concise, elevatorPitch under 2 sentences. Score higher for actionable, focused concepts.

Posts JSON:\n${JSON.stringify(posts.slice(0, 30))}`; // cap size

  const result = await callLLM(prompt);
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const topic = candidate?.topic as ProductIdea['topic'];
    const normalizedTopic: ProductIdea['topic'] =
      topic === 'devtools' || topic === 'health' || topic === 'education' ? topic : 'other';
    const scoreNum = Number((candidate as any)?.score);
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
        source: { subreddit: String(candidate.source.subreddit), url: candidate.source.url }
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
      source: { subreddit: p.subreddit }
    }));
  }

  return ideas;
}

export async function saveIdeas(ideas: ProductIdea[]): Promise<void> {
  const filePath = path.join(process.cwd(), IDEAS_FILE_RELATIVE_PATH);
  const serialized = JSON.stringify(ideas, null, 2);
  // Write atomically to reduce risk of partial writes
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, serialized, 'utf-8');
  await fs.rename(tmpPath, filePath);
}

export async function loadIdeas(): Promise<ProductIdea[]> {
  const filePath = path.join(process.cwd(), IDEAS_FILE_RELATIVE_PATH);
  try {
    const buf = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(buf);
    if (!Array.isArray(parsed)) return [];
    // lightweight validation
    const ideas: ProductIdea[] = [];
    for (const item of parsed) {
      const c = item as Partial<ProductIdea>;
      if (
        typeof c?.title === 'string' &&
        typeof c?.elevatorPitch === 'string' &&
        typeof c?.painPoint === 'string' &&
        (c?.topic === 'devtools' || c?.topic === 'health' || c?.topic === 'education' || c?.topic === 'other') &&
        typeof c?.score === 'number' &&
        typeof c?.source?.subreddit === 'string'
      ) {
        ideas.push(c as ProductIdea);
      }
    }
    return ideas;
  } catch {
    return [];
  }
}


