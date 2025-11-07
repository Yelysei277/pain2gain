import type { ProductIdea } from '@/types/ideas';
import type { RedditPost } from '@/types/reddit';

/**
 * Enum-like catalog of available LLM models. Extend when new providers/models are added.
 */
export const LLM_MODELS = {
  PRIMARY: 'gpt-4o-mini'
} as const;

export type LLMModel = (typeof LLM_MODELS)[keyof typeof LLM_MODELS];

/**
 * Generic shape describing how to execute an LLM prompt.
 * Attach a type-safe parser to ensure callers can rely on structured results.
 */
export interface LLMPromptConfig<TResponse> {
  readonly model: LLMModel;
  readonly prompt: string;
  readonly parse: (raw: unknown) => TResponse | null;
  readonly description: string;
}

export interface FilterRelevantPostsPromptInput {
  readonly posts: RedditPost[];
  readonly maxPosts?: number;
}

export interface FilterRelevantPostsResult {
  readonly keepIds: string[];
}

export interface GenerateIdeasPromptInput {
  readonly posts: RedditPost[];
  /**
   * Upper bound on posts serialized into the prompt to avoid prompt bloat.
   */
  readonly maxPosts?: number;
}

export interface GenerateIdeasResultItem {
  readonly title: string;
  readonly elevatorPitch: string;
  readonly painPoint: string;
  readonly topic: ProductIdea['topic'] | string;
  readonly score: number;
  readonly source: {
    readonly subreddit: string;
    readonly url?: string;
  };
}

export interface GenerateIdeasResult {
  readonly ideas: GenerateIdeasResultItem[];
}

/**
 * Construct a prompt asking the LLM to keep the most relevant Reddit posts.
 */
export function buildFilterRelevantPostsPrompt(
  input: FilterRelevantPostsPromptInput
): LLMPromptConfig<FilterRelevantPostsResult> {
  const { posts, maxPosts = 50 } = input;
  const serializedPosts = JSON.stringify(posts.slice(0, maxPosts));

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, education, finance, or business.

Posts JSON:\n${serializedPosts}`;

  return {
    model: LLM_MODELS.PRIMARY,
    prompt,
    parse: parseFilterRelevantPostsResult,
    description: 'Select Reddit posts that are high-signal for product ideation.'
  };
}

/**
 * Construct a prompt asking the LLM to generate categorized product ideas.
 */
export function buildGenerateIdeasPrompt(
  input: GenerateIdeasPromptInput
): LLMPromptConfig<GenerateIdeasResult> {
  const { posts, maxPosts = 30 } = input;
  const serializedPosts = JSON.stringify(posts.slice(0, maxPosts));

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

Posts JSON:\n${serializedPosts}`;

  return {
    model: LLM_MODELS.PRIMARY,
    prompt,
    parse: parseGenerateIdeasResult,
    description: 'Transform Reddit posts into categorized product ideas.'
  };
}

/**
 * Lightweight runtime validation for the filter response shape.
 */
function parseFilterRelevantPostsResult(raw: unknown): FilterRelevantPostsResult | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }

  const maybeKeepIds = (raw as { keepIds?: unknown }).keepIds;
  if (!Array.isArray(maybeKeepIds)) {
    return null;
  }

  const keepIds = maybeKeepIds.filter((value): value is string => typeof value === 'string');
  if (keepIds.length === 0) {
    return { keepIds: [] };
  }

  return { keepIds };
}

/**
 * Lightweight runtime validation for the idea generation response shape.
 */
function parseGenerateIdeasResult(raw: unknown): GenerateIdeasResult | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }

  const maybeIdeas = (raw as { ideas?: unknown }).ideas;
  if (!Array.isArray(maybeIdeas)) {
    return null;
  }

  const ideas: GenerateIdeasResultItem[] = [];
  for (const candidate of maybeIdeas) {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      continue;
    }

    const { title, elevatorPitch, painPoint, topic, score, source } = candidate as Record<string, unknown>;

    if (
      typeof title !== 'string' ||
      typeof elevatorPitch !== 'string' ||
      typeof painPoint !== 'string' ||
      typeof score !== 'number' ||
      Number.isNaN(score) ||
      typeof source !== 'object' ||
      source === null ||
      Array.isArray(source)
    ) {
      continue;
    }

    const subreddit = (source as { subreddit?: unknown }).subreddit;
    if (typeof subreddit !== 'string' || subreddit.trim().length === 0) {
      continue;
    }

    const urlValue = (source as { url?: unknown }).url;

    ideas.push({
      title,
      elevatorPitch,
      painPoint,
      topic: typeof topic === 'string' ? topic : 'other',
      score,
      source: {
        subreddit,
        ...(typeof urlValue === 'string' && urlValue.trim().length > 0 ? { url: urlValue } : {})
      }
    });
  }

  return { ideas };
}

/**
 * Helper for future prompt builders. Extend this module with additional factory
 * functions following the same signature (returning `LLMPromptConfig`). This
 * keeps prompt construction centralized and ensures consistent parsing logic.
 */
export function createPromptConfig<TResponse>(config: LLMPromptConfig<TResponse>): LLMPromptConfig<TResponse> {
  return config;
}

