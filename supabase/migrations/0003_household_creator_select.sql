-- Allow the creator of a household to read it even before they are
-- inserted into household_members. Without this, `insert(...).select().single()`
-- in authService.createHousehold fails because the RETURNING row is filtered
-- out by RLS (households_member_read requires membership).

create policy "households_creator_read" on public.households
  for select using (created_by = auth.uid());
