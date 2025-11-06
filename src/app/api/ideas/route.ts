import { NextResponse } from 'next/server';
import { loadIdeas } from '@/lib/idea-generator';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const ideas = await loadIdeas();
    return NextResponse.json({ ideas });
  } catch {
    return NextResponse.json({ ideas: [] }, { status: 200 });
  }
}
