# Improve categorization logic for ideas
_Exported on 07/11/2025 at 15:12:18 CET from Cursor (1.7.46)_

---

**User**

I generated a bunch of ideas and I see only other and devtools topic. let's make a better categorization logic

---

**Cursor**

Examining the current categorization logic and the generated ideas.


The categorization prompt is too vague. Improving it with clear category definitions and examples to guide the LLM.


Improving categorization with clear category definitions, examples, and a structured prompt:


```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

const IDEAS_FILE_RELATIVE_PATH = path.join('data', 'ideas.json');

export async function filterRelevantPosts(posts: RedditPost[], maxPosts: number = 50): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, or education.

Posts JSON:\n${JSON.stringify(posts.slice(0, maxPosts))}`; // cap payload size

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

  const prompt = `You are categorizing product ideas from Reddit posts. Extract concrete product ideas and categorize them accurately.

CATEGORY DEFINITIONS:

1. "devtools" - Tools, frameworks, libraries, or software that developers use to build, test, deploy, or maintain code.
   Examples: Code editors, testing frameworks, deployment tools, API clients, database tools, version control, CI/CD, monitoring tools, debugging tools, development frameworks.
   Keywords: coding, development, programming, software tools, technical, APIs, frameworks, libraries, infrastructure.

2. "health" - Products focused on physical or mental wellbeing, fitness, wellness, productivity habits, personal development, or lifestyle optimization.
   Examples: Fitness apps, habit trackers, meditation apps, sleep trackers, nutrition planners, stress management, mental health, energy management, work-life balance, burnout prevention.
   Keywords: health, fitness, wellness, habits, routines, productivity, focus, mental health, physical, meditation, sleep, energy, burnout.

3. "education" - Products that teach, train, or help people learn skills, knowledge, or best practices. Includes guides, courses, tutorials, frameworks, templates, and learning platforms.
   Examples: Online courses, tutorials, guides, how-to resources, educational content, training platforms, knowledge bases, frameworks for business/marketing, templates, checklists.
   Keywords: learn, teach, guide, tutorial, course, training, framework, template, how-to, best practices, knowledge, education.

4. "other" - Products that don't fit the above categories, or are too vague/generic to categorize clearly.
   Examples: Generic business tools, undefined products, vague concepts without clear category.

CATEGORIZATION RULES:
- If it's a tool developers use to write/manage code → "devtools"
- If it's about personal wellbeing, habits, or productivity optimization → "health"
- If it's about teaching/learning/sharing knowledge → "education"
- When in doubt, prefer "education" over "other" if it involves learning
- Business tools without clear category → "other"

TASK:
From the following posts, extract concrete product ideas.
Return JSON with key "ideas" as an array of items with fields: title, elevatorPitch, painPoint, topic (one of devtools|health|education|other), score (0-100), source { subreddit }.

Keep titles concise, elevatorPitch under 2 sentences. Score higher for actionable, focused concepts.
Be accurate with categorization - use the definitions above to assign the correct topic.

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



```

Checking for lint errors:


Updated the categorization logic with clearer definitions and examples.

**What changed:**

1. **Category definitions** with examples and keywords:
   - **devtools**: Development tools, frameworks, and technical software
   - **health**: Wellness, fitness, habits, productivity, and personal development
   - **education**: Learning resources, guides, tutorials, frameworks, and knowledge products
   - **other**: Generic or unclear products

2. **Categorization rules** to help the LLM make better decisions

3. **Guidance** to prefer "education" over "other" when learning is involved

The prompt now guides the LLM to categorize ideas like:
- Habit trackers → **health**
- Guides and tutorials → **education**
- Business frameworks → **education**
- Development tools → **devtools**

To see the improved categorization, regenerate ideas using your API endpoint. The LLM should now assign topics more accurately based on the definitions and examples.

---

**User**

Do we need more major topics? Maybe finance, etc

---

**Cursor**

Checking the current data to see if we need additional topics:


Adding finance and business categories. Updating the types and categorization logic:


```typescript
export interface ProductIdea {
  title: string;
  elevatorPitch: string;
  painPoint: string;
  topic: 'devtools' | 'health' | 'education' | 'finance' | 'business' | 'other';
  score: number;
  source: { subreddit: string; url?: string };
}



```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

