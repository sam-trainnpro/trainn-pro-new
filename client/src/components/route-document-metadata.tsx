import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { publicRouteMetadata } from "@shared/public-route-metadata";
import { publicPageMetadata, type PageMetadata } from "@shared/page-metadata";
import { resolvePublicRoute } from "@shared/public-routes";

export default function RouteDocumentMetadata() {
  const [pathname] = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const route = resolvePublicRoute(path);
  if (route.kind !== "public") return <Helmet><meta name="robots" content="noindex, follow" /></Helmet>;
  const metadata = (publicPageMetadata as Record<string, PageMetadata>)[path] || publicRouteMetadata[path];
  const canonical = `https://trainn.pro${path === "/" ? "" : path}`;
  return (
    <Helmet>
      {metadata && <title>{metadata.title}</title>}
      {metadata && <meta name="description" content={metadata.description} />}
      <meta name="robots" content={metadata?.noindex ? "noindex, follow" : "index, follow"} />
      <link rel="canonical" href={canonical} />
      <meta property="og:url" content={canonical} />
      {metadata && <meta property="og:title" content={metadata.title} />}
      {metadata && <meta property="og:description" content={metadata.description} />}
      {metadata && <meta name="twitter:title" content={metadata.title} />}
      {metadata && <meta name="twitter:description" content={metadata.description} />}
    </Helmet>
  );
}
