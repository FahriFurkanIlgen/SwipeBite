/**
 * Verilen Instagram hesaplarının /reels gridini açar, en çok izlenen
 * 10 reel'i toplar, her reel'i tek tek ziyaret edip caption + cover frame
 * URL'ini çıkarır, cover'ı `assets/influencer/<slug>.jpg` olarak indirir,
 * ham veriyi `scripts/data/scraped-reels.json`'a yazar.
 *
 * Yapılandırılmış tarif (malzeme/adım) çıkarımı bu script'te YAPILMAZ —
 * onu `scripts/structure-scraped-reels.ts` halleder.
 *
 * Önce Chrome'u remote-debug modda aç ve IG'ye login ol:
 *   & "C:\Program Files\Google\Chrome\Application\chrome.exe" `
 *     --remote-debugging-port=9222 --user-data-dir="$env:TEMP\ig-scrape"
 *
 * Sonra:  npx tsx scripts/scrape-instagram-popular.ts
 */

import { chromium, type Page } from "playwright-core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const ASSET_DIR = resolve(ROOT, "assets", "influencer");
const DATA_DIR = resolve(HERE, "data");
const OUT_JSON = resolve(DATA_DIR, "scraped-reels.json");
const CDP_URL = "http://localhost:9222";

const HANDLES = [
  "mishlencan",
  "zeyythecooky",
  "duruikiz",
  "begum.mici",
  "emirelidemir",
  "chefsadikkilic",
  "sercantoptan",
];

const TOP_N = 10;
// Hesap başına max kaç reel'i tarayalım — yeterince scroll edip view sayısı
// görünenleri toplamak için.
const MIN_REELS_PER_HANDLE = 18;
const REEL_OPEN_TIMEOUT_MS = 12_000;
const POLITE_DELAY_MS = 1_200;