const IDEAS_FILE_RELATIVE_PATH = path.join('data', 'ideas.json');

export async function filterRelevantPosts(posts: RedditPost[], maxPosts: number = 50): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, or education.

Posts JSON:\n${JSON.stringify(posts.slice(0, maxPosts))}`; // cap payload size

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
Return JSON with key "ideas" as an array of items with fields: title, elevatorPitch, painPoint, topic (one of devtools|health|education|other), score (0-100), source { subreddit }.

Keep titles concise, elevatorPitch under 2 sentences. Score higher for actionable, focused concepts.
Be accurate with categorization - use the definitions above to assign the correct topic.

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



```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

const IDEAS_FILE_RELATIVE_PATH = path.join('data', 'ideas.json');

export async function filterRelevantPosts(posts: RedditPost[], maxPosts: number = 50): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, or education.

Posts JSON:\n${JSON.stringify(posts.slice(0, maxPosts))}`; // cap payload size

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
Return JSON with key "ideas" as an array of items with fields: title, elevatorPitch, painPoint, topic (one of devtools|health|education|other), score (0-100), source { subreddit }.

Keep titles concise, elevatorPitch under 2 sentences. Score higher for actionable, focused concepts.
Be accurate with categorization - use the definitions above to assign the correct topic.

Posts JSON:\n${JSON.stringify(posts.slice(0, 30))}`; // cap size

  const result = await callLLM(prompt);
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const topic = candidate?.topic as ProductIdea['topic'];
    const validTopics: ProductIdea['topic'][] = ['devtools', 'health', 'education', 'finance', 'business', 'other'];
    const normalizedTopic: ProductIdea['topic'] =
      validTopics.includes(topic) ? topic : 'other';
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



```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

const IDEAS_FILE_RELATIVE_PATH = path.join('data', 'ideas.json');

export async function filterRelevantPosts(posts: RedditPost[], maxPosts: number = 50): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, or education.

Posts JSON:\n${JSON.stringify(posts.slice(0, maxPosts))}`; // cap payload size

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
Return JSON with key "ideas" as an array of items with fields: title, elevatorPitch, painPoint, topic (one of devtools|health|education|other), score (0-100), source { subreddit }.

Keep titles concise, elevatorPitch under 2 sentences. Score higher for actionable, focused concepts.
Be accurate with categorization - use the definitions above to assign the correct topic.

Posts JSON:\n${JSON.stringify(posts.slice(0, 30))}`; // cap size

  const result = await callLLM(prompt);
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const topic = candidate?.topic as ProductIdea['topic'];
    const validTopics: ProductIdea['topic'][] = ['devtools', 'health', 'education', 'finance', 'business', 'other'];
    const normalizedTopic: ProductIdea['topic'] =
      validTopics.includes(topic) ? topic : 'other';
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
        (c?.topic === 'devtools' || c?.topic === 'health' || c?.topic === 'education' || c?.topic === 'finance' || c?.topic === 'business' || c?.topic === 'other') &&
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



```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

const IDEAS_FILE_RELATIVE_PATH = path.join('data', 'ideas.json');

export async function filterRelevantPosts(posts: RedditPost[], maxPosts: number = 50): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, or education.

Posts JSON:\n${JSON.stringify(posts.slice(0, maxPosts))}`; // cap payload size

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const topic = candidate?.topic as ProductIdea['topic'];
    const validTopics: ProductIdea['topic'][] = ['devtools', 'health', 'education', 'finance', 'business', 'other'];
    const normalizedTopic: ProductIdea['topic'] =
      validTopics.includes(topic) ? topic : 'other';
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
        (c?.topic === 'devtools' || c?.topic === 'health' || c?.topic === 'education' || c?.topic === 'finance' || c?.topic === 'business' || c?.topic === 'other') &&
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



```

Checking for lint errors and other places where topic types are used:


Updating the filter prompt and checking the feed page for topic filters:


```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

const IDEAS_FILE_RELATIVE_PATH = path.join('data', 'ideas.json');

export async function filterRelevantPosts(posts: RedditPost[], maxPosts: number = 50): Promise<RedditPost[]> {
  if (posts.length === 0) return [];

  const prompt = `You will receive a list of Reddit posts as JSON array.
