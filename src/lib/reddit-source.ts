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


