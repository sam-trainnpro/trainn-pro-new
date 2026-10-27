import express from "express";
import { execFileSync, spawn } from "node:child_process";

// A local production-static harness, without starting another payout/email scheduler.
// Public data comes from the running application; HTML and browser assets come
// exclusively from the production build.
execFileSync("node_modules/.bin/esbuild", ["server/vite.ts", "--platform=node", "--packages=external", "--bundle", "--format=esm", "--outfile=dist/render-check.mjs"], { stdio: "inherit" });
const { serveStatic } = await import("../dist/render-check.mjs");
const app = express();
const source = process.env.TEST_ORIGIN || `https://${process.env.REPLIT_DEV_DOMAIN}`;
app.use(async (req, res, next) => {
  if (!req.path.startsWith("/api/") && req.path !== "/sitemap.xml") return next();
  try {
    const response = await fetch(`${source}${req.originalUrl}`);
    res.status(response.status).type(response.headers.get("content-type") || "application/json").send(await response.text());
  } catch (error) {
    next(error);
  }
});
serveStatic(app);
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
try {
  const child = spawn(process.execPath, ["--import", "tsx", "--test", "scripts/crawlability.test.ts", "scripts/crawlability-browser.test.mjs"], {
    stdio: "inherit",
    env: { ...process.env, TEST_ORIGIN: `http://127.0.0.1:${server.address().port}` },
  });
  const code = await new Promise(resolve => child.once("exit", resolve));
  process.exitCode = code || 0;
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