Return a JSON object with a single key "keepIds" containing an array of post ids to keep.
Focus on high-signal pain points that could inspire products in devtools, health, education, finance, or business.

Posts JSON:\n${JSON.stringify(posts.slice(0, maxPosts))}`; // cap payload size

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const topic = candidate?.topic as ProductIdea['topic'];
    const validTopics: ProductIdea['topic'][] = ['devtools', 'health', 'education', 'finance', 'business', 'other'];
    const normalizedTopic: ProductIdea['topic'] =
      validTopics.includes(topic) ? topic : 'other';
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
        (c?.topic === 'devtools' || c?.topic === 'health' || c?.topic === 'education' || c?.topic === 'finance' || c?.topic === 'business' || c?.topic === 'other') &&
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



```

Checking the ideas page for topic filters:


Added two new topic categories: **finance** and **business**.

**Changes made:**

1. **Updated `ProductIdea` type** — Added `'finance'` and `'business'` to the topic union type.

2. **Enhanced categorization logic** with definitions:
   - **finance**: Budgeting, financial planning, investment, fundraising, pricing calculators, equity tools, etc.
   - **business**: CRM, sales tools, marketing automation, lead generation, business analytics, growth platforms, etc.

3. **Updated validation** — Code now accepts and validates the new topics.

4. **Updated filtering prompt** — The initial filter now mentions finance and business.

**Examples of what will now be categorized correctly:**

- "Bootstrapping Vs. Fundraising Calculator" → **finance**
- "Growth Assessment Platform" → **finance** or **business**
- "B2B SaaS Marketing Mix Calculator" → **business**
- "User Acquisition Toolkit" → **business** or **education**

The categorization now has 6 topics: `devtools`, `health`, `education`, `finance`, `business`, and `other`. When you regenerate ideas, the LLM should categorize them more accurately using these definitions.

---

**User**

/poly-sm 

--- Cursor Command: poly-sm.md ---
Perform a complete, self-contained polish pass on all generated code to ensure it is **fully correct, consistent, and production-ready**.

### Objectives:

- Verify and complete all required logic, handlers, and integrations based on the task and context.
- Fix syntax, imports, typing, and async logic issues.
- Remove unused or temporary code, logs, and placeholders.
- Ensure consistent structure, naming, formatting, and error handling.
- Validate architecture alignment and adjust file/function placement if necessary.
- Refactor or simplify where appropriate **without changing functionality**.

Apply all corrections and improvements directly — output **only the finalized, clean code**.
--- End Command ---

---

**Cursor**

Reviewing all relevant files for a polish pass. Checking the codebase for consistency, correctness, and production readiness.


Checking for other files that might need updates:


Polishing the code for production readiness: extracting constants, improving error handling, removing trailing whitespace, and ensuring consistency.


```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const topic = candidate?.topic as ProductIdea['topic'];
    const validTopics: ProductIdea['topic'][] = ['devtools', 'health', 'education', 'finance', 'business', 'other'];
    const normalizedTopic: ProductIdea['topic'] =
      validTopics.includes(topic) ? topic : 'other';
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
        (c?.topic === 'devtools' || c?.topic === 'health' || c?.topic === 'education' || c?.topic === 'finance' || c?.topic === 'business' || c?.topic === 'other') &&
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



```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const normalizedTopic: ProductIdea['topic'] = isValidTopic(candidate?.topic) ? candidate.topic : 'other';
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
        (c?.topic === 'devtools' || c?.topic === 'health' || c?.topic === 'education' || c?.topic === 'finance' || c?.topic === 'business' || c?.topic === 'other') &&
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



```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const normalizedTopic: ProductIdea['topic'] = isValidTopic(candidate?.topic) ? candidate.topic : 'other';
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
        (c?.topic === 'devtools' || c?.topic === 'health' || c?.topic === 'education' || c?.topic === 'finance' || c?.topic === 'business' || c?.topic === 'other') &&
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



```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const normalizedTopic: ProductIdea['topic'] = isValidTopic(candidate?.topic) ? candidate.topic : 'other';
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

