import { randomUUID } from 'crypto';
import { createServerComponentClient } from './supabase-server';
import type { SubscriptionsRow } from './db-types';

export async function getUserSubscription(
  userId: string
): Promise<SubscriptionsRow | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get user subscription: ${error.message}`);
  }

  return (data as SubscriptionsRow | null) ?? null;
}

export function generateUnsubscribeToken(): string {
  return randomUUID();
}

export async function upsertSubscription(
  userId: string,
  email: string,
  topics: string[]
): Promise<SubscriptionsRow> {
  const supabase = await createServerComponentClient();

  const existing = await getUserSubscription(userId);

  let unsubscribeToken: string;
  if (existing?.unsubscribe_token) {
    unsubscribeToken = existing.unsubscribe_token;
  } else {
    unsubscribeToken = generateUnsubscribeToken();
  }

  const subscriptionData = {
    user_id: userId,
    email,
    topics,
    is_active: true,
    unsubscribe_token: unsubscribeToken,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subscriptionData as never)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    return data as SubscriptionsRow;
  } else {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData as never)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data as SubscriptionsRow;
  }
}

export async function getSubscriptionByToken(
  token: string
): Promise<SubscriptionsRow | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get subscription by token: ${error.message}`);
  }

  return (data as SubscriptionsRow | null) ?? null;
}

export async function deactivateSubscription(token: string): Promise<void> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('subscriptions')
    .update({ is_active: false } as never)
    .eq('unsubscribe_token', token);

  if (error) {
    throw new Error(`Failed to deactivate subscription: ${error.message}`);
  }
}

export async function getAllActiveSubscriptions(): Promise<SubscriptionsRow[]> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to get active subscriptions: ${error.message}`);
  }

  return (data as SubscriptionsRow[]) ?? [];
}
