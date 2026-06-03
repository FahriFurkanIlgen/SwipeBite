-- Cici Boğaz patches (run in SQL Editor)
-- 1) auto-add creator as member when a session is created.
-- 2) Allow `start_cici_round` to be called by anyone in the session,
--    not just the creator (so the round can start when timer expires
--    on someone else's device too).

create or replace function public.cici_add_creator_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_name text;
begin
  -- Pull a name from auth.users if available; fall back to a stub.
  select u.email, coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name')
    into v_email, v_name
    from auth.users u
    where u.id = NEW.created_by;

  insert into public.cici_members (session_id, user_id, name, avatar_url)
    values (
      NEW.id,
      NEW.created_by,
      coalesce(nullif(v_name, ''), split_part(coalesce(v_email, 'Sen'), '@', 1)),
      null
    )
    on conflict (session_id, user_id) do nothing;

  return NEW;
end;
$$;

drop trigger if exists trg_cici_add_creator on public.cici_sessions;
create trigger trg_cici_add_creator
  after insert on public.cici_sessions
  for each row
  execute function public.cici_add_creator_as_member();

-- Allow non-creator members to start a round (e.g. when timer expires).
-- We only enforce membership.
create or replace function public.start_cici_round(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  s public.cici_sessions%rowtype;
  v_left text; v_right text; v_idx int;
begin
  select * into s from public.cici_sessions where id = p_session_id for update;
  if s.id is null then raise exception 'session_not_found'; end if;
  if not public.is_cici_member(p_session_id) then
    raise exception 'not_member';
  end if;

  -- If the round is already initialised (left+right set), no-op.
  if s.round_left_id is not null and s.round_right_id is not null
     and s.status = 'voting' then
    return;
  end if;

  v_idx := s.deck_index;
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
      update public.cici_sessions
        set status = 'completed', winner_item_id = s.current_winner_id,
            round_left_id = null, round_right_id = null, round_started_at = null
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