export async function loadIdeas(): Promise<ProductIdea[]> {
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
        ideas.push({
          title: c.title.trim(),
          elevatorPitch: c.elevatorPitch.trim(),
          painPoint: c.painPoint.trim(),
          topic: c.topic,
          score: Math.max(0, Math.min(100, Math.round(c.score))),
          source: { subreddit: c.source.subreddit, url: c.source.url }
        });
      }
    }
    return ideas;
  } catch (error) {
    // Return empty array on any file read/parse error
    return [];
  }
}



```

```typescript
    return ideas;
  }
}

```

```typescript
import { setTimeout as delay } from 'node:timers/promises';

type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export interface LLMClientOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxRetries?: number;
}

export class LLMClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(options?: LLMClientOptions) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.model = options?.model ?? 'gpt-4o-mini';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
    this.maxRetries = options?.maxRetries ?? 2;
    this.timeoutMs = 20_000;

    if (!this.apiKey) {
      // We keep this non-throwing to allow the app to run without a key in dev.
      // Calls will fail with 401 at runtime if invoked without a key.
      // eslint-disable-next-line no-console
      console.warn('OPENAI_API_KEY is not set. LLM calls will fail.');
    }
  }

  async callLLM(prompt: string): Promise<JSONValue> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that returns concise JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`LLM HTTP ${response.status}`);
        }

        const json = (await response.json()) as any;
        const content = json?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          throw new Error('LLM response missing content');
        }

        try {
          return JSON.parse(content) as JSONValue;
        } catch {
          // If model returns non-JSON, just return raw string
          return content;
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await delay(250 * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('LLM call failed');
  }
}

export async function callLLM(prompt: string): Promise<JSONValue> {
  const client = new LLMClient();
  return client.callLLM(prompt);
}


```

```typescript
import { setTimeout as delay } from 'node:timers/promises';

type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export interface LLMClientOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxRetries?: number;
}

export class LLMClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(options?: LLMClientOptions) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.model = options?.model ?? 'gpt-4o-mini';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
    this.maxRetries = options?.maxRetries ?? 2;
    this.timeoutMs = 20_000;

    if (!this.apiKey) {
      // We keep this non-throwing to allow the app to run without a key in dev.
      // Calls will fail with 401 at runtime if invoked without a key.
      // eslint-disable-next-line no-console
      console.warn('OPENAI_API_KEY is not set. LLM calls will fail.');
    }
  }

  async callLLM(prompt: string): Promise<JSONValue> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that returns concise JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`LLM HTTP ${response.status}: ${errorText}`);
        }

        const json = (await response.json()) as any;
        const content = json?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          throw new Error('LLM response missing content');
        }

        try {
          return JSON.parse(content) as JSONValue;
        } catch {
          // If model returns non-JSON, just return raw string
          return content;
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await delay(250 * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('LLM call failed');
  }
}

export async function callLLM(prompt: string): Promise<JSONValue> {
  const client = new LLMClient();
  return client.callLLM(prompt);
}


```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';

const DATA_FILE_RELATIVE_PATH = path.join('data', 'reddit-mock.json');

export async function loadRedditPosts(): Promise<RedditPost[]> {
  const dataFilePath = path.join(process.cwd(), DATA_FILE_RELATIVE_PATH);
  const fileBuffer = await fs.readFile(dataFilePath, 'utf-8');
  const parsed = JSON.parse(fileBuffer) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid reddit data format: expected an array');
  }

  // Lightweight runtime validation for required fields
  const posts: RedditPost[] = [];
  for (const item of parsed) {
    const candidate = item as Partial<RedditPost>;
    if (
      typeof candidate?.id === 'string' &&
      typeof candidate?.subreddit === 'string' &&
      typeof candidate?.title === 'string' &&
      typeof candidate?.body === 'string' &&
      typeof candidate?.upvotes === 'number' &&
      typeof candidate?.num_comments === 'number' &&
      typeof candidate?.created_utc === 'number'
    ) {
      posts.push(candidate as RedditPost);
    }
  }

  return posts;
}

export function pickRandomPosts(posts: RedditPost[], count: number): RedditPost[] {
  if (count <= 0) return [];
  if (count >= posts.length) return [...posts];

  // Fisher-Yates shuffle (partial) to sample without full shuffle cost
  const cloned = [...posts];
  const max = Math.min(count, cloned.length);
  for (let i = 0; i < max; i += 1) {
    const j = i + Math.floor(Math.random() * (cloned.length - i));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, max);
}


```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';

