-- Detailed household preferences for AI weekly planner.
-- Single jsonb blob keeps schema flexible while we iterate.

alter table public.households
  add column if not exists preferences jsonb;
