import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';
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

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, education, finance, or business.

Posts JSON:\n${JSON.stringify(posts.slice(0, maxPosts))}`; // cap payload size

  const result = await callLLM(prompt);
  const keepIds: string[] =
    Array.isArray((result as { keepIds?: unknown })?.keepIds)
      ? ((result as { keepIds: unknown[] }).keepIds.filter((v) => typeof v === 'string') as string[])
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

  const prompt = `You are categorizing product ideas from Reddit posts. Extract concrete product ideas and categorize them accurately.

CATEGORY DEFINITIONS:

1. "devtools" - Tools, frameworks, libraries, or software that developers use to build, test, deploy, or maintain code.
   Examples: Code editors, testing frameworks, deployment tools, API clients, database tools, version control, CI/CD, monitoring tools, debugging tools, development frameworks.
   Keywords: coding, development, programming, software tools, technical, APIs, frameworks, libraries, infrastructure.

2. "health" - Products focused on physical or mental wellbeing, fitness, wellness, productivity habits, personal development, or lifestyle optimization.
   Examples: Fitness apps, habit trackers, meditation apps, sleep trackers, nutrition planners, stress management, mental health, energy management, work-life balance, burnout prevention.
   Keywords: health, fitness, wellness, habits, routines, productivity, focus, mental health, physical, meditation, sleep, energy, burnout.

3. "education" - Products that teach, train, or help people learn skills, knowledge, or best practices. Includes guides, courses, tutorials, frameworks, templates, and learning platforms.
   Examples: Online courses, tutorials, guides, how-to resources, educational content, training platforms, knowledge bases, educational frameworks, templates, checklists.
   Keywords: learn, teach, guide, tutorial, course, training, framework, template, how-to, best practices, knowledge, education.

4. "finance" - Products focused on money management, financial planning, investment, budgeting, fundraising, pricing, or financial decision-making.
   Examples: Budgeting apps, financial calculators, investment tools, fundraising platforms, pricing calculators, financial planning tools, expense trackers, ROI calculators, bootstrapping vs fundraising tools, equity calculators.
   Keywords: finance, money, budget, pricing, investment, fundraising, bootstrapping, revenue, financial, cost, pricing strategy, equity, salary, CAC, payback.

5. "business" - Products focused on business operations, sales, marketing, customer management, growth, or business strategy (non-financial).
   Examples: CRM tools, marketing automation, sales tools, lead generation, business analytics, customer acquisition tools, growth platforms, marketing calculators, business strategy tools, sales playbooks.
   Keywords: business, sales, marketing, CRM, customer acquisition, growth, lead generation, business strategy, customer management, B2B, SaaS, conversion.

6. "other" - Products that don't fit the above categories, or are too vague/generic to categorize clearly.
   Examples: Generic tools, undefined products, vague concepts without clear category.

CATEGORIZATION RULES:
- If it's a tool developers use to write/manage code → "devtools"
- If it's about personal wellbeing, habits, or productivity optimization → "health"
- If it's about teaching/learning/sharing knowledge → "education"
- If it's about money, pricing, financial decisions, or financial planning → "finance"
- If it's about business operations, sales, marketing, or customer management → "business"
- When in doubt, prefer more specific categories over "other"

TASK:
From the following posts, extract concrete product ideas.
Return JSON with key "ideas" as an array of items with fields: title, elevatorPitch, painPoint, topic (one of devtools|health|education|finance|business|other), score (0-100), source { subreddit }.

Keep titles concise, elevatorPitch under 2 sentences. Score higher for actionable, focused concepts.
Be accurate with categorization - use the definitions above to assign the correct topic.

Posts JSON:\n${JSON.stringify(posts.slice(0, 30))}`; // cap size

  const result = await callLLM(prompt);
  const rawIdeas: unknown[] = Array.isArray((result as { ideas?: unknown })?.ideas)
    ? (result as { ideas: unknown[] }).ideas
    : [];

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
