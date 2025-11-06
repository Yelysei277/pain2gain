import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { getUserSubscription } from '@/lib/db-subscriptions';
import { loadIdeasFromDB } from '@/lib/db-ideas';
import { generateEmailTemplate, sendDigestEmail } from '@/lib/email-service';
import { getBaseUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found. Please create a subscription first.' },
        { status: 404 }
      );
    }

    if (!subscription.email || !subscription.unsubscribe_token) {
      return NextResponse.json(
        { error: 'Subscription is missing email or unsubscribe token' },
        { status: 400 }
      );
    }

    const allIdeas = await loadIdeasFromDB();
    const testIdeas = allIdeas.slice(0, 3);

    if (testIdeas.length === 0) {
      return NextResponse.json(
        { error: 'No ideas available for testing' },
        { status: 404 }
      );
    }

    const html = generateEmailTemplate(
      testIdeas,
      subscription.unsubscribe_token,
      getBaseUrl()
    );

    await sendDigestEmail(
      subscription.email,
      'Test email from Pain2Gain',
      html
    );

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${subscription.email}`,
      ideasCount: testIdeas.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

