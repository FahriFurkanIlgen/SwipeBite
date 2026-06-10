/**
 * Bağlanılan Chrome'da tek bir reel açar ve sayfadaki tüm büyük img'leri
 * (boyut + url) listeler. Hangi selektörü kullanacağımıza karar vermek için.
 */
import { chromium } from "playwright-core";

async function main() {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const ctx = browser.contexts()[0]!;
  const page = await ctx.newPage();
  await page.goto("https://www.instagram.com/reel/DZCxgTltQ0I/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    const out: Array<{
      nw: number;
      nh: number;
      cw: number;
      ch: number;
      src: string;
      parentSel: string;
    }> = [];
    for (const img of Array.from(document.querySelectorAll("img"))) {
      if (!img.src) continue;
      out.push({
        nw: img.naturalWidth,
        nh: img.naturalHeight,
        cw: img.clientWidth,
        ch: img.clientHeight,
        src: img.src.slice(0, 160),
        parentSel:
          (img.parentElement?.tagName ?? "") +
          (img.parentElement?.className
            ? "." + String(img.parentElement.className).slice(0, 60)
            : ""),
      });
    }
    return { url: location.href, count: out.length, imgs: out };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.close();
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
