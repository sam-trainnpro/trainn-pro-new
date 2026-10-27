import assert from "node:assert/strict";
import test from "node:test";
import { isSupportedLanding, cities, ageGroups, categories, generateBreadcrumbSchema } from "../client/src/lib/seo-config";
import { staticPublicPaths, publicLandingPaths, resolvePublicRoute, indexableStaticPaths } from "../shared/public-routes";
import { buildSitemap } from "../server/sitemap";
import { JSDOM } from "jsdom";
import express from "express";
import { renderPublicDocument } from "../server/public-rendering";
import { isPublicClass } from "../shared/public-availability";

test("every supported city, age and category resolves, but arbitrary slugs do not", () => {
  assert.equal(publicLandingPaths().length, Object.keys(cities).length * Object.keys(ageGroups).length * (Object.keys(categories).length + 1));
  for (const path of [...staticPublicPaths, ...publicLandingPaths()]) {
    assert.equal(resolvePublicRoute(path).kind, "public", path);
  }
  for (const path of [
    "/classes/sanfrancisco/kids/unknown", "/classes/nope/kids/soccer",
    "/classes/sanfrancisco/nope", "/classes/sanfrancisco/kids/__proto__",
    "/classes/sanfrancisco/kids/toString", "/not-a-page", "/classes/12extra",
    "/coaches/not-a-number", "/seo-pages/test",
  ]) assert.equal(resolvePublicRoute(path).kind, "not-found", path);
  assert.equal(isSupportedLanding("sanfrancisco", "kids", "bogus"), false);
  assert.deepEqual(generateBreadcrumbSchema("sanfrancisco", "kids", "bogus"), {});
});

test("aliases redirect, and all required account routes remain client-rendered", () => {
  assert.deepEqual(resolvePublicRoute("/class/42"), { kind: "redirect", to: "/classes/42" });
  assert.deepEqual(resolvePublicRoute("/packages"), { kind: "redirect", to: "/classes" });
  assert.deepEqual(resolvePublicRoute("/seo-pages/outdoor-workouts-san-francisco"), { kind: "redirect", to: "/outdoor-workouts-san-francisco" });
  for (const path of ["/auth", "/register", "/profile", "/admin", "/checkout/1", "/edit-class/1", "/package/1/purchase", "/blog/admin", "/blog/admin/create", "/blog/admin/edit/1"]) {
    assert.equal(resolvePublicRoute(path).kind, "private", path);
  }
  assert.equal(resolvePublicRoute("/blog/admin/anything").kind, "not-found");
});

