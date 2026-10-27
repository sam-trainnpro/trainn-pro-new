import {
  getBlogPostMetadata,
  publicPageMetadata,
  type PageMetadata,
} from "../shared/page-metadata";
import { publicRouteMetadata } from "../shared/public-route-metadata";

type PublicPost = {
  title: string;
  status: string;
  metaDescription?: string | null;
  excerpt?: string | null;
};

// Only title, description and indexing directives are handled here.
// The broader rendering layer can reuse these definitions.
export async function getPublicPageMetadata(
  pathname: string,
  getPost: (slug: string) => Promise<PublicPost | undefined>,
): Promise<PageMetadata | undefined> {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (Object.prototype.hasOwnProperty.call(publicPageMetadata, path)) {
    return publicPageMetadata[path as keyof typeof publicPageMetadata];
  }
  if (Object.prototype.hasOwnProperty.call(publicRouteMetadata, path)) return publicRouteMetadata[path];
  const match = /^\/blog\/([^/]+)$/.exec(path);
  if (!match || match[1] === "admin") return undefined;

  let slug: string;
  try {
    slug = decodeURIComponent(match[1]);
  } catch {
    return {
      title: "Article Unavailable | Trainn Blog",
      description: "This article could not be found. Browse the Trainn blog for more guides and updates.",
      noindex: true,
    };
  }
  const post = await getPost(slug);
  // Unpublished titles/descriptions must never leak into public HTML.
  if (!post || post.status !== "published") {
    return {
      title: "Article Unavailable | Trainn Blog",
      description: "This article could not be found. Browse the Trainn blog for more guides and updates.",
      noindex: true,
    };
  }
  return getBlogPostMetadata(post);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

export function applyPageMetadata(html: string, metadata?: PageMetadata): string {
  if (!metadata) return html;
  return html.replace(/<head>([\s\S]*?)<\/head>/i, (_, head: string) => {
    const cleaned = head
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
      .replace(/<meta\b[^>]*\bname=["'](?:description|robots)["'][^>]*>/gi, "");
    // Mark these as Helmet-managed so client navigation replaces rather than duplicates them.
    return `<head>${cleaned}
    <title data-react-helmet="true">${escapeHtml(metadata.title)}</title>
    <meta data-react-helmet="true" name="description" content="${escapeHtml(metadata.description)}" />
    <meta data-react-helmet="true" name="robots" content="${metadata.noindex ? "noindex, follow" : "index, follow"}" />
  </head>`;
  });
}
