-- 0010_profiles_alcohol_flag.sql
-- Adds an opt-in flag for the Bar (cocktail) feature on user profiles.
--
-- - NULL  → user has not yet been asked (show age gate on first Bar tab tap)
-- - TRUE  → user confirmed they are 18+ and wants to see alcoholic content
-- - FALSE → user actively declined; the Bar tab is hidden client-side
--
-- The column is nullable on purpose so existing users default to the
-- "not asked yet" state and get the age gate naturally on their next
-- Bar tab interaction.

alter table public.profiles
  add column if not exists alcohol_content_enabled boolean;
