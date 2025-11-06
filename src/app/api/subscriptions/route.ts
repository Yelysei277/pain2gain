import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { getUserSubscription, upsertSubscription } from '@/lib/db-subscriptions';

export const dynamic = 'force-dynamic';

const VALID_TOPICS = ['devtools', 'health', 'education', 'finance', 'business', 'other'] as const;
type ValidTopic = typeof VALID_TOPICS[number];

function isValidTopic(topic: string): topic is ValidTopic {
  return VALID_TOPICS.includes(topic as ValidTopic);
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user.id);

    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, topics } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!Array.isArray(topics)) {
      return NextResponse.json({ error: 'Topics must be an array' }, { status: 400 });
    }

    if (topics.length === 0) {
      return NextResponse.json({ error: 'At least one topic is required' }, { status: 400 });
    }

    const invalidTopics = topics.filter((topic) => !isValidTopic(topic));
    if (invalidTopics.length > 0) {
      return NextResponse.json(
        { error: `Invalid topics: ${invalidTopics.join(', ')}` },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const subscription = await upsertSubscription(session.user.id, email, topics);

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topics } = body;

    if (!Array.isArray(topics)) {
      return NextResponse.json({ error: 'Topics must be an array' }, { status: 400 });
    }

    if (topics.length === 0) {
      return NextResponse.json({ error: 'At least one topic is required' }, { status: 400 });
    }

    const invalidTopics = topics.filter((topic) => !isValidTopic(topic));
    if (invalidTopics.length > 0) {
      return NextResponse.json(
        { error: `Invalid topics: ${invalidTopics.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await getUserSubscription(session.user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (!existing.email) {
      return NextResponse.json({ error: 'Email not found in subscription' }, { status: 400 });
    }

    const subscription = await upsertSubscription(session.user.id, existing.email, topics);

    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