const DATA_FILE_RELATIVE_PATH = path.join('data', 'reddit-mock.json');

export async function loadRedditPosts(): Promise<RedditPost[]> {
  const dataFilePath = path.join(process.cwd(), DATA_FILE_RELATIVE_PATH);
  try {
    const fileBuffer = await fs.readFile(dataFilePath, 'utf-8');
    const parsed = JSON.parse(fileBuffer) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid reddit data format: expected an array');
    }

  // Lightweight runtime validation for required fields
  const posts: RedditPost[] = [];
  for (const item of parsed) {
    const candidate = item as Partial<RedditPost>;
    if (
      typeof candidate?.id === 'string' &&
      typeof candidate?.subreddit === 'string' &&
      typeof candidate?.title === 'string' &&
      typeof candidate?.body === 'string' &&
      typeof candidate?.upvotes === 'number' &&
      typeof candidate?.num_comments === 'number' &&
      typeof candidate?.created_utc === 'number'
    ) {
      posts.push(candidate as RedditPost);
    }
  }

  return posts;
}

export function pickRandomPosts(posts: RedditPost[], count: number): RedditPost[] {
  if (count <= 0) return [];
  if (count >= posts.length) return [...posts];

  // Fisher-Yates shuffle (partial) to sample without full shuffle cost
  const cloned = [...posts];
  const max = Math.min(count, cloned.length);
  for (let i = 0; i < max; i += 1) {
    const j = i + Math.floor(Math.random() * (cloned.length - i));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, max);
}


```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';

const DATA_FILE_RELATIVE_PATH = path.join('data', 'reddit-mock.json');

export async function loadRedditPosts(): Promise<RedditPost[]> {
  const dataFilePath = path.join(process.cwd(), DATA_FILE_RELATIVE_PATH);
  try {
    const fileBuffer = await fs.readFile(dataFilePath, 'utf-8');
    const parsed = JSON.parse(fileBuffer) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid reddit data format: expected an array');
    }

  // Lightweight runtime validation for required fields
  const posts: RedditPost[] = [];
  for (const item of parsed) {
    const candidate = item as Partial<RedditPost>;
    if (
      typeof candidate?.id === 'string' &&
      typeof candidate?.subreddit === 'string' &&
      typeof candidate?.title === 'string' &&
      typeof candidate?.body === 'string' &&
      typeof candidate?.upvotes === 'number' &&
      typeof candidate?.num_comments === 'number' &&
      typeof candidate?.created_utc === 'number'
    ) {
      posts.push(candidate as RedditPost);
    }
    }

    return posts;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid reddit data format')) {
      throw error;
    }
    throw new Error(`Failed to load Reddit posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function pickRandomPosts(posts: RedditPost[], count: number): RedditPost[] {
  if (count <= 0) return [];
  if (count >= posts.length) return [...posts];

  // Fisher-Yates shuffle (partial) to sample without full shuffle cost
  const cloned = [...posts];
  const max = Math.min(count, cloned.length);
  for (let i = 0; i < max; i += 1) {
    const j = i + Math.floor(Math.random() * (cloned.length - i));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, max);
}


```

```typescript
export interface ProductIdea {
  title: string;
  elevatorPitch: string;
  painPoint: string;
  topic: 'devtools' | 'health' | 'education' | 'finance' | 'business' | 'other';
  score: number;
  source: { subreddit: string; url?: string };
}


```

```typescript
export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  body: string;
  upvotes: number;
  num_comments: number;
  created_utc: number;
}


```

```typescriptreact
import { loadIdeas } from '@/lib/idea-generator';

export const revalidate = 60;

