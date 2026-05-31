-- SwipeBite — recipe source attribution + optional video URL.
-- Lets the app deep-link back to the original publisher (e.g. yemek.com)
-- and show a "Watch video" CTA when one is available.

alter table public.recipes
  add column if not exists source_url text,
  add column if not exists video_url text;
