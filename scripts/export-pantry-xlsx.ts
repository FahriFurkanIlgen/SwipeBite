/* eslint-disable no-console */
/**
 * Exports every row in public.pantry_items to an Excel workbook so the
 * catalogue can be reviewed and re-categorised by hand.
 *
 *   npx tsx scripts/export-pantry-xlsx.ts
 *
 * Required env (loaded from .env automatically):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (preferred — bypasses RLS, sees all households)
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY (fallback — only works for the signed-in user;
 *                                   here we're not signed in, so RLS will return 0 rows)
 *
 * Output: ./pantry-items.xlsx in the workspace root.
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import * as XLSX from "xlsx";

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const key = serviceKey ?? anonKey;

if (!url || !key) {
  console.error(
    "✗ EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY) must be set in .env",
  );
  process.exit(1);
}

if (!serviceKey) {
  console.warn(
    "⚠ SUPABASE_SERVICE_ROLE_KEY not set — using anon key. RLS will likely return 0 rows.",
  );
}

type PantryRow = {
  id: string;
  household_id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  expires_at: string | null;
  created_at: string;
};

async function main() {
  // Hit PostgREST directly — supabase-js pulls in realtime which needs `ws`
  // on Node <22.
  const pageSize = 1000;
  let from = 0;
  const all: PantryRow[] = [];
  const select =
    "id,household_id,name,quantity,category,expires_at,created_at";

  for (;;) {
    const to = from + pageSize - 1;
    const res = await fetch(
      `${url}/rest/v1/pantry_items?select=${select}&order=created_at.asc`,
      {
        headers: {
          apikey: key!,
          Authorization: `Bearer ${key!}`,
          Range: `${from}-${to}`,
          "Range-Unit": "items",
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) {
      console.error("✗ Supabase error:", res.status, await res.text());
      process.exit(1);
    }
    const data = (await res.json()) as PantryRow[];
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  if (all.length === 0) {
    console.warn("⚠ No pantry rows returned. Check your key / RLS.");
  }

  const rows = all.map((r, i) => ({
    "#": i + 1,
    ID: r.id,
    Hane: r.household_id,
    Ürün: r.name,
    Miktar: r.quantity ?? "",
    Kategori: r.category ?? "",
    "Son Kullanma": r.expires_at ?? "",
    Eklendi: r.created_at,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 38 },
    { wch: 38 },
    { wch: 30 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kiler");

  const outPath = resolve(process.cwd(), "pantry-items.xlsx");
  XLSX.writeFile(wb, outPath);

  console.log(`✓ ${all.length} kiler kaydı yazıldı → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
