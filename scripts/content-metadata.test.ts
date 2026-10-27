import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { getBlogPostMetadata, publicPageMetadata } from "../shared/page-metadata";
import { applyPageMetadata, getPublicPageMetadata } from "../server/page-metadata";

const read = (path: string) => readFileSync(path, "utf8");
const template = read("client/index.html");

test("each affected static page has unique metadata in initial HTML and a client definition", async () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const unusedLookup = async () => { throw new Error("Static pages must not query posts"); };
  for (const [path, expected] of Object.entries(publicPageMetadata)) {
    const metadata = await getPublicPageMetadata(`${path}/`, unusedLookup);
    assert.deepEqual(metadata, expected);
    const html = applyPageMetadata(template, metadata);
    assert.equal((html.match(/<title\b/g) || []).length, 1);
    assert.equal((html.match(/name="description"/g) || []).length, 1);
    assert.equal((html.match(/name="robots"/g) || []).length, 1);
    assert.ok(html.includes(`content="${expected.description.replace(/&/g, "&amp;").replace(/'/g, "&#39;")}"`));
    assert.match(read(`client/src/pages/${path.slice(1)}.tsx`), new RegExp(`<PageMetadata page="${path}"`));
    titles.add(expected.title);
    descriptions.add(expected.description);
  }
  assert.equal(titles.size, Object.keys(publicPageMetadata).length);
  assert.equal(descriptions.size, Object.keys(publicPageMetadata).length);
});

test("article metadata prefers saved description, then excerpt, then descriptive fallback", async () => {
  const post = { title: "A Guide", metaDescription: " Saved description ", excerpt: "Article excerpt", status: "published" };
  assert.deepEqual(getBlogPostMetadata(post), { title: "A Guide | Trainn", description: "Saved description" });
  assert.equal(getBlogPostMetadata({ ...post, metaDescription: " " }).description, post.excerpt);
  assert.match(getBlogPostMetadata({ title: "A Guide" }).description, /A Guide/);
  let received = "";
  const metadata = await getPublicPageMetadata("/blog/a%20guide", async (slug) => {
    received = slug;
    return post;
  });
  assert.equal(received, "a guide");
  assert.deepEqual(metadata, getBlogPostMetadata(post));
  assert.match(read("client/src/pages/blog-post.tsx"), /getBlogPostMetadata\(post\)/);
});

test("initial HTML never discloses unpublished posts and handles invalid slugs", async () => {
  for (const post of [undefined, { title: "Private draft title", metaDescription: "Private draft description", status: "draft" }]) {
    const metadata = await getPublicPageMetadata("/blog/draft", async () => post);
    assert.equal(metadata?.noindex, true);
    const html = applyPageMetadata(template, metadata);
    assert.ok(!html.includes("Private draft"));
    assert.match(html, /content="noindex, follow"/);
  }
  const invalid = await getPublicPageMetadata("/blog/%E0%A4%A", async () => { throw new Error("Invalid slug must not query"); });
  assert.equal(invalid?.noindex, true);
  for (const path of ["/blog/admin", "/blog/admin/create", "/other-route"]) {
    assert.equal(await getPublicPageMetadata(path, async () => { throw new Error("No query expected"); }), undefined);
  }
});

test("HTML head injection escapes author-controlled strings and preserves the application shell", () => {
  const html = applyPageMetadata(template, {
    title: '</title><script>alert("x")</script>',
    description: '"><img src=x onerror="alert(1)"> & detail',
  });
  assert.ok(!html.includes('<script>alert("x")'));
  assert.ok(!html.includes("<img src=x"));
  assert.match(html, /&lt;\/title&gt;/);
  assert.equal(html.split("<body>")[1], template.split("<body>")[1]);
  assert.equal(applyPageMetadata(template), template);
  assert.equal(applyPageMetadata(html, { title: "Next", description: "Next page" }).match(/name="description"/g)?.length, 1);
});

test("both HTML serving paths apply route metadata using the original request path", () => {
  const source = read("server/vite.ts");
  assert.equal((source.match(/await renderPublicDocument\(req, res,/g) || []).length, 2);
  const renderer = read("server/public-rendering.ts");
  assert.match(renderer, /new URL\(req.originalUrl,/);
  assert.match(renderer, /getPublicPageMetadata\(normalized,/);
  assert.match(renderer, /applyPageMetadata\(/);
});

test("authoring and article sanitizers preserve H2/H3 but not H1 or scripts", () => {
  for (const path of ["client/src/components/ui/rich-text-editor.tsx", "client/src/pages/blog-post.tsx"]) {
    const source = read(path);
    const tags = source.match(/ALLOWED_TAGS: \[([^\]]+)\]/)?.[1];
    assert.ok(tags);
    assert.match(tags, /'h2'/);
    assert.match(tags, /'h3'/);
    assert.doesNotMatch(tags, /'h1'|'script'|'iframe'/);
    assert.match(source, /DOMPurify\.sanitize/);
  }
  const editor = read("client/src/components/ui/rich-text-editor.tsx");
  assert.match(editor, /executeCommand\('formatBlock', tag\)/);
  for (const tag of ["p", "h2", "h3"]) assert.ok(editor.includes(`tag: '${tag}'`));
  assert.match(editor, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
});

test("discovery pages no longer emit invisible FAQs and breadcrumbs remain", () => {
  for (const name of ["seo-classes", "outdoor-workouts-sf", "kids-drop-in-sports-sf", "kids-after-school-activities-sf"]) {
    assert.doesNotMatch(read(`client/src/pages/${name}.tsx`), /FAQPage|generateFAQSchema/);
  }
  assert.doesNotMatch(read("client/src/lib/seo-config.ts"), /generateFAQSchema|FAQPage/);
  assert.match(read("client/src/pages/seo-classes.tsx"), /JSON\.stringify\(generateBreadcrumbSchema/);
});

test("success-story teaser contains no unsupported claims and is not indexable", () => {
  assert.equal(publicPageMetadata["/success-stories"].noindex, true);
  const content = read("client/src/pages/success-stories.tsx");
  assert.match(content, /Coming Soon/);
  assert.match(content, /haven't published documented provider case studies yet/);
  assert.doesNotMatch(content, /95%|\$4\.2K|4\.8★|85%|\$3,000|Real Stories, Real Results/);
  assert.match(content, /href="\/provider-landing"/);
  assert.match(content, /href="\/contact"/);
  assert.doesNotMatch(read("client/src/components/layout/footer.tsx"), /href="#"/);
});

test("plans describe monthly credits, eligibility and the range of limits", () => {
  const description = publicPageMetadata["/plans"].description;
  assert.match(description, /monthly class-credit plans/);
  assert.match(description, /under \$40/);
  assert.match(description, /4, 8, 12, 16 or unlimited/);
  assert.doesNotMatch(description, /unlimited access/);
});

test("changed TypeScript files parse cleanly", () => {
  const paths = [
    "shared/page-metadata.ts", "server/page-metadata.ts", "server/vite.ts",
    "client/src/components/page-metadata.tsx", "client/src/components/ui/rich-text-editor.tsx",
    "client/src/components/layout/footer.tsx", "client/src/lib/seo-config.ts",
    ...["blog", "blog-post", "contact", "provider-landing", "coach-resources", "business-tools",
      "coach-community", "success-stories", "plans", "seo-classes", "outdoor-workouts-sf",
      "kids-drop-in-sports-sf", "kids-after-school-activities-sf"].map((name) => `client/src/pages/${name}.tsx`),
  ];
  for (const path of paths) {
    const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    assert.equal((source as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics.length, 0, path);
  }
});
