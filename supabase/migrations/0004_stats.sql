-- Per-user favorites and cook log so stats persist across devices.
-- recipe_id is `text` (not FK to recipes.id) so it tolerates both
-- real catalog UUIDs and mock slug ids ("r-mercimek" etc.).

create table if not exists public.favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists favorites_user_idx on public.favorites (user_id);

create table if not exists public.cook_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id text not null,
  cooked_on date not null default (current_date),
  created_at timestamptz not null default now()
);

create index if not exists cook_log_user_idx on public.cook_log (user_id, cooked_on desc);

alter table public.favorites enable row level security;
alter table public.cook_log enable row level security;

create policy "favorites_self_rw" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cook_log_self_rw" on public.cook_log
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
