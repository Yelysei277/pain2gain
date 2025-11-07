import { redirect } from 'next/navigation';
import FeedClient from '../components/feed-client';
import type { ProductIdea } from '@/types/ideas';
import { loadIdeas } from '@/lib/idea-generator';
import { createServerComponentClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

async function fetchIdeas(): Promise<ProductIdea[]> {
  try {
    return await loadIdeas();
  } catch {
    return [];
  }
}

export default async function IdeasPage() {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      redirect(`/auth?redirect=${encodeURIComponent('/ideas')}`);
    }
  } catch {
    redirect(`/auth?redirect=${encodeURIComponent('/ideas')}`);
  }

  const ideas = await fetchIdeas();

  return <FeedClient ideas={ideas} />;
}

