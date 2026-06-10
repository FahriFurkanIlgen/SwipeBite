-- Usage analytics for monetization (Faz 0): observe real feature demand and
-- AI cost before drawing the paywall. Fire-and-forget inserts from the client.
-- `user_id` is nullable so pre-auth / anonymous events are still captured.
-- `props` is freeform JSON (event-specific payload, e.g. AI token counts/cost).

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references public.users(id) on delete set null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx
  on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_user_idx
  on public.analytics_events (user_id, created_at desc);

alter table public.analytics_events enable row level security;

-- Clients may only INSERT their own events (or anonymous ones). No SELECT for
-- end users — analytics are read server-side / via the service role only.
create policy "analytics_insert_self" on public.analytics_events
  for insert
  with check (user_id is null or user_id = auth.uid());