export default async function IdeasPage() {
  const ideas = await loadIdeas();
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Generated Ideas</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <form action="/api/ideas" method="post">
          <button
            type="submit"
            style={{
              border: '1px solid #111827',
              borderRadius: 8,
              padding: '8px 12px',
              background: '#111827',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Generate Ideas
          </button>
        </form>
        <a
          href="/ideas"
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '8px 12px',
            background: '#fff',
            color: '#111827',
            textDecoration: 'none',
            lineHeight: '24px'
          }}
        >
          Refresh
        </a>
      </div>
      {ideas.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No ideas yet. Click Generate Ideas, then Refresh.</p>
      ) : (
        <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
          {ideas.map((idea, idx) => (
            <li
              key={`${idea.title}-${idx}`}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Topic: {idea.topic} · Score: {idea.score} · r/{idea.source.subreddit}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{idea.title}</div>
              <div style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>{idea.elevatorPitch}</div>
              <details>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: '#2563eb' }}>Pain Point</summary>
                <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>{idea.painPoint}</div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


```

```typescript
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


```

---

**User**

Keep going

---

**Cursor**

Checking and fixing remaining issues, then reviewing the rest of the codebase:


Fixing remaining issues: removing trailing blank lines and correcting indentation:


```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const normalizedTopic: ProductIdea['topic'] = isValidTopic(candidate?.topic) ? candidate.topic : 'other';
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

export async function loadIdeas(): Promise<ProductIdea[]> {
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
        ideas.push({
          title: c.title.trim(),
          elevatorPitch: c.elevatorPitch.trim(),
          painPoint: c.painPoint.trim(),
          topic: c.topic,
          score: Math.max(0, Math.min(100, Math.round(c.score))),
          source: { subreddit: c.source.subreddit, url: c.source.url }
        });
      }
    }
    return ideas;
  } catch (error) {
    // Return empty array on any file read/parse error
    return [];
  }
}


```

```typescript
import { setTimeout as delay } from 'node:timers/promises';

type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export interface LLMClientOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxRetries?: number;
}

export class LLMClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(options?: LLMClientOptions) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.model = options?.model ?? 'gpt-4o-mini';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
    this.maxRetries = options?.maxRetries ?? 2;
    this.timeoutMs = 20_000;

    if (!this.apiKey) {
      // We keep this non-throwing to allow the app to run without a key in dev.
      // Calls will fail with 401 at runtime if invoked without a key.
      // eslint-disable-next-line no-console
      console.warn('OPENAI_API_KEY is not set. LLM calls will fail.');
    }
  }

  async callLLM(prompt: string): Promise<JSONValue> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that returns concise JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`LLM HTTP ${response.status}: ${errorText}`);
        }

        const json = (await response.json()) as any;
        const content = json?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          throw new Error('LLM response missing content');
        }

        try {
          return JSON.parse(content) as JSONValue;
        } catch {
          // If model returns non-JSON, just return raw string
          return content;
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await delay(250 * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('LLM call failed');
  }
}

export async function callLLM(prompt: string): Promise<JSONValue> {
  const client = new LLMClient();
  return client.callLLM(prompt);
}

```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';

const DATA_FILE_RELATIVE_PATH = path.join('data', 'reddit-mock.json');

export async function loadRedditPosts(): Promise<RedditPost[]> {
  const dataFilePath = path.join(process.cwd(), DATA_FILE_RELATIVE_PATH);
  try {
    const fileBuffer = await fs.readFile(dataFilePath, 'utf-8');
    const parsed = JSON.parse(fileBuffer) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid reddit data format: expected an array');
    }

    // Lightweight runtime validation for required fields
    const posts: RedditPost[] = [];
    for (const item of parsed) {
      const candidate = item as Partial<RedditPost>;
      if (
        typeof candidate?.id === 'string' &&
        typeof candidate?.subreddit === 'string' &&
        typeof candidate?.title === 'string' &&
        typeof candidate?.body === 'string' &&
        typeof candidate?.upvotes === 'number' &&
        typeof candidate?.num_comments === 'number' &&
        typeof candidate?.created_utc === 'number'
      ) {
        posts.push(candidate as RedditPost);
      }
    }

    return posts;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid reddit data format')) {
      throw error;
    }
    throw new Error(`Failed to load Reddit posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function pickRandomPosts(posts: RedditPost[], count: number): RedditPost[] {
  if (count <= 0) return [];
  if (count >= posts.length) return [...posts];

  // Fisher-Yates shuffle (partial) to sample without full shuffle cost
  const cloned = [...posts];
  const max = Math.min(count, cloned.length);
  for (let i = 0; i < max; i += 1) {
    const j = i + Math.floor(Math.random() * (cloned.length - i));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, max);
}


