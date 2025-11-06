import { NextResponse } from 'next/server';
import { loadIdeasFromLast24Hours } from '@/lib/db-ideas';
import { getAllActiveSubscriptions } from '@/lib/db-subscriptions';
import { generateEmailTemplate, sendDigestEmail } from '@/lib/email-service';
import { getBaseUrl } from '@/lib/config';
import type { ProductIdea } from '@/types/ideas';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const ideas = await loadIdeasFromLast24Hours();

    if (ideas.length === 0) {
      return NextResponse.json({
        ...results,
        message: 'No new ideas in the last 24 hours',
      });
    }

    const ideasByTopic = new Map<string, ProductIdea[]>();
    for (const idea of ideas) {
      const topic = idea.topic;
      if (!ideasByTopic.has(topic)) {
        ideasByTopic.set(topic, []);
      }
      ideasByTopic.get(topic)!.push(idea);
    }

    const subscriptions = await getAllActiveSubscriptions();

    if (subscriptions.length === 0) {
      return NextResponse.json({
        ...results,
        message: 'No active subscriptions',
      });
    }

    for (const subscription of subscriptions) {
      if (!subscription.email || !subscription.topics || !subscription.unsubscribe_token) {
        continue;
      }

      const subscriptionTopics = subscription.topics.filter(
        (topic): topic is string => typeof topic === 'string'
      );

      if (subscriptionTopics.length === 0) {
        continue;
      }

      const matchingIdeas: ProductIdea[] = [];
      for (const topic of subscriptionTopics) {
        const topicIdeas = ideasByTopic.get(topic) || [];
        matchingIdeas.push(...topicIdeas);
      }

      if (matchingIdeas.length === 0) {
        continue;
      }

      try {
        const html = generateEmailTemplate(
          matchingIdeas,
          subscription.unsubscribe_token,
          getBaseUrl()
        );

        await sendDigestEmail(
          subscription.email,
          `Fresh ideas from Pain2Gain (${matchingIdeas.length} new)`,
          html
        );

        results.sent++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Failed to send to ${subscription.email}: ${errorMessage}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      {
        ...results,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

