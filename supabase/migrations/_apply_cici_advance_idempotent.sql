-- Patch: make advance_cici_round properly idempotent.
--
-- Bug: advance_cici_round did not change current_round or status, so a second
-- concurrent caller (e.g. timer expiring on multiple devices) would re-run
-- the tally. By that point round_left_id / round_right_id had been NULLed
-- out, every count came back as 0, the function saw a tie and rolled a
-- random winner — overwriting the correct one.
--
-- Fix: bail out early if round_left_id is already null (round already
-- tallied). This is safe because the first writer always nulls those out
-- inside the same SELECT … FOR UPDATE transaction.

create or replace function public.advance_cici_round(
  p_session_id uuid,
  p_round int
) returns text
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

  -- Already advanced — no-op. Three cases:
  --  1. round number changed (next round already started)
  --  2. status no longer voting
  --  3. round_left_id already nulled out (tallied this round but next round
  --     hasn't started yet — earlier we re-ran the tally on a null pair
  --     which produced 0-0 and a random tiebreak winner).
  if s.current_round <> p_round then return s.current_winner_id; end if;
  if s.status <> 'voting' then return s.current_winner_id; end if;
  if s.round_left_id is null or s.round_right_id is null then
    return s.current_winner_id;
  end if;

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