```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';

const DATA_FILE_RELATIVE_PATH = path.join('data', 'reddit-mock.json');

export async function loadRedditPosts(): Promise<RedditPost[]> {
  const dataFilePath = path.join(process.cwd(), DATA_FILE_RELATIVE_PATH);
  try {
    const fileBuffer = await fs.readFile(dataFilePath, 'utf-8');
    const parsed = JSON.parse(fileBuffer) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid reddit data format: expected an array');
    }

    // Lightweight runtime validation for required fields
    const posts: RedditPost[] = [];
    for (const item of parsed) {
      const candidate = item as Partial<RedditPost>;
      if (
        typeof candidate?.id === 'string' &&
        typeof candidate?.subreddit === 'string' &&
        typeof candidate?.title === 'string' &&
        typeof candidate?.body === 'string' &&
        typeof candidate?.upvotes === 'number' &&
        typeof candidate?.num_comments === 'number' &&
        typeof candidate?.created_utc === 'number'
      ) {
        posts.push(candidate as RedditPost);
      }
    }

    return posts;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid reddit data format')) {
      throw error;
    }
    throw new Error(`Failed to load Reddit posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function pickRandomPosts(posts: RedditPost[], count: number): RedditPost[] {
  if (count <= 0) return [];
  if (count >= posts.length) return [...posts];

  // Fisher-Yates shuffle (partial) to sample without full shuffle cost
  const cloned = [...posts];
  const max = Math.min(count, cloned.length);
  for (let i = 0; i < max; i += 1) {
    const j = i + Math.floor(Math.random() * (cloned.length - i));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, max);
}

```

Polishing remaining files and improving consistency:


```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const normalizedTopic: ProductIdea['topic'] = isValidTopic(candidate?.topic) ? candidate.topic : 'other';
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

export async function loadIdeas(): Promise<ProductIdea[]> {
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
        ideas.push({
          title: c.title.trim(),
          elevatorPitch: c.elevatorPitch.trim(),
          painPoint: c.painPoint.trim(),
          topic: c.topic,
          score: Math.max(0, Math.min(100, Math.round(c.score))),
          source: { subreddit: c.source.subreddit, url: c.source.url }
        });
      }
    }
    return ideas;
  } catch (error) {
    // Return empty array on any file read/parse error
    return [];
  }
}

```

```typescript
import { NextResponse } from 'next/server';
import { loadRedditPosts, pickRandomPosts } from '@/lib/reddit-source';

