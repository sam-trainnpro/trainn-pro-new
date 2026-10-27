import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";
import express from "express";
import { JSDOM } from "jsdom";
import { renderPublicDocument } from "../server/public-rendering";
import { SOCIAL_PREVIEW_IMAGE, socialPreviewImage } from "../shared/social-preview";

test("sharing images use absolute HTTP(S) URLs and a real branded fallback", async () => {
  for (const value of [undefined, null, "", " ", "javascript:alert(1)", "data:image/png;base64,abc", "/default-coach-image.jpg", "https://trainn.pro/default-package-image.jpg"]) {
    assert.equal(socialPreviewImage(value), SOCIAL_PREVIEW_IMAGE);
  }
  assert.equal(socialPreviewImage("/uploads/provider.jpg"), "https://trainn.pro/uploads/provider.jpg");
  assert.equal(socialPreviewImage("https://example.com/photo.jpg"), "https://example.com/photo.jpg");
  const jpeg = await readFile("client/public/social-preview.jpg");
  assert.equal(jpeg.subarray(0, 3).toString("hex"), "ffd8ff");
  assert.ok(jpeg.length < 250_000);
});

test("initial public HTML has exactly one OG and Twitter image, including provider and package fallbacks", async () => {
  const template = await readFile("client/index.html", "utf8");
  let data: Record<string, unknown> = {};
  const app = express();
  app.use((req, res, next) => {
    renderPublicDocument(req, res, template, async () => async () => ({
      body: "<h1>Public page</h1>",
      head: '<title>Trainn</title><meta property="og:image" content="/outdated.jpg" />',
      state: { queries: [], mutations: [] },
      listing: undefined,
    }), async () => data).catch(next);
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  try {
    for (const [path, seed, expected] of [
      ["/", {}, SOCIAL_PREVIEW_IMAGE],
      ["/coaches/1", { id: 1 }, SOCIAL_PREVIEW_IMAGE],
      ["/coaches/1", { id: 1, profileImage: "/uploads/provider.jpg" }, "https://trainn.pro/uploads/provider.jpg"],
      ["/package/1", { id: 1, packageType: "time_bound" }, SOCIAL_PREVIEW_IMAGE],
      ["/package/1", { id: 1, packageType: "time_bound", image: "https://example.com/package.jpg" }, "https://example.com/package.jpg"],
      ["/blog/test", { status: "published", featuredImage: "https://example.com/blog.jpg" }, "https://example.com/blog.jpg"],
    ] as const) {
      data = seed;
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      assert.equal(response.status, 200, path);
      const doc = new JSDOM(await response.text()).window.document;
      for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
        const tags = doc.querySelectorAll(selector);
        assert.equal(tags.length, 1, `${path}: ${selector}`);
        assert.equal(tags[0].getAttribute("content"), expected, path);
      }
      assert.equal(doc.querySelector('meta[name="twitter:card"]')?.getAttribute("content"), "summary_large_image");
      if (expected === SOCIAL_PREVIEW_IMAGE) {
        assert.equal(doc.querySelector('meta[property="og:image:width"]')?.getAttribute("content"), "1200");
        assert.equal(doc.querySelector('meta[property="og:image:height"]')?.getAttribute("content"), "630");
      }
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test("hero variants stay within transfer budgets and markup prioritizes responsive sources", async () => {
  for (const width of [640, 1280, 1920, 2560]) {
    for (const extension of ["avif", "webp", "jpg"]) {
      const asset = await stat(`client/public/hero-${width}.${extension}`);
      assert.ok(asset.size < (width <= 1280 ? 180_000 : 500_000), `${width}.${extension}: ${asset.size} bytes`);
    }
  }
  const hero = await readFile("client/src/components/home/hero-section.tsx", "utf8");
  assert.match(hero, /<picture>/);
  assert.match(hero, /type="image\/avif"/);
  assert.match(hero, /type="image\/webp"/);
  assert.match(hero, /fetchpriority: "high"/);
  assert.match(hero, /loading="eager"/);
  assert.match(hero, /width=\{3462\}/);
  assert.match(hero, /height=\{1382\}/);
  assert.ok(!hero.includes("hero-v6-no-border.png"));
});
