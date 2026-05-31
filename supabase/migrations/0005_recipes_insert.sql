-- Allow authenticated users to add to the shared recipe catalog
-- (used by the Import screen). Updates/deletes still restricted to admin tools.

create policy "recipes_authenticated_insert" on public.recipes
  for insert with check (auth.role() = 'authenticated');
