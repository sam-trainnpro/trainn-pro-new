import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { QueryClient, dehydrate, type QueryObserverOptions } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ThemeProvider } from "next-themes";
import App from "./App";
import { cities, ageGroups, categories } from "./lib/seo-config";
import { getQueryFn } from "./lib/queryClient";

// Resolve only anonymous public GETs. Never prefetch account or administrative data.
function publicQueryUrl(key: readonly unknown[], pathname: string): string | undefined {
  const base = String(key[0]);
  if (base.includes("undefined") || base.includes("NaN")) return;
  if (base === "/api/classes") {
    const params = new URLSearchParams();
    const landing = /^\/classes\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/.exec(pathname);
    if (landing) {
      params.set("city", cities[landing[1]].filterValue);
      params.set("ageGroup", ageGroups[landing[2]].filterValue);
      if (landing[3]) params.set("categories", categories[landing[3]].categoryIds.join(","));
    } else if (key[1] && typeof key[1] === "object") {
      const filters = key[1] as Record<string, unknown>;
      const fields = { query: "q", classType: "type", ageGroup: "ageGroup", city: "city", outdoors: "outdoors", date: "date", targetAge: "targetAge", latitude: "lat", longitude: "lng" };
      for (const [field, param] of Object.entries(fields)) {
        if (filters[field] != null && filters[field] !== "") params.set(param, filters[field] instanceof Date ? filters[field].toISOString() : String(filters[field]));
      }
      for (const [index, param] of [[2, "category"], [3, "coachId"], [4, "packageClasses"]] as const) {
        if (key[index]) params.set(param, String(key[index]));
      }
    }
    return `${base}?${params}`;
  }
  if (/^\/api\/classes\/\d+$/.test(base)) return `${base}?includeSchedules=true`;
  if (base === "/api/reviews/coach" && Number(key[1])) return `${base}/${key[1]}/stats`;
  if (/^\/api\/reviews\/coach\/\d+$/.test(base) && typeof key[1] === "object") return `${base}?limit=2`;
  if (/^\/api\/(?:categories(?:\/(?:\d+|with-future-classes))?|cities|coaches(?:\/\d+(?:\/(?:classes|packages))?)?|classes\/\d+\/bookings\/count|time-bound-packages\/\d+|blog(?:\/[^/]+)?|reviews\/coach\/\d+(?:\/stats)?|subscriptions\/plans)$/.test(base)) return base;
}

export async function render(
  url: string,
  notFound: boolean,
  getPublicData: (url: string) => Promise<unknown>,
  seed?: { key: string; data: unknown },
) {
  // Each document owns its cache; authenticated client caches are never reused.
  const client = new QueryClient({ defaultOptions: { queries: { queryFn: getQueryFn({ on401: "throw" }), retry: false, staleTime: Infinity } } });
  client.setQueryData(["/api/user"], null);
  if (seed) client.setQueryData([seed.key], seed.data);
  const parsed = new URL(url, "http://render.invalid");
  const tree = (
    <Router ssrPath={parsed.pathname} ssrSearch={parsed.search}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <App client={client} notFound={notFound} />
      </ThemeProvider>
    </Router>
  );
  let body = "";
  try {
    // Rendering discovers queries; the next pass discovers dependent queries (e.g.
    // a class's coach/category). Fetch outside React's synchronous render phase.
    for (let pass = 0; pass < 5; pass++) {
      body = renderToString(tree);
      Helmet.renderStatic();
      const pending = client.getQueryCache().getAll().filter(query =>
        query.state.status === "pending" && (query.options as QueryObserverOptions).enabled !== false &&
        publicQueryUrl(query.queryKey, parsed.pathname),
      );
      if (!pending.length) break;
      await Promise.all(pending.map(query => client.fetchQuery({
        queryKey: query.queryKey,
        queryFn: () => getPublicData(publicQueryUrl(query.queryKey, parsed.pathname)!),
      })));
    }
    body = renderToString(tree);
    const helmet = Helmet.renderStatic();
    return {
      body,
      head: [helmet.title, helmet.meta, helmet.link, helmet.script].map(value => value.toString()).join("\n"),
      state: dehydrate(client),
      listing: client.getQueryCache().getAll().find(query => query.queryKey[0] === "/api/classes")?.state.data,
    };
  } finally {
    Helmet.renderStatic();
    client.clear();
  }
}
