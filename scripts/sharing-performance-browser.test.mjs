import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "@playwright/test";

const origin = process.env.TEST_ORIGIN || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : undefined);

test("mobile and desktop load one appropriately sized hero without hydration errors", { skip: !origin, timeout: 90000 }, async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, scale, expectedWidth] of [[402, 1, 640], [402, 2, 1280], [1440, 1, 1920]]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: scale });
      try {
        const page = await context.newPage();
        const heroRequests = [];
        const errors = [];
        page.on("request", request => {
          if (/\/hero-[^/]+\.(?:avif|webp|jpg|png)$/.test(new URL(request.url()).pathname)) heroRequests.push(request.url());
        });
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", message => {
          if (message.type() === "error" && /hydration|did not match|server HTML|does not recognize/i.test(message.text())) errors.push(message.text());
        });
        await page.goto(origin);
        const hero = page.locator('picture img[alt="Fitness and creative classes for adults and kids"]');
        await hero.evaluate(image => image.decode());
        await page.waitForTimeout(500);
        const image = await hero.evaluate(image => ({
          src: image.currentSrc,
          priority: image.getAttribute("fetchpriority"),
          loading: image.loading,
          width: image.getBoundingClientRect().width,
          height: image.getBoundingClientRect().height,
        }));
        assert.match(image.src, new RegExp(`/hero-${expectedWidth}\\.avif$`));
        assert.equal(image.priority, "high");
        assert.equal(image.loading, "eager");
        assert.equal(heroRequests.length, 1, JSON.stringify(heroRequests));
        assert.ok(image.width <= width && image.height > 0 && image.height <= 600);
        assert.ok(Math.abs(image.width / image.height - 3462 / 1382) < 0.01);
        assert.deepEqual(errors, []);
        for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
          assert.equal(await page.locator(selector).count(), 1);
          assert.equal(await page.locator(selector).getAttribute("content"), "https://trainn.pro/social-preview.jpg");
        }
      } finally {
        await context.close();
      }
    }
    for (const [path, mime] of [
      ["/social-preview.jpg", "image/jpeg"], ["/hero-640.avif", "image/avif"],
      ["/hero-640.webp", "image/webp"], ["/hero-640.jpg", "image/jpeg"],
    ]) {
      const response = await fetch(`${origin}${path}`);
      assert.equal(response.status, 200, path);
      assert.ok(response.headers.get("content-type")?.includes(mime), path);
    }
  } finally {
    await browser.close();
  }
});