test("cancelled and deleted class documents return a non-indexable 404 without exposing their data", async () => {
  assert.equal(isPublicClass({ status: "active" }), true);
  for (const status of ["cancelled", "deleted"]) {
    assert.equal(isPublicClass({ status }), false);
    const app = express();
    app.use((req, res, next) => {
      renderPublicDocument(req, res, '<html><head></head><body><div id="root"></div></body></html>',
        async () => async (_url, notFound, _getData, seed) => {
          assert.equal(notFound, true, status);
          assert.equal(seed, undefined, status);
          return {
            body: "<h1>404 Page Not Found</h1>",
            head: '<title>Page Not Found | Trainn</title><meta name="robots" content="noindex, follow" />',
            state: { queries: [], mutations: [] },
            listing: undefined,
          };
        },
        async () => ({ id: 7, status, title: "Unavailable class title" }),
      ).catch(next);
    });
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    try {
      const address = server.address() as { port: number };
      const response = await fetch(`http://127.0.0.1:${address.port}/classes/7`);
      const html = await response.text();
      assert.equal(response.status, 404, status);
      assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
      assert.ok(!html.includes("Unavailable class title"));
      assert.ok(!html.includes('rel="canonical"'));
      assert.match(html, /404 Page Not Found/);
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  }
});

test("sitemap uses the public inventory and published/available content only", () => {
  const xml = buildSitemap({
    classes: [{ id: 1, status: "active", createdAt: "2026-01-01" }, { id: 2, status: "deleted", createdAt: null }, { id: 7, status: "cancelled", createdAt: "2026-01-01" }],
    coaches: [{ id: 3, isApproved: true }, { id: 4, isApproved: false }],
    posts: [{ slug: "article&one", status: "published", updatedAt: "2026-02-03" }, { slug: "draft", status: "draft" }],
    packages: [{ id: 5, packageType: "time_bound", status: "enabled", isActive: true }, { id: 6, packageType: "time_bound", status: "disabled", isActive: true }],
  });
  const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document;
  const paths = [...doc.querySelectorAll("loc")].map(node => new URL(node.textContent!).pathname);
  for (const path of indexableStaticPaths()) assert.ok(paths.includes(path), path);
  assert.ok(paths.includes("/blog/article%26one"));
  for (const path of ["/auth", "/register", "/packages", "/success-stories", "/kids-drop-in-sports", "/kids-soccer-classes-san-francisco", "/outdoor-yoga-san-francisco", "/kids-drop-in-activities", "/easy-to-book-personal-trainers", "/classes/2", "/classes/7", "/coaches/4", "/blog/draft", "/package/6"]) assert.ok(!paths.includes(path), path);
  assert.ok(xml.includes("2026-02-03"));
});

const origin = process.env.TEST_ORIGIN || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : undefined);
test("live documents contain content, canonical metadata, JSON-LD and hydration data without JavaScript", { skip: !origin, timeout: 180000 }, async () => {
  const get = async (path: string) => {
    const response = await fetch(`${origin}${path}`, { redirect: "manual" });
    return { response, doc: new JSDOM(await response.text()).window.document };
  };
  const [classes, coaches, posts, packages] = await Promise.all(
    ["/api/classes", "/api/coaches", "/api/blog", "/api/packages/all"].map(async path => (await fetch(`${origin}${path}`)).json()),
  );
  const routes = [
    "/", "/classes", "/coaches", "/blog", "/about", "/privacy", "/terms", "/landing-pages", "/plans",
    "/classes/sanfrancisco/kids", "/classes/losangeles/adults/yoga", "/classes/sanfrancisco/adults/workouts",
    "/outdoor-workouts-san-francisco", "/kids-drop-in-sports-classes-san-francisco", "/kids-after-school-activities-san-francisco",
  ];
  if (classes[0]) routes.push(`/classes/${classes[0].id}`);
  if (coaches[0]) routes.push(`/coaches/${coaches[0].id}`);
  if (posts[0]) routes.push(`/blog/${posts[0].slug}`);
  const pkg = packages.find((item: any) => item.packageType === "time_bound" && item.status === "enabled");
  if (pkg) routes.push(`/package/${pkg.id}`);
  for (const path of routes) {
    const { response, doc } = await get(path);
    assert.equal(response.status, 200, path);
    assert.ok(doc.querySelector("h1")?.textContent?.trim(), `Heading: ${path}`);
    assert.ok((doc.querySelector("#root")?.textContent?.length || 0) > 150, `Body: ${path}`);
    assert.ok(doc.querySelector("#root a[href]"), `Links: ${path}`);
    assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1, path);
    const canonical = `https://trainn.pro${path === "/" ? "" : path}`;
    assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute("href"), canonical, path);
    assert.equal(doc.querySelector('meta[property="og:url"]')?.getAttribute("content"), canonical, path);
    assert.ok(doc.querySelector("title")?.textContent?.trim(), path);
    assert.ok(doc.querySelector('meta[name="description"]')?.getAttribute("content"), path);
    for (const node of doc.querySelectorAll('script[type="application/ld+json"]')) assert.ok(JSON.parse(node.textContent!));
    assert.ok(doc.querySelector('script[type="application/ld+json"]'), path);
    const state = JSON.parse(doc.querySelector("#public-page-state")!.textContent!);
    assert.equal(state.notFound, false, path);
    assert.ok(!/"(?:password|stripeCustomerId|stripeConnectId|googleId|authMethod|receiveNewsletter)":/.test(JSON.stringify(state)), `Public cache only: ${path}`);
    if (/^\/classes\/\d+$/.test(path)) assert.ok(doc.querySelector("h1")?.textContent?.includes(classes[0].title.trim()), path);
    if (path.startsWith("/blog/")) {
      assert.ok(doc.querySelector("article")?.textContent?.includes(posts[0].title), path);
      assert.ok((doc.querySelector("article .prose")?.textContent?.length || 0) > 100, `Article body: ${path}`);
    }
  }
  for (const path of ["/unknown-page", "/classes/sanfrancisco/kids/unknown", "/classes/unknown/kids", "/classes/sanfrancisco/unknown", "/classes/999999999", "/coaches/999999999", "/package/999999999", "/blog/article-not-found"]) {
    const { response, doc } = await get(path);
    assert.equal(response.status, 404, path);
    assert.match(doc.querySelector("h1")?.textContent || "", /404/);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
    assert.equal(doc.querySelector('link[rel="canonical"]'), null, path);
  }
  for (const [path, target] of [["/class/42", "/classes/42"], ["/packages", "/classes"], ["/seo-pages/outdoor-workouts-san-francisco", "/outdoor-workouts-san-francisco"], ["/classes/", "/classes"], ["/index.html", "/"]]) {
    const { response } = await get(path);
    assert.equal(response.status, 301, path);
    assert.equal(response.headers.get("location"), target, path);
  }
  for (const path of ["/auth", "/bookings", "/admin", "/blog/admin/edit/1"]) {
    const { response, doc } = await get(path);
    assert.equal(response.status, 200, path);
    assert.equal(doc.querySelector("#public-page-state"), null, path);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
  }
  const response = await fetch(`${origin}/sitemap.xml`);
  assert.equal(response.status, 200);
  const sitemap = new JSDOM(await response.text(), { contentType: "text/xml" }).window.document;
  const urls = [...sitemap.querySelectorAll("loc")].map(node => node.textContent);
  for (const path of publicLandingPaths()) assert.ok(urls.includes(`https://trainn.pro${path}`));
  for (const post of posts) assert.ok(urls.includes(`https://trainn.pro/blog/${encodeURIComponent(post.slug)}`));
});
