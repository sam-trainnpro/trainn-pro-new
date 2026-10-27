import { indexableStaticPaths } from "../shared/public-routes";
import { isPublicClass } from "../shared/public-availability";

export function buildSitemap(data: {
  classes: { id: number; status: string; createdAt: Date | string | null }[];
  coaches: { id: number; isApproved: boolean | null }[];
  posts: { slug: string; status: string; updatedAt?: Date | string | null; publishedAt?: Date | string | null }[];
  packages: { id: number; packageType: string; status: string; isActive: boolean | null }[];
}): string {
  const entries: { path: string; modified?: Date | string | null }[] = [
    ...indexableStaticPaths().map(path => ({ path })),
    ...data.classes.filter(isPublicClass).map(item => ({ path: `/classes/${item.id}`, modified: item.createdAt })),
    ...data.coaches.filter(item => item.isApproved).map(item => ({ path: `/coaches/${item.id}` })),
    ...data.posts.filter(item => item.status === "published").map(item => ({ path: `/blog/${encodeURIComponent(item.slug)}`, modified: item.updatedAt || item.publishedAt })),
    ...data.packages.filter(item => item.packageType === "time_bound" && item.isActive && item.status === "enabled").map(item => ({ path: `/package/${item.id}` })),
  ];
  const escapeXml = (value: string) => value.replace(/[<>&"']/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(({ path, modified }) => {
    const date = modified ? new Date(modified) : null;
    return `  <url><loc>${escapeXml(`https://trainn.pro${path === "/" ? "" : path}`)}</loc>${date && !isNaN(date.getTime()) ? `<lastmod>${date.toISOString()}</lastmod>` : ""}</url>`;
  }).join("\n")}
</urlset>`;
}
