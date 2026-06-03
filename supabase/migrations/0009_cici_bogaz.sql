-- Cici Boğaz — group fast food voting
-- Lightweight: no household required, anyone can join with a 6-char code.

set check_function_bodies = off;

------------------------------------------------------------
-- Sessions
------------------------------------------------------------
create table if not exists public.cici_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'lobby'
    check (status in ('lobby', 'voting', 'completed')),
  price_tiers text[] not null default '{}',
  categories text[] not null default '{}',
  item_ids text[] not null default '{}',
  -- Tournament state
  round_seconds int not null default 30,
  current_round int not null default 0,
  round_left_id text,
  round_right_id text,
  round_started_at timestamptz,
  current_winner_id text, -- carries between rounds
  deck_index int not null default 0, -- next item from item_ids to bring as challenger
  winner_item_id text,
  created_at timestamptz not null default now()
);

create index if not exists cici_sessions_code_idx on public.cici_sessions (code);

------------------------------------------------------------
-- Members
------------------------------------------------------------
create table if not exists public.cici_members (
  session_id uuid not null references public.cici_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  joined_at timestamptz not null default now(),
  finished_at timestamptz,
  primary key (session_id, user_id)
);

create index if not exists cici_members_session_idx on public.cici_members (session_id);

------------------------------------------------------------
-- Votes (per-round)
------------------------------------------------------------
create table if not exists public.cici_votes (
  session_id uuid not null references public.cici_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  round int not null,
  item_id text not null, -- the item the user picked in that round
  created_at timestamptz not null default now(),
  primary key (session_id, user_id, round)
);

create index if not exists cici_votes_session_idx on public.cici_votes (session_id);

------------------------------------------------------------
-- RLS
------------------------------------------------------------
alter table public.cici_sessions enable row level security;
alter table public.cici_members enable row level security;
alter table public.cici_votes enable row level security;

-- Helper: is auth.uid() a member of the cici session?
create or replace function public.is_cici_member(s uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cici_members m
    where m.session_id = s
      and m.user_id = auth.uid()
  );
$$;

-- Sessions: anyone authenticated can create; only members can read; creator can update.
-- We allow lookup by code (anonymous join flow) via a SECURITY DEFINER RPC below.
create policy "cici_sessions_member_read"
  on public.cici_sessions
  for select
  using (created_by = auth.uid() or public.is_cici_member(id));

create policy "cici_sessions_create"
  on public.cici_sessions
  for insert
  with check (created_by = auth.uid());

create policy "cici_sessions_creator_update"
  on public.cici_sessions
  for update
  using (created_by = auth.uid());

-- Members: visible to other members; user can insert/update their own row.
create policy "cici_members_read"
  on public.cici_members
  for select
  using (public.is_cici_member(session_id));

create policy "cici_members_self_insert"
  on public.cici_members
  for insert
  with check (user_id = auth.uid());

create policy "cici_members_self_update"
  on public.cici_members
  for update
  using (user_id = auth.uid());

create policy "cici_members_self_delete"
  on public.cici_members
  for delete
  using (user_id = auth.uid());

-- Votes: visible to members; user can insert/update only their own.
create policy "cici_votes_read"
  on public.cici_votes
  for select
  using (public.is_cici_member(session_id));

create policy "cici_votes_self_insert"
  on public.cici_votes
  for insert
  with check (user_id = auth.uid());

create policy "cici_votes_self_update"
  on public.cici_votes
  for update
  using (user_id = auth.uid());