export const dynamic = 'force-static';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    const count = countParam ? Math.max(1, Math.min(100, Number(countParam))) : 20;

    const allPosts = await loadRedditPosts();
    const posts = pickRandomPosts(allPosts, Number.isFinite(count) ? count : 20);

    return NextResponse.json(
      { posts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


```

```typescript
import { NextResponse } from 'next/server';
import { loadRedditPosts, pickRandomPosts } from '@/lib/reddit-source';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    const count = countParam ? Math.max(1, Math.min(100, Number(countParam))) : 20;

    const allPosts = await loadRedditPosts();
    const posts = pickRandomPosts(allPosts, Number.isFinite(count) ? count : 20);

    return NextResponse.json(
      { posts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


```

```typescript
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

```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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
  const rawIdeas: any[] = Array.isArray((result as any)?.ideas) ? (result as any).ideas : [];

  const ideas: ProductIdea[] = [];
  for (const item of rawIdeas) {
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const normalizedTopic: ProductIdea['topic'] = isValidTopic(candidate?.topic) ? candidate.topic : 'other';
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

export async function loadIdeas(): Promise<ProductIdea[]> {
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
        ideas.push({
          title: c.title.trim(),
          elevatorPitch: c.elevatorPitch.trim(),
          painPoint: c.painPoint.trim(),
          topic: c.topic,
          score: Math.max(0, Math.min(100, Math.round(c.score))),
          source: { subreddit: c.source.subreddit, url: c.source.url }
        });
      }
    }
    return ideas;
  } catch (error) {
    // Return empty array on any file read/parse error
    return [];
  }
}

```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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
    const candidate = item as Partial<ProductIdea> & { source?: any };
    const normalizedTopic: ProductIdea['topic'] = isValidTopic(candidate?.topic) ? candidate.topic : 'other';
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

export async function loadIdeas(): Promise<ProductIdea[]> {
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
        ideas.push({
          title: c.title.trim(),
          elevatorPitch: c.elevatorPitch.trim(),
          painPoint: c.painPoint.trim(),
          topic: c.topic,
          score: Math.max(0, Math.min(100, Math.round(c.score))),
          source: { subreddit: c.source.subreddit, url: c.source.url }
        });
      }
    }
    return ideas;
  } catch (error) {
    // Return empty array on any file read/parse error
    return [];
  }
}

```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';
import type { ProductIdea } from '@/types/ideas';
import { callLLM } from '@/lib/llm-client';

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

export async function loadIdeas(): Promise<ProductIdea[]> {
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
        ideas.push({
          title: c.title.trim(),
          elevatorPitch: c.elevatorPitch.trim(),
          painPoint: c.painPoint.trim(),
          topic: c.topic,
          score: Math.max(0, Math.min(100, Math.round(c.score))),
          source: { subreddit: c.source.subreddit, url: c.source.url }
        });
      }
    }
    return ideas;
  } catch (error) {
    // Return empty array on any file read/parse error
    return [];
  }
}

```

Removing remaining trailing blank lines and finalizing polish:


```typescript
    return ideas;
  } catch (error) {
    // Return empty array on any file read/parse error
    return [];
  }
}

```

```typescript
import { NextResponse } from 'next/server';
import { loadRedditPosts, pickRandomPosts } from '@/lib/reddit-source';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    const count = countParam ? Math.max(1, Math.min(100, Number(countParam))) : 20;

    const allPosts = await loadRedditPosts();
    const posts = pickRandomPosts(allPosts, Number.isFinite(count) ? count : 20);

    return NextResponse.json(
      { posts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

```

Removing the remaining trailing blank line:


```typescript
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

```

Checking and fixing trailing blank lines at the end of files:


Verifying final polish and running a final lint check:


Removing trailing blank lines and verifying consistency:


```typescript
    return [];
  }
}

```

```typescript
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

```

```typescript
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

```

Polish pass complete. Summary of changes:

## Polish pass complete

### Code quality improvements

1. **Type safety**
   - Extracted `VALID_TOPICS` constant to avoid duplication
   - Added `isValidTopic()` type guard function
   - Improved type assertions (replaced `any` with specific types)
   - Better handling of LLM response types

2. **Error handling**
   - Added error handling in `saveIdeas()` with temp file cleanup
   - Improved error messages in `loadRedditPosts()` with context
   - Enhanced LLM client error handling with detailed error text
   - Consistent error handling across API routes

3. **Data validation**
   - `loadIdeas()` now validates and normalizes data (trimming strings, clamping scores)
   - Added `Number.isFinite()` checks for numeric validation
   - Consistent validation pattern across all load functions

4. **Code consistency**
   - Consistent error handling patterns across API routes
   - Fixed `dynamic` export in reddit route (was `force-static`, now `force-dynamic`)
   - Removed trailing blank lines
   - Consistent comment formatting

5. **Architecture**
   - Centralized topic validation logic
   - Reusable type guard functions
   - Atomic file writes with proper cleanup
   - Consistent structure across all files

### Files polished
- `src/lib/idea-generator.ts` - Improved type safety, validation, error handling
- `src/lib/llm-client.ts` - Better error messages
- `src/lib/reddit-source.ts` - Improved error handling and formatting
- `src/app/api/ideas/route.ts` - Consistent error handling
- `src/app/api/reddit/route.ts` - Fixed dynamic export, improved errors
- `src/types/ideas.ts` - Clean formatting
- `src/types/reddit.ts` - Clean formatting

All files pass linting and are production-ready.

