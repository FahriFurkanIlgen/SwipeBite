-- SwipeBite — promotional / sponsored content slots managed from the Supabase
-- dashboard. Lets us add, edit, schedule and remove home-screen banners (and
-- future ad placements) WITHOUT shipping an app update: rows are read by the
-- client at runtime. Edit rows in the Supabase Table editor to manage promos.

create table if not exists public.app_promos (
  id uuid primary key default gen_random_uuid(),
  -- Where the promo is shown, e.g. 'home_banner'. Lets us add more slots later.
  placement   text not null default 'home_banner',
  overline    text,             -- small eyebrow label (e.g. "Sponsorlu")
  title       text not null,    -- main headline
  subtitle    text,             -- supporting line
  image_url   text,             -- optional background/cover image (any CDN URL)
  cta_label   text,             -- button text (e.g. "Keşfet")
  -- How a tap is handled:
  --   'route' → in-app expo-router path in action_target (e.g. '/cook-with')
  --   'url'   → external link opened in the browser
  --   'none'  → not tappable
  action_type   text not null default 'none',
  action_target text,
  bg_color    text,             -- optional hex override for card background
  text_color  text,             -- optional hex override for text
  active      boolean not null default true,
  priority    int not null default 0,   -- higher shows first
  starts_at   timestamptz,      -- optional schedule start (null = always)
  ends_at     timestamptz,      -- optional schedule end   (null = never ends)
  created_at  timestamptz not null default now(),
  constraint app_promos_action_type_chk
    check (action_type in ('route', 'url', 'none'))
);

create index if not exists app_promos_placement_active_idx
  on public.app_promos (placement, active, priority desc);

alter table public.app_promos enable row level security;

-- Anonymous + authenticated clients may read ONLY live promos (active and
-- within their optional schedule window). Writes are done from the dashboard
-- (service role), so no insert/update/delete policy is exposed to clients.
drop policy if exists "app_promos_public_read" on public.app_promos;
create policy "app_promos_public_read" on public.app_promos
  for select using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >= now())
  );