------------------------------------------------------------
-- RPC: join_cici_session(p_code) — returns session id and inserts caller as member.
-- Bypasses RLS so a user who isn't yet a member can resolve the code.
------------------------------------------------------------
create or replace function public.join_cici_session(
  p_code text,
  p_name text,
  p_avatar text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  select id into v_session_id
    from public.cici_sessions
    where code = upper(p_code)
    limit 1;

  if v_session_id is null then
    raise exception 'session_not_found' using errcode = 'P0001';
  end if;

  insert into public.cici_members (session_id, user_id, name, avatar_url)
    values (v_session_id, auth.uid(), p_name, p_avatar)
    on conflict (session_id, user_id) do update
      set name = excluded.name, avatar_url = excluded.avatar_url;

  return v_session_id;
end;
$$;

grant execute on function public.join_cici_session(text, text, text) to authenticated;

------------------------------------------------------------
-- RPC: start_cici_round — creator starts the next round.
-- Picks left = current_winner (or first deck item) and right = next deck item.
-- If no challenger remains → finalize: status=completed, winner=current_winner.
------------------------------------------------------------
create or replace function public.start_cici_round(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.cici_sessions%rowtype;
  v_left text;
  v_right text;
  v_idx int;
begin
  select * into s from public.cici_sessions where id = p_session_id for update;
  if s.id is null then raise exception 'session_not_found'; end if;
  if s.created_by <> auth.uid() then raise exception 'not_creator'; end if;

  v_idx := s.deck_index;

  -- First round: take items[0] and items[1].
  if s.current_winner_id is null then
    if array_length(s.item_ids, 1) < 2 then
      raise exception 'not_enough_items';
    end if;
    v_left := s.item_ids[1];
    v_right := s.item_ids[2];
    v_idx := 2;
  else
    v_left := s.current_winner_id;
    if v_idx + 1 > coalesce(array_length(s.item_ids, 1), 0) then
      -- No challengers left → finalize.
      update public.cici_sessions
        set status = 'completed',
            winner_item_id = s.current_winner_id,
            round_left_id = null,
            round_right_id = null,
            round_started_at = null
        where id = p_session_id;
      return;
    end if;
    v_right := s.item_ids[v_idx + 1];
    v_idx := v_idx + 1;
  end if;

  update public.cici_sessions
    set status = 'voting',
        current_round = current_round + 1,
        round_left_id = v_left,
        round_right_id = v_right,
        round_started_at = now(),
        deck_index = v_idx
    where id = p_session_id;
end;
$$;

grant execute on function public.start_cici_round(uuid) to authenticated;

------------------------------------------------------------
-- RPC: advance_cici_round — tally current round and start next.
-- Anyone in the session may call (typically once everyone has voted, or when
-- the timer expires on the creator's device). Idempotent: bails if already
-- advanced (current_round changed under us).
------------------------------------------------------------
create or replace function public.advance_cici_round(
  p_session_id uuid,
  p_round int
) returns text -- the winner of the round
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.cici_sessions%rowtype;
  v_left_count int;
  v_right_count int;
  v_winner text;
begin
  select * into s from public.cici_sessions where id = p_session_id for update;
  if s.id is null then raise exception 'session_not_found'; end if;
  if not public.is_cici_member(p_session_id) then
    raise exception 'not_member';
  end if;
  -- Already advanced — no-op.
  if s.current_round <> p_round then return s.current_winner_id; end if;
  if s.status <> 'voting' then return s.current_winner_id; end if;

  select
    count(*) filter (where item_id = s.round_left_id),
    count(*) filter (where item_id = s.round_right_id)
  into v_left_count, v_right_count
  from public.cici_votes
  where session_id = p_session_id and round = p_round;

  if v_left_count > v_right_count then
    v_winner := s.round_left_id;
  elsif v_right_count > v_left_count then
    v_winner := s.round_right_id;
  else
    -- Tie (includes 0–0 if everyone abstained): random.
    if random() < 0.5 then
      v_winner := s.round_left_id;
    else
      v_winner := s.round_right_id;
    end if;
  end if;

  update public.cici_sessions
    set current_winner_id = v_winner,
        round_left_id = null,
        round_right_id = null,
        round_started_at = null
    where id = p_session_id;

  return v_winner;
end;
$$;

grant execute on function public.advance_cici_round(uuid, int) to authenticated;

------------------------------------------------------------
-- Realtime
------------------------------------------------------------
alter publication supabase_realtime add table public.cici_sessions;
alter publication supabase_realtime add table public.cici_members;
alter publication supabase_realtime add table public.cici_votes;
