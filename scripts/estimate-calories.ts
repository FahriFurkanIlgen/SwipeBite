/**
 * Estimate `caloriesPerServing` for every Recipe in:
 *   - src/constants/yemekcomRecipes.ts (YEMEKCOM_RECIPES)
 *   - src/constants/mockRecipes.ts (CURATED_RECIPES)
 *
 * Uses OpenAI batch chat completions (20 recipes per call, parallel-limited).
 * Skips recipes that already have a `caloriesPerServing` value.
 *
 * Run:
 *   npx tsx scripts/estimate-calories.ts
 *   npx tsx scripts/estimate-calories.ts --file yemekcom   # only one file
 *   npx tsx scripts/estimate-calories.ts --limit 50        # debug, first 50
 *
 * Cost estimate (gpt-4o-mini, 2026 prices):
 *   1500 recipes / 20 per batch = 75 calls
 *   ~1.5k tokens in / 0.5k tokens out per call
 *   ≈ $0.15 - $0.30 total
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { config as dotenv } from "dotenv";

dotenv({ path: path.join(__dirname, "..", ".env") });

const API_KEY =
  process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Missing OPENAI_API_KEY (or EXPO_PUBLIC_OPENAI_API_KEY).");
  process.exit(1);
}

const MODEL = "gpt-4o-mini";
const BATCH_SIZE = 20;
const PARALLEL = 4;

const argv = process.argv.slice(2);
const onlyFile = (() => {
  const i = argv.indexOf("--file");
  return i >= 0 ? argv[i + 1] : null;
})();
const limit = (() => {
  const i = argv.indexOf("--limit");
  return i >= 0 ? Number(argv[i + 1]) : Infinity;
})();
const dryRun = argv.includes("--dry");

interface Recipe {
  id: string;
  title: string;
  servings: number;
  ingredients: { name: string; quantity?: string }[];
  caloriesPerServing?: number;
  [k: string]: unknown;
}

interface FileTarget {
  key: string;
  filePath: string;
  exportName: string;
}

const TARGETS: FileTarget[] = [
  {
    key: "yemekcom",
    filePath: path.join(
      __dirname,
      "..",
      "src",
      "constants",
      "yemekcomRecipes.ts",
    ),
    exportName: "YEMEKCOM_RECIPES",
  },
  {
    key: "mock",
    filePath: path.join(__dirname, "..", "src", "constants", "mockRecipes.ts"),
    exportName: "CURATED_RECIPES",
  },
];

function loadRecipes(t: FileTarget): {
  src: string;
  arrText: string;
  recipes: Recipe[];
} {
  const src = fs.readFileSync(t.filePath, "utf8");
  // Find `export const NAME ... = [` ... matching closing `];`
  const re = new RegExp(
    `export\\s+const\\s+${t.exportName}\\s*:\\s*Recipe\\[\\]\\s*=\\s*(\\[[\\s\\S]*?\\n\\]);`,
    "m",
  );
  const m = src.match(re);
  if (!m)
    throw new Error(`Could not locate ${t.exportName} array in ${t.filePath}`);
  const arrText = m[1];
  // Use Function to parse the JSON-ish TS array. The recipe data is plain JSON
  // shape (string keys, JSON values); Function eval is safe enough since the
  // source file is our own.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const recipes = new Function(`return ${arrText};`)() as Recipe[];
  return { src, arrText, recipes };
}

function saveRecipes(
  t: FileTarget,
  src: string,
  arrText: string,
  updated: Recipe[],
) {
  const newArrText = JSON.stringify(updated, null, 2);
  const idx = src.indexOf(arrText);
  if (idx < 0) throw new Error(`Could not find array text in ${t.filePath}`);
  const next = src.slice(0, idx) + newArrText + src.slice(idx + arrText.length);
  fs.writeFileSync(t.filePath, next, "utf8");
}

interface BatchEntry {
  id: string;
  title: string;
  servings: number;
  ingredients: string[];
}

async function callOpenAI(
  batch: BatchEntry[],
): Promise<Record<string, number>> {
  const sys = `Sen bir Türk mutfağı uzmanısın ve diyetisyensin. Sana verilen tarifler için porsiyon başına yaklaşık kalori değerini tahmin et. Sadece JSON döndür, başka açıklama yapma. Format:
{"results":[{"id":"...","kcal":520},{"id":"...","kcal":280}]}
Tüm tariflere mutlaka bir kcal değeri ver (50-2000 arası tam sayı).`;
  const user = `Tarifler:\n${batch
    .map(
      (b) =>
        `- id: ${b.id}\n  başlık: ${b.title}\n  porsiyon: ${b.servings}\n  malzemeler: ${b.ingredients.slice(0, 20).join("; ")}`,
    )
    .join("\n\n")}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = json.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as {
    results?: { id: string; kcal: number }[];
  };
  const out: Record<string, number> = {};
  for (const r of parsed.results ?? []) {
    if (typeof r.kcal === "number" && r.kcal > 0) {
      out[r.id] = Math.round(r.kcal);
    }
  }
  return out;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function processTarget(t: FileTarget) {
  console.log(`\n=== ${t.key} (${t.exportName}) ===`);
  const { src, arrText, recipes } = loadRecipes(t);
  console.log(`  loaded: ${recipes.length} recipes`);

  const todo = recipes
    .filter((r) => typeof r.caloriesPerServing !== "number")
    .slice(0, limit);
  console.log(
    `  to estimate: ${todo.length} (skip ${recipes.length - todo.length} already done)`,
  );

  if (todo.length === 0) return;

  const entries: BatchEntry[] = todo.map((r) => ({
    id: r.id,
    title: r.title,
    servings: r.servings ?? 1,
    ingredients: r.ingredients.map((i) => i.name),
  }));

  const batches = chunk(entries, BATCH_SIZE);
  console.log(
    `  batches: ${batches.length} × ${BATCH_SIZE} (parallel ${PARALLEL})`,
  );

  const results: Record<string, number> = {};
  let done = 0;

  // Simple parallel worker pool
  let cursor = 0;
  async function worker() {
    while (cursor < batches.length) {
      const i = cursor++;
      const batch = batches[i];
      try {
        const r = await callOpenAI(batch);
        Object.assign(results, r);
        done++;
        process.stdout.write(
          `  [${done}/${batches.length}] +${Object.keys(r).length} kcal\r`,
        );
      } catch (e) {
        console.error(`\n  batch ${i} failed:`, (e as Error).message);
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, () => worker()));
  console.log(`\n  collected: ${Object.keys(results).length} / ${todo.length}`);

  if (dryRun) {
    console.log(
      `  --dry: not writing. Sample:`,
      Object.entries(results).slice(0, 5),
    );
    return;
  }

  // Apply
  let applied = 0;
  for (const r of recipes) {
    const k = results[r.id];
    if (typeof k === "number") {
      r.caloriesPerServing = k;
      applied++;
    }
  }
  console.log(`  applied: ${applied}`);
  saveRecipes(t, src, arrText, recipes);
  console.log(`  ✓ wrote ${t.filePath}`);
}

async function main() {
  const targets = onlyFile
    ? TARGETS.filter((t) => t.key === onlyFile)
    : TARGETS;
  if (targets.length === 0) {
    console.error(
      `No target matches --file ${onlyFile}. Options: yemekcom, mock`,
    );
    process.exit(1);
  }
  for (const t of targets) {
    await processTarget(t);
  }
  console.log("\n✓ Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
