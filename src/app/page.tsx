import FeedClient from './components/feed-client';
import type { ProductIdea } from '@/types/ideas';
import { loadIdeas } from '@/lib/idea-generator';

export const revalidate = 60;

async function fetchIdeas(): Promise<ProductIdea[]> {
  try {
    return await loadIdeas();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const ideas = await fetchIdeas();

  return <FeedClient ideas={ideas} />;
}
