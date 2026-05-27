-- SwipeBite — open recipe catalogue to anonymous reads.
-- The recipes table contains only public, shared content (titles,
-- ingredients, steps). Limiting it to authenticated sessions blocks
-- the unauthenticated demo flow, so relax it to allow `anon` selects.

set check_function_bodies = off;

drop policy if exists "recipes_authenticated_read" on public.recipes;

create policy "recipes_public_read" on public.recipes
  for select using (true);
