/**
 * Senin açık olan Chrome'una bağlanır (chrome.exe --remote-debugging-port=9222
 * ile başlatılmış olmalı; IG'ye login olmuş olmalı), her reel'i sırayla açar,
 * cover frame'in temiz `<img>` URL'ini DOM'dan okur, doğrudan tarayıcı
 * context'inden indirip `assets/influencer/<slug>.jpg` olarak yazar.
 *
 * Yeniden çalıştırmak güvenlidir — zaten dosya varsa atlar.
 *
 * Çalıştır: npx tsx scripts/scrape-influencer-via-chrome.ts
 */

import { chromium } from "playwright-core";
import { existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { INFLUENCER_RECIPES } from "../src/constants/influencerRecipes";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSET_DIR = resolve(HERE, "..", "assets", "influencer");
const CDP_URL = "http://localhost:9222";

const PER_REEL_TIMEOUT_MS = 12_000;
const POLITE_DELAY_MS = 1_200;

async function main(): Promise<void> {
  console.log(`Attaching to Chrome at ${CDP_URL} …`);
  const browser = await chromium.connectOverCDP(CDP_URL);
  const ctx = browser.contexts()[0] ?? (await browser.newContext());
  const page = await ctx.newPage();

  const recipes = INFLUENCER_RECIPES.filter((r) => !!r.sourceUrl);
  console.log(`Will visit ${recipes.length} reels.`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    const dest = resolve(ASSET_DIR, `${r.id}.jpg`);
    const prefix = `[${i + 1}/${recipes.length}] ${r.id}`;

    if (existsSync(dest)) {
      // Skip files we already have *unless* they are placeholder small ones.
      // (Length check keeps it simple — anything under 10KB is suspect.)
      const { statSync } = await import("node:fs");
      if (statSync(dest).size > 10_000) {
        console.log(`${prefix} — already saved, skip`);
        skipped++;
        continue;
      }
    }

    try {
      await page.goto(r.sourceUrl, {
        waitUntil: "domcontentloaded",
        timeout: PER_REEL_TIMEOUT_MS,
      });

      // Wait for the main video cover image to render. Reels render multiple
      // candidate posts (current + next in the auto-scroll). We want the
      // cover-frame img whose rendered position is closest to viewport
      // center, served from t51.82787-15 or t51.71878-15 with `e15_tt6`,
      // never the `_s150x150` thumbnails.
      const imgUrl = await page
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
          { timeout: PER_REEL_TIMEOUT_MS, polling: 250 },
        )
        .then((h) => h.jsonValue() as Promise<string>);

      if (!imgUrl) {
        console.log(`${prefix} — no cover img found`);
        failed++;
        continue;
      }

      // Download via Playwright's request API — it reuses page cookies and
      // skips the CORS check that blocks an in-page fetch().
      const resp = await page.request.get(imgUrl, {
        headers: { Referer: "https://www.instagram.com/" },
      });
      if (!resp.ok()) {
        console.log(`${prefix} — http ${resp.status()}`);
        failed++;
        continue;
      }
      const bytes = await resp.body();
      if (bytes.length < 5_000) {
        console.log(`${prefix} — tiny image (${bytes.length} B), skip`);
        failed++;
        continue;
      }
      writeFileSync(dest, bytes);
      console.log(`${prefix} — saved (${bytes.length} B)`);
      ok++;
    } catch (err) {
      console.log(
        `${prefix} — error: ${(err as Error).message.split("\n")[0]}`,
      );
      failed++;
    }

    await new Promise((res) => setTimeout(res, POLITE_DELAY_MS));
  }

  console.log(
    `\nDone. saved=${ok}  skipped=${skipped}  failed=${failed}  total=${recipes.length}`,
  );
  await page.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
