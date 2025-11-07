import { NextResponse } from 'next/server';
import { getSubscriptionByToken, deactivateSubscription } from '@/lib/db-subscriptions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const subscription = await getSubscriptionByToken(token);

    if (!subscription) {
      return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 404 });
    }

    if (subscription.is_active === false) {
      await deactivateSubscription(token);

      return NextResponse.json(
        { message: 'You have already unsubscribed' },
        { status: 200 }
      );
    }

    await deactivateSubscription(token);

    return NextResponse.json({ message: 'Successfully unsubscribed' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

