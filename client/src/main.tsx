import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrate } from "@tanstack/react-query";
import { Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import posthog from "posthog-js";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: true,
    capture_pageleave: true,
  });
}

const initialState = document.getElementById("public-page-state");
const page = initialState ? JSON.parse(initialState.textContent || "{}") : null;
if (page) hydrate(queryClient, page.state);
const app = (
  <Router>
    <ThemeProvider attribute="class" defaultTheme="light">
      <App client={queryClient} notFound={page?.notFound} />
    </ThemeProvider>
  </Router>
);
const root = document.getElementById("root")!;
if (page) hydrateRoot(root, app);
else createRoot(root).render(app);
