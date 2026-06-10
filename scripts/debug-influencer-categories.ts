/* eslint-disable no-console */
import { INFLUENCER_RECIPES } from "../src/constants/influencerRecipes";
import {
  categorizeInfluencerRecipe,
  countByCategory,
  INFLUENCER_CATEGORY_LABEL,
} from "../src/features/recipes/influencerCategories";

const counts = countByCategory(INFLUENCER_RECIPES);
console.log(`Total: ${INFLUENCER_RECIPES.length}`);
for (const [cat, n] of Object.entries(counts)) {
  console.log(
    `  ${cat.padEnd(14)} ${INFLUENCER_CATEGORY_LABEL[cat as keyof typeof INFLUENCER_CATEGORY_LABEL].padEnd(14)} ${n}`,
  );
}

// Show the first 3 recipes per category to sanity-check classification.
const buckets: Record<string, string[]> = {};
for (const r of INFLUENCER_RECIPES) {
  const c = categorizeInfluencerRecipe(r);
  (buckets[c] ??= []).push(r.title);
}
for (const [cat, titles] of Object.entries(buckets)) {
  console.log(`\n${cat}:`);
  for (const t of titles.slice(0, 4)) console.log(`  - ${t}`);
}

// Inspect içecek (drink) bucket fully — flagged a few suspicious entries.
console.log("\n--- icecek detail ---");
for (const r of INFLUENCER_RECIPES) {
  if (categorizeInfluencerRecipe(r) === "icecek") {
    console.log(`id: ${r.id}`);
    console.log(`  title: ${r.title}`);
    console.log(`  tags : ${JSON.stringify(r.tags)}`);
  }
}
