/**
 * Bir Instagram profilinin /reels grid'inde ne tür veri çıkarabiliyoruz?
 * Like sayısı görünür mü, yoksa view mi?
 */
import { chromium } from "playwright-core";

async function main() {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const ctx = browser.contexts()[0]!;
  const page = await ctx.newPage();
  await page.goto("https://www.instagram.com/mishlencan/reels/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(4000);
  const data = await page.evaluate(() => {
    const out: Array<{ href: string; text: string; img: string | null }> = [];
    const links = Array.from(
      document.querySelectorAll('a[href*="/reel/"]'),
    ) as HTMLAnchorElement[];
    for (const a of links) {
      out.push({
        href: a.href,
        text: a.innerText.replace(/\s+/g, " ").trim(),
        img: a.querySelector("img")?.getAttribute("src")?.slice(0, 100) ?? null,
      });
    }
    return out.slice(0, 5);
  });
  console.log(JSON.stringify(data, null, 2));
  await page.close();
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