interface ScrapedReel {
  handle: string;
  reelCode: string;
  slug: string;
  sourceUrl: string;
  viewsRaw: string;
  viewCount: number; // normalized
  caption: string;
  imageFile: string; // relative to repo root (assets/influencer/<slug>.jpg)
  scrapedAt: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Parse Turkish/English IG view shortcuts: "16,3 Mn", "1,2 Mn", "460 B",
// "1.2M", "12.3K". Returns approximate view count.
function parseViewCount(raw: string): number {
  const s = raw.trim().toLowerCase().replace(",", ".").replace(/\s+/g, " ");
  const match = s.match(/^([\d.]+)\s*(mn|m|b|k)?\b/);
  if (!match) return 0;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = match[2];
  switch (unit) {
    case "mn":
    case "m":
      return Math.round(n * 1_000_000);
    case "b": // Turkish "Bin" = thousand
    case "k":
      return Math.round(n * 1_000);
    default:
      return Math.round(n);
  }
}

async function autoScroll(page: Page, target: number): Promise<void> {
  const maxIterations = 20;
  for (let i = 0; i < maxIterations; i++) {
    const count = await page.evaluate(
      () => document.querySelectorAll('a[href*="/reel/"]').length,
    );
    if (count >= target) return;
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
    await page.waitForTimeout(900);
  }
}

interface ReelGridEntry {
  url: string;
  reelCode: string;
  viewsRaw: string;
  viewCount: number;
}

async function scrapeReelsGrid(
  page: Page,
  handle: string,
): Promise<ReelGridEntry[]> {
  await page.goto(`https://www.instagram.com/${handle}/reels/`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(1500);
  await autoScroll(page, MIN_REELS_PER_HANDLE);
  const raw = await page.evaluate(() => {
    const out: { url: string; text: string }[] = [];
    const seen = new Set<string>();
    for (const a of Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href*="/reel/"]'),
    )) {
      if (seen.has(a.href)) continue;
      seen.add(a.href);
      out.push({
        url: a.href,
        text: a.innerText.replace(/\s+/g, " ").trim(),
      });
    }
    return out;
  });
  const entries: ReelGridEntry[] = [];
  for (const r of raw) {
    const codeMatch = r.url.match(/\/reel\/([^/?#]+)/);
    if (!codeMatch) continue;
    entries.push({
      url: `https://www.instagram.com/reel/${codeMatch[1]}/`,
      reelCode: codeMatch[1],
      viewsRaw: r.text,
      viewCount: parseViewCount(r.text),
    });
  }
  // Sort desc by views, take top N.
  entries.sort((a, b) => b.viewCount - a.viewCount);
  return entries.slice(0, TOP_N);
}

async function scrapeReel(
  page: Page,
  url: string,
): Promise<{ caption: string; imageUrl: string } | null> {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: REEL_OPEN_TIMEOUT_MS,
  });
  // Cover frame: largest e15_tt6 image closest to viewport center.
  const imageUrl = await page
    .waitForFunction(
      () => {
        const imgs = Array.from(
          document.querySelectorAll("img"),
        ) as HTMLImageElement[];
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        let best: { src: string; dist: number } | null = null;
        for (const img of imgs) {
          const src = img.src;
          if (!src) continue;
          if (!/t51\.(82787|71878)-15/.test(src)) continue;
          if (src.includes("_s150x150")) continue;
          const area = img.naturalWidth * img.naturalHeight;
          if (area < 100_000) continue;
          const r = img.getBoundingClientRect();
          if (r.width < 200 || r.height < 200) continue;
          const dx = r.left + r.width / 2 - cx;
          const dy = r.top + r.height / 2 - cy;
          const dist = Math.hypot(dx, dy);
          if (!best || dist < best.dist) best = { src, dist };
        }
        return best ? best.src : null;
      },
      { timeout: REEL_OPEN_TIMEOUT_MS, polling: 250 },
    )
    .then((h) => h.jsonValue() as Promise<string>)
    .catch(() => "");
  if (!imageUrl) return null;

  // Caption: prefer <meta property="og:description">. Fallback to article h1 dialog text.
  const caption = await page.evaluate(() => {
    const og = document
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content");
    if (og && og.length > 30) return og;
    const tw = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");
    return tw ?? "";
  });

  return { caption, imageUrl };
}

async function downloadImage(
  page: Page,
  url: string,
  dest: string,
): Promise<boolean> {
  try {
    const resp = await page.request.get(url, {
      headers: { Referer: "https://www.instagram.com/" },
    });
    if (!resp.ok()) return false;
    const buf = await resp.body();
    if (buf.length < 5_000) return false;
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  if (!existsSync(ASSET_DIR)) mkdirSync(ASSET_DIR, { recursive: true });
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  // Resume support: skip handles already represented in the JSON.
  let existing: ScrapedReel[] = [];
  if (existsSync(OUT_JSON)) {
    try {
      existing = JSON.parse(readFileSync(OUT_JSON, "utf8"));
    } catch {}
  }

  const browser = await chromium.connectOverCDP(CDP_URL);
  const ctx = browser.contexts()[0] ?? (await browser.newContext());
  const page = await ctx.newPage();

  const all: ScrapedReel[] = [...existing];

  for (const handle of HANDLES) {
    const haveForHandle = existing.filter((r) => r.handle === handle).length;
    if (haveForHandle >= TOP_N) {
      console.log(`@${handle} — already have ${haveForHandle} reels, skip`);
      continue;
    }

    console.log(`\n@${handle} — collecting reels grid …`);
    let topReels: ReelGridEntry[];
    try {
      topReels = await scrapeReelsGrid(page, handle);
    } catch (err) {
      console.log(`  grid error: ${(err as Error).message.split("\n")[0]}`);
      continue;
    }
    console.log(`  top ${topReels.length} by views.`);

    for (let i = 0; i < topReels.length; i++) {
      const r = topReels[i];
      const slug = `ig-${handle.replace(/\./g, "-")}-${r.reelCode.toLowerCase()}`;
      const imagePath = resolve(ASSET_DIR, `${slug}.jpg`);
      const relImage = `assets/influencer/${slug}.jpg`;

      if (all.some((x) => x.slug === slug)) {
        console.log(`  [${i + 1}/${topReels.length}] ${slug} — already saved`);
        continue;
      }

      process.stdout.write(
        `  [${i + 1}/${topReels.length}] ${r.reelCode} (${r.viewsRaw}) … `,
      );

      const reel = await scrapeReel(page, r.url).catch(() => null);
      if (!reel) {
        console.log("no cover/caption — skip");
        continue;
      }
      const ok = await downloadImage(page, reel.imageUrl, imagePath);
      if (!ok) {
        console.log("download failed — skip");
        continue;
      }
      const entry: ScrapedReel = {
        handle,
        reelCode: r.reelCode,
        slug,
        sourceUrl: r.url,
        viewsRaw: r.viewsRaw,
        viewCount: r.viewCount,
        caption: reel.caption,
        imageFile: relImage,
        scrapedAt: new Date().toISOString(),
      };
      all.push(entry);
      // Persist incrementally.
      writeFileSync(OUT_JSON, JSON.stringify(all, null, 2), "utf8");
      console.log(`saved (${(reel.imageUrl.length / 1).toFixed(0)}…)`);
      await new Promise((res) => setTimeout(res, POLITE_DELAY_MS));
    }
  }

  console.log(`\nTotal scraped: ${all.length}`);
  console.log(`Wrote ${OUT_JSON}`);
  await page.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
