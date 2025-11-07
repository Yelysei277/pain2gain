import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';

const DATA_FILE_RELATIVE_PATH = path.join('data', 'reddit-mock.json');
const DEFAULT_SUBREDDITS = ['startups', 'entrepreneur', 'SaaS'];
const RATE_LIMIT_DELAY_MS = 1000;

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

async function loadRedditPostsFromFile(): Promise<RedditPost[]> {
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

async function getRedditAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT;

  if (!clientId || !clientSecret || !userAgent) {
    throw new Error('Missing Reddit API credentials in environment variables');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reddit API auth failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  const expiresAt = Date.now() + Math.max(0, data.expires_in - 300) * 1000;
  cachedToken = {
    token: data.access_token,
    expiresAt,
  };

  return data.access_token;
}

async function fetchSubredditPosts(options: {
  subreddit: string;
  limit: number;
  token: string;
  userAgent: string;
}): Promise<RedditPost[]> {
  const { subreddit, limit, token, userAgent } = options;
  const subredditName = subreddit.replace(/^r\//, '');
  const response = await fetch(`https://oauth.reddit.com/r/${subredditName}/hot.json?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subreddit ${subredditName}: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    data: {
      children: Array<{ data: any }>;
    };
  };

  if (!data?.data?.children || !Array.isArray(data.data.children)) {
    return [];
  }

  return data.data.children
    .map((child) => {
      const post = child?.data;
      if (!post) {
        return null;
      }
      const createdUtc = Number(post.created_utc ?? 0);
      if (Number.isNaN(createdUtc)) {
        return null;
      }

      return {
        id: String(post.id),
        subreddit: `r/${post.subreddit}`,
        title: String(post.title ?? ''),
        body: typeof post.selftext === 'string' ? post.selftext : '',
        upvotes: Number(post.ups ?? 0),
        num_comments: Number(post.num_comments ?? 0),
        created_utc: createdUtc,
      } satisfies RedditPost;
    })
    .filter((post): post is RedditPost => Boolean(post));
}

export async function loadRedditPosts(
  subreddits: string[] = DEFAULT_SUBREDDITS,
  limit = 100
): Promise<RedditPost[]> {
  try {
    const userAgent = process.env.REDDIT_USER_AGENT;

    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET || !userAgent) {
      return loadRedditPostsFromFile();
    }

    const token = await getRedditAccessToken();
    const allPosts: RedditPost[] = [];
    const errors: string[] = [];

    for (const subreddit of subreddits) {
      try {
        const posts = await fetchSubredditPosts({ subreddit, limit: Math.min(limit, 100), token, userAgent });
        allPosts.push(...posts);
      } catch (subredditError) {
        errors.push(subredditError instanceof Error ? subredditError.message : String(subredditError));
      }

      if (subreddit !== subreddits[subreddits.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }

    if (allPosts.length === 0) {
      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }
      return loadRedditPostsFromFile();
    }

    return allPosts;
  } catch (error) {
    return loadRedditPostsFromFile();
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
