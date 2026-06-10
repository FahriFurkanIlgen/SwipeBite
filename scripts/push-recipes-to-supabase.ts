/* eslint-disable no-console */
/**
 * Pushes the bundled recipe catalogue (MOCK_RECIPES) into public.recipes so
 * the app can run in "live" mode (real UUIDs → realtime sessions, lobby and
 * the multi-person waiting room all work).
 *
 *   npx tsx scripts/push-recipes-to-supabase.ts
 *
 * Idempotent: upserts on the `external_id` unique index (the catalogue slug
 * id like "r-mercimek"), so re-running updates existing rows instead of
 * creating duplicates.
 *
 * Required env (loaded from .env automatically):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (bypasses RLS — required to write)
 */
import { config as loadEnv } from "dotenv";
import { MOCK_RECIPES } from "../src/constants/mockRecipes";

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "✗ EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env",
  );
  process.exit(1);
}

interface RecipePayload {
  external_id: string;
  title: string;
  description: string;
  image_url: string;
  prep_time_minutes: number;
  difficulty: string;
  servings: number;
  ingredients: { name: string; quantity?: string }[];
  steps: string[];
  tags: string[];
  cuisine: string;
  source_url: string | null;
  video_url: string | null;
}

function toPayload(r: (typeof MOCK_RECIPES)[number]): RecipePayload {
  return {
    external_id: r.id,
    title: r.title,
    description: r.description ?? "",
    image_url: r.imageUrl ?? "",
    prep_time_minutes: r.prepTimeMinutes ?? 0,
    difficulty: r.difficulty,
    servings: r.servings ?? 1,
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
    tags: r.tags ?? [],
    cuisine: r.cuisine ?? "",
    source_url: r.sourceUrl ?? null,
    video_url: r.videoUrl ?? null,
  };
}

async function pushBatch(batch: RecipePayload[]): Promise<void> {
  // Upsert on the external_id unique index. PostgREST merges duplicates when
  // told to resolve on that conflict target.
  const res = await fetch(`${url}/rest/v1/recipes?on_conflict=external_id`, {
    method: "POST",
    headers: {
      apikey: serviceKey!,
      Authorization: `Bearer ${serviceKey!}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  const payloads = MOCK_RECIPES.map(toPayload);
  const chunkSize = 200;
  let pushed = 0;

  for (let i = 0; i < payloads.length; i += chunkSize) {
    const batch = payloads.slice(i, i + chunkSize);
    await pushBatch(batch);
    pushed += batch.length;
    console.log(`  …${pushed}/${payloads.length}`);
  }

  console.log(`✓ Upserted ${pushed} recipes into public.recipes`);
}

main().catch((err) => {
  console.error("✗ Push failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
