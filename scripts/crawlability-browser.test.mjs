import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "@playwright/test";

const origin = process.env.TEST_ORIGIN || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : undefined);

test("public HTML hydrates, restores sessions and keeps controls and SPA navigation working", { skip: !origin, timeout: 180000 }, async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ["--no-sandbox"],
  });
  try {
    const [classes, coaches, posts, packages] = await Promise.all(
      ["/api/classes", "/api/coaches", "/api/blog", "/api/packages/all"].map(async path => (await fetch(`${origin}${path}`)).json()),
    );
    const routes = ["/", "/classes", "/classes/sanfrancisco/kids/soccer", "/blog", "/privacy", "/not-a-page"];
    if (classes[0]) routes.push(`/classes/${classes[0].id}`);
    if (coaches[0]) routes.push(`/coaches/${coaches[0].id}`);
    if (posts[0]) routes.push(`/blog/${posts[0].slug}`);
    const pkg = packages.find(item => item.packageType === "time_bound" && item.status === "enabled");
    if (pkg) routes.push(`/package/${pkg.id}`);
    for (const timezoneId of ["UTC", "America/Los_Angeles"]) {
      const context = await browser.newContext({ timezoneId });
      for (const path of routes) {
        const page = await context.newPage();
        const errors = [];
        let sessionRequests = 0;
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", message => {
          if (message.type() === "error" && /hydration|did not match|server HTML/i.test(message.text())) errors.push(message.text().split("\n")[0]);
        });
        page.on("request", request => { if (new URL(request.url()).pathname === "/api/user") sessionRequests++; });
        await page.goto(`${origin}${path}`);
        await page.waitForFunction(() => document.querySelector("#public-page-state"));
        await page.waitForTimeout(500);
        assert.deepEqual(errors, [], `${path} in ${timezoneId}`);
        assert.ok(sessionRequests >= 1, `Session restoration: ${path}`);
        assert.equal(await page.locator("vite-error-overlay").count(), 0, path);
        await page.close();
      }
      await context.close();
    }
    const page = await browser.newPage();
    await page.goto(`${origin}/classes/sanfrancisco/kids/soccer`);
    await page.getByRole("button", { name: "Age Group", exact: false }).first().click();
    await page.getByRole("menuitem", { name: "Kids", exact: true }).click();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("link", { name: "View all classes", exact: true }).click();
    await page.waitForURL("**/classes");
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://trainn.pro/classes");
    await page.close();
  } finally {
    await browser.close();
  }
});
