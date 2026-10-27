import { cities, ageGroups, categories } from "../client/src/lib/seo-config";
import { publicPageMetadata, type PageMetadata } from "./page-metadata";

// The public URL inventory is shared by document rendering and crawler discovery.
export const staticPublicPaths = [
  "/", "/about", "/faq", "/provider-faq", "/contact", "/landing-pages",
  "/provider-landing", "/classes", "/coaches", "/plans", "/blog",
  "/outdoor-workouts-san-francisco", "/kids-drop-in-sports-classes-san-francisco",
  "/kids-after-school-activities-san-francisco", "/terms/dmca",
  "/about/communityguidelines", "/terms/gifts", "/terms/customer-referrals",
  "/terms", "/privacy", "/cookies", "/coach-resources", "/success-stories",
  "/business-tools", "/coach-community",
] as const;

export function publicLandingPaths(): string[] {
  return Object.keys(cities).flatMap(city =>
    Object.keys(ageGroups).flatMap(age => [
      `/classes/${city}/${age}`,
      ...Object.keys(categories).map(category => `/classes/${city}/${age}/${category}`),
    ]),
  );
}

export function indexableStaticPaths(): string[] {
  return [...staticPublicPaths, ...publicLandingPaths()].filter(path =>
    !(publicPageMetadata as Record<string, PageMetadata>)[path]?.noindex,
  );
}

const privatePaths = [
  /^\/(?:auth|register|forgot-password|reset-password|change-plan|bookings|profile|admin|create-class|create-package|my-packages|my-classes|review|customers|all-customers|my-calendar|promo-codes|package-checkout|time-bound-package-checkout)$/,
  /^\/(?:checkout|edit-class|edit-package)\/[^/]+$/,
  /^\/admin\/promo-codes$/,
  /^\/package\/[^/]+\/purchase$/,
  /^\/blog\/admin(?:\/(?:create|edit\/[^/]+))?$/,
];

export type PublicRoute =
  | { kind: "private" }
  | { kind: "not-found" }
  | { kind: "redirect"; to: string }
  | { kind: "public"; api?: string };

export function resolvePublicRoute(path: string): PublicRoute {
  if (path === "/packages") return { kind: "redirect", to: "/classes" };
  if (path === "/seo-pages/outdoor-workouts-san-francisco") {
    return { kind: "redirect", to: "/outdoor-workouts-san-francisco" };
  }
  const alias = /^\/class\/([1-9]\d*)$/.exec(path);
  if (alias) return { kind: "redirect", to: `/classes/${alias[1]}` };
  if (privatePaths.some(pattern => pattern.test(path))) return { kind: "private" };
  if ((staticPublicPaths as readonly string[]).includes(path) || publicLandingPaths().includes(path)) {
    return { kind: "public" };
  }
  const detail = /^\/(classes|coaches|package)\/([1-9]\d*)$/.exec(path);
  if (detail) {
    const resource = detail[1] === "package" ? "time-bound-packages" : detail[1];
    return { kind: "public", api: `/api/${resource}/${detail[2]}${resource === "classes" ? "?includeSchedules=true" : ""}` };
  }
  const blog = /^\/blog\/([^/]+)$/.exec(path);
  if (blog && blog[1] !== "admin") return { kind: "public", api: `/api/blog/${blog[1]}` };
  return { kind: "not-found" };
}
