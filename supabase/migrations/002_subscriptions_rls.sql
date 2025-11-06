-- Update RLS policies for subscriptions table to allow authenticated users to manage their own subscriptions

-- Drop the existing public read policy (we'll replace it with more specific ones)
drop policy if exists "Allow public read access to subscriptions" on subscriptions;

-- Allow authenticated users to read their own subscriptions
create policy "Allow users to read their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Allow reading active subscriptions for email digest sending
-- This is needed for the /api/notifications/send-digest endpoint
create policy "Allow reading active subscriptions for digest"
  on subscriptions for select
  using (is_active = true);

-- Allow authenticated users to insert their own subscriptions
create policy "Allow users to insert their own subscriptions"
  on subscriptions for insert
  with check (auth.uid() = user_id);

-- Allow authenticated users to update their own subscriptions
create policy "Allow users to update their own subscriptions"
  on subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

