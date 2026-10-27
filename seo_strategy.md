# SEO Strategy

## In scope
- Public Trainn marketplace: home, class discovery and city/age/category landing pages, class and package detail pages, provider directory/profiles, pricing, marketing resources, blog and public help/legal pages.
- Source-detectable WCAG 2.2 A/AA accessibility on public pages.

## Out of scope
- Authenticated account, booking/checkout, provider management and admin interfaces.
- Live crawling, browser audits, production configuration not represented in source.

## Target audience
- Adults and parents finding local fitness, sports and creative activities, primarily San Francisco/Bay Area and Los Angeles; activity providers seeking customers.

## Primary topics
- Outdoor workouts San Francisco; drop-in sports classes for kids; kids soccer classes; local fitness, sports and creative classes.
- Use existing class/provider data for distinctive local discovery content, not fabricated testimonials or business claims.

## Rendering and crawler assumptions
- React/Vite + Wouter public marketplace is client-rendered through an Express HTML fallback. An isolated Express full-HTML outdoor page exists under /seo-pages/, not at its advertised canonical public URL.
- Public content should be indexable, shareable and available to non-JavaScript social and AI retrieval crawlers. Google can render JavaScript but discovery/indexing may be delayed.
- Express explicitly serves robots.txt (allows all agents) and a dynamic sitemap; no AI-specific blocking or Cloudflare configuration was found in source. No llms.txt is present; this marketplace's substantive public rendering takes priority over optional AI-discovery polish.
- Source consistently uses https://trainn.pro for public identity; deployment domain must be confirmed when implementing fixes.

## Dismissed categories
- None recorded.
