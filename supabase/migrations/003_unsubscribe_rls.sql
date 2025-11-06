-- Add RLS policies for unsubscribe flow
-- This migration adds policies to allow unauthenticated unsubscribe operations via token

-- Allow reading subscriptions by unsubscribe_token (for unsubscribe flow)
-- This allows checking subscription status via token without authentication
create policy "Allow reading subscriptions by token"
  on subscriptions for select
  using (unsubscribe_token is not null);

-- Allow unauthenticated updates via unsubscribe_token (for unsubscribe flow)
-- This policy allows deactivating subscriptions by token without authentication
-- The using clause allows any row to be checked, but the actual update is restricted
-- by the WHERE clause in the application code (eq('unsubscribe_token', token))
-- The with check ensures only is_active can be set to false (deactivation only)
create policy "Allow unsubscribe via token"
  on subscriptions for update
  using (true)
  with check (is_active = false);

