-- SwipeBite — initial schema
-- Postgres / Supabase
-- Run via: supabase db push   (after `supabase init` + linking the project)

set check_function_bodies = off;

------------------------------------------------------------
-- 1. Users (mirrors auth.users; row created on signup)
------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

------------------------------------------------------------
-- 2. Households
------------------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.users(id) on delete cascade,
  invite_code text unique,
  created_at timestamptz not null default now()
);

------------------------------------------------------------
-- 3. Household members (many-to-many users <-> households)
------------------------------------------------------------
create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

------------------------------------------------------------
-- 4. Profiles (per-user taste profile)
------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  allergies text[] not null default '{}',
  hard_dislikes text[] not null default '{}',
  favorite_cuisines text[] not null default '{}',
  spice_tolerance text not null default 'mild'
    check (spice_tolerance in ('none', 'mild', 'medium', 'hot')),
  updated_at timestamptz not null default now()
);

------------------------------------------------------------
-- 5. Recipes (shared catalog)
------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  prep_time_minutes int not null default 30,
  difficulty text not null default 'kolay'
    check (difficulty in ('kolay', 'orta', 'zor')),
  servings int not null default 2,
  ingredients jsonb not null default '[]'::jsonb,
  steps text[] not null default '{}',
  tags text[] not null default '{}',
  cuisine text,
  created_at timestamptz not null default now()
);

create index if not exists recipes_tags_idx on public.recipes using gin (tags);
create index if not exists recipes_cuisine_idx on public.recipes (cuisine);

------------------------------------------------------------
-- 6. Swipe sessions
------------------------------------------------------------
create table if not exists public.swipe_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  session_type text not null default 'dinner'
    check (session_type in ('dinner', 'lunch', 'breakfast', 'snack')),
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  participant_ids uuid[] not null default '{}',
  recipe_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists sessions_household_idx on public.swipe_sessions (household_id, created_at desc);

------------------------------------------------------------
-- 7. Votes
------------------------------------------------------------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.swipe_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  vote_type text not null check (vote_type in ('like', 'dislike', 'superlike', 'superdislike')),
  created_at timestamptz not null default now(),
  unique (session_id, user_id, recipe_id)
);

create index if not exists votes_session_idx on public.votes (session_id);

------------------------------------------------------------
-- 8. Matches
------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.swipe_sessions(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  score numeric not null,
  reasons text[] not null default '{}',
  liked_by_user_ids uuid[] not null default '{}',
  alternatives jsonb not null default '[]'::jsonb,
  missing_ingredients text[] not null default '{}',
  created_at timestamptz not null default now()
);

------------------------------------------------------------
-- 9. Pantry
------------------------------------------------------------
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity text,
  category text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists pantry_household_idx on public.pantry_items (household_id);

------------------------------------------------------------
-- 10. Weekly plans
------------------------------------------------------------
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  mode text not null default 'busy'
    check (mode in ('busy', 'healthy', 'budget', 'comfort', 'kids')),
  week_start date not null,
  days jsonb not null default '[]'::jsonb,
  grocery_list text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (household_id, week_start)
);

------------------------------------------------------------
-- RLS — household-scoped access
------------------------------------------------------------
alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.swipe_sessions enable row level security;
alter table public.votes enable row level security;
alter table public.matches enable row level security;
alter table public.pantry_items enable row level security;
alter table public.weekly_plans enable row level security;

-- Helper: is the auth user a member of the household?
create or replace function public.is_household_member(h uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = h
      and m.user_id = auth.uid()
  );
$$;

-- users: a user can read/update only their own row.
create policy "users_self_read" on public.users
  for select using (id = auth.uid());
create policy "users_self_update" on public.users
  for update using (id = auth.uid());
create policy "users_self_insert" on public.users
  for insert with check (id = auth.uid());

-- households: members can read.
create policy "households_member_read" on public.households
  for select using (public.is_household_member(id));
create policy "households_owner_insert" on public.households
  for insert with check (created_by = auth.uid());
create policy "households_owner_update" on public.households
  for update using (created_by = auth.uid());

-- household_members: visible to members of the same household.
create policy "members_member_read" on public.household_members
  for select using (public.is_household_member(household_id));
create policy "members_self_insert" on public.household_members
  for insert with check (user_id = auth.uid());

-- profiles: self read/write; household members can read each other's profile.
create policy "profiles_self_rw" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles_household_read" on public.profiles
  for select using (
    exists (
      select 1
      from public.household_members me
      join public.household_members other
        on other.household_id = me.household_id
      where me.user_id = auth.uid()
        and other.user_id = profiles.user_id
    )
  );

-- recipes: read by all signed-in users (shared catalog).
create policy "recipes_authenticated_read" on public.recipes
  for select using (auth.role() = 'authenticated');

-- swipe_sessions: household members read/write.
create policy "sessions_member_rw" on public.swipe_sessions
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- votes: members of the session's household.
create policy "votes_member_rw" on public.votes
  for all using (
    exists (
      select 1
      from public.swipe_sessions s
      where s.id = votes.session_id
        and public.is_household_member(s.household_id)
    )
  )
  with check (user_id = auth.uid());

-- matches: household members read.
create policy "matches_member_read" on public.matches
  for select using (
    exists (
      select 1
      from public.swipe_sessions s
      where s.id = matches.session_id
        and public.is_household_member(s.household_id)
    )
  );
create policy "matches_member_insert" on public.matches
  for insert with check (
    exists (
      select 1
      from public.swipe_sessions s
      where s.id = matches.session_id
        and public.is_household_member(s.household_id)
    )
  );

-- pantry_items: household members.
create policy "pantry_member_rw" on public.pantry_items
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- weekly_plans: household members.
create policy "plans_member_rw" on public.weekly_plans
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

------------------------------------------------------------
-- Realtime: enable for sessions and votes (for live swipe sync)
------------------------------------------------------------
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.swipe_sessions;
alter publication supabase_realtime add table public.matches;
