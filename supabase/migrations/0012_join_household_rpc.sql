-- Join a household by invite code.
--
-- Problem: a user joining a household by code is not yet a member, so the
-- RLS policies on `public.households` (households_member_read /
-- households_creator_read) filter the row out — the lookup by invite_code
-- returns nothing and the client reports "Kod bulunamadı".
--
-- Fix: expose a SECURITY DEFINER RPC that looks up the household by code,
-- inserts the caller as a member, and returns the household row. This mirrors
-- the `join_cici_session` pattern and only exposes households to someone who
-- already knows the exact invite code.

set check_function_bodies = off;

create or replace function public.join_household_by_invite_code(p_code text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.households;
begin
  select * into h
    from public.households
    where upper(invite_code) = upper(p_code)
    limit 1;

  if h.id is null then
    raise exception 'household_not_found' using errcode = 'P0001';
  end if;

  insert into public.household_members (household_id, user_id, role)
    values (h.id, auth.uid(), 'member')
    on conflict (household_id, user_id) do nothing;

  return h;
end;
$$;

grant execute on function public.join_household_by_invite_code(text) to authenticated;
