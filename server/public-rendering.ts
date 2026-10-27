import type { Request, Response } from "express";
import { resolvePublicRoute } from "../shared/public-routes";
import { applyPageMetadata, getPublicPageMetadata } from "./page-metadata";
import { isPublicClass } from "../shared/public-availability";
import { SOCIAL_PREVIEW_IMAGE, SOCIAL_PREVIEW_ALT, socialPreviewImage } from "../shared/social-preview";

type Render = typeof import("../client/src/entry-server").render;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

export function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

// These responses feed an embedded public hydration cache. In particular, never
// embed complete user records even if a public API happens to return extra fields.
function publicData(value: any): any {
  if (Array.isArray(value)) return value.map(publicData);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/password|secret|token|stripe|bank|email|phone|googleId|referralCode|authMethod|receiveNewsletter/i.test(key))
    .map(([key, item]) => [key, publicData(item)]));
}

async function fetchPublicData(url: string): Promise<any> {
  if (!url.startsWith("/api/")) throw new Error("Invalid public data URL");
  // Fixed loopback origin: neither Host headers nor visitor cookies are forwarded.
  const response = await fetch(`http://127.0.0.1:5000${url}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    const error = new Error(`Public data unavailable (${response.status})`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return publicData(await response.json());
}

export async function renderPublicDocument(req: Request, res: Response, template: string, loadRender: () => Promise<Render>, getData: (url: string) => Promise<any> = fetchPublicData) {
  let pathname: string;
  try {
    // Express's "*" middleware rewrites req.url/req.path to "/".
    // originalUrl retains the actual document path.
    pathname = decodeURI(new URL(req.originalUrl, "http://render.invalid").pathname);
  } catch {
    pathname = "/invalid-url";
  }
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const route = resolvePublicRoute(normalized);
  if (route.kind === "redirect") {
    res.redirect(301, route.to + (req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : ""));
    return;
  }
  if (route.kind !== "not-found" && pathname !== normalized) {
    res.redirect(301, normalized + (req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : ""));
    return;
  }
  if (route.kind === "private") {
    res.set("X-Robots-Tag", "noindex, follow").status(200).type("html").send(
      replaceHead(template, `<title>Trainn</title><meta name="robots" content="noindex, follow" />`),
    );
    return;
  }
  let notFound = route.kind === "not-found";
  let seed: { key: string; data: any } | undefined;
  if (route.kind === "public" && route.api) {
    try {
      const data = await getData(route.api);
      if ((normalized.startsWith("/classes/") && !isPublicClass(data)) ||
          (normalized.startsWith("/blog/") && data.status !== "published") ||
          (normalized.startsWith("/package/") && (data.status === "disabled" || data.isActive === false || data.packageType !== "time_bound"))) {
        notFound = true;
      } else {
        seed = { key: route.api.split("?")[0], data };
      }
    } catch (error: any) {
      if (error.status === 404 || error.status === 410) notFound = true;
      else throw error; // Outages are not missing resources or empty listings.
    }
  }
  const render = await loadRender();
  const rendered = await render(req.originalUrl, notFound, getData, seed);
  const metadata = await getPublicPageMetadata(normalized, async () => seed?.data);
  let head = rendered.head;
  if (metadata && !notFound) head = applyPageMetadata(`<head>${head}</head>`, metadata).replace(/^<head>|<\/head>$/g, "");
  const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(head)?.[1] || "Trainn";
  const description = /<meta[^>]*name="description"[^>]*content="([^"]*)"/.exec(head)?.[1] || "Find and book local classes and activities on Trainn.";
  // Remove route components' incomplete or legacy social/canonical values, and
  // emit one normalized set for the requested document.
  head = head.replace(/<link\b[^>]*rel="canonical"[^>]*\/?>/gi, "")
    .replace(/<meta\b[^>]*(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*\/?>/gi, "");
  if (!notFound) {
    const canonical = `https://trainn.pro${normalized === "/" ? "" : normalized}`;
    const image = socialPreviewImage(seed?.data.profileImage || seed?.data.featuredImage || seed?.data.image);
    head += `
      <link data-react-helmet="true" rel="canonical" href="${escapeHtml(canonical)}" />
      <meta data-react-helmet="true" property="og:url" content="${escapeHtml(canonical)}" />
      <meta data-react-helmet="true" property="og:type" content="${normalized.startsWith("/blog/") ? "article" : "website"}" />
      <meta data-react-helmet="true" property="og:title" content="${title}" />
      <meta data-react-helmet="true" property="og:description" content="${description}" />
      <meta data-react-helmet="true" name="twitter:card" content="summary_large_image" />
      <meta data-react-helmet="true" name="twitter:title" content="${title}" />
      <meta data-react-helmet="true" name="twitter:description" content="${description}" />`;
    head += `<meta data-react-helmet="true" property="og:image" content="${escapeHtml(image)}" /><meta data-react-helmet="true" name="twitter:image" content="${escapeHtml(image)}" />`;
    if (image === SOCIAL_PREVIEW_IMAGE) head += `
      <meta data-react-helmet="true" property="og:image:width" content="1200" />
      <meta data-react-helmet="true" property="og:image:height" content="630" />
      <meta data-react-helmet="true" property="og:image:type" content="image/jpeg" />
      <meta data-react-helmet="true" property="og:image:alt" content="${escapeHtml(SOCIAL_PREVIEW_ALT)}" />
      <meta data-react-helmet="true" name="twitter:image:alt" content="${escapeHtml(SOCIAL_PREVIEW_ALT)}" />`;
    const data = seed?.data;
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org", "@type": "WebPage", url: canonical,
      name: data?.title || data?.businessName || decodeEntities(title),
      description: decodeEntities(description),
    };
    if (normalized.startsWith("/blog/") && data) {
      Object.assign(schema, { "@type": "BlogPosting", headline: data.title, datePublished: data.publishedAt || data.createdAt, dateModified: data.updatedAt, image: data.featuredImage || undefined, mainEntityOfPage: canonical });
    } else if (/^\/(?:classes|package)\/\d+$/.test(normalized) && data) {
      Object.assign(schema, { "@type": "Service", name: data.title || data.name, description: data.description, offers: { "@type": "Offer", price: data.price, priceCurrency: "USD", url: canonical } });
    } else if (/^\/coaches\/\d+$/.test(normalized) && data) {
      Object.assign(schema, { "@type": "ProfilePage", mainEntity: { "@type": "Person", name: `${data.firstName} ${data.lastName}`, description: data.bio } });
    }
    head += `<script data-react-helmet="true" type="application/ld+json">${serialize(schema)}</script>`;
    if (Array.isArray(rendered.listing) && rendered.listing.length) {
      head += `<script data-react-helmet="true" type="application/ld+json">${serialize({
        "@context": "https://schema.org", "@type": "ItemList",
        itemListElement: rendered.listing.map((item: any, index: number) => ({
          "@type": "ListItem", position: index + 1, name: item.title, url: `https://trainn.pro/classes/${item.id}`,
        })),
      })}</script>`;
    }
  } else {
    res.set("X-Robots-Tag", "noindex, follow");
  }
  const html = replaceHead(template, head)
    .replace('<div id="root"></div>', () => `<div id="root">${rendered.body}</div><script id="public-page-state" type="application/json">${serialize({ state: rendered.state, notFound })}</script>`);
  res.status(notFound ? 404 : 200).type("html").send(html);
}

function decodeEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function replaceHead(template: string, head: string): string {
  return template.replace(/<head>([\s\S]*?)<\/head>/i, (_, current: string) => `<head>${current
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*(?:name=["'](?:description|robots|keywords|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "")}${head}</head>`);
}
