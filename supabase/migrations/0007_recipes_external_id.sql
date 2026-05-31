-- SwipeBite — track external recipe source IDs (e.g. "yc-mantar-sote", "r-mercimek")
-- so push-recipes-to-supabase.ts can upsert idempotently.
--
-- Postgres treats NULL as distinct in unique indexes, so multiple rows
-- without an external_id are allowed.

set check_function_bodies = off;

alter table public.recipes
  add column if not exists external_id text;

drop index if exists recipes_external_id_uidx;

create unique index if not exists recipes_external_id_uidx
  on public.recipes (external_id);
