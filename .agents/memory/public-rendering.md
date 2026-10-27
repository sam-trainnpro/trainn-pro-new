---
name: Public rendering invariants
description: Non-obvious cache and date constraints for server rendering and browser hydration.
---

Pass the exact browser cache instance populated from the server snapshot into the application provider; do not rely on an imported default singleton.

**Why:** During development, the default provider cache was empty even though the entry point had hydrated its imported cache. Explicitly passing that instance resolved the resulting loading-placeholder hydration failures.

**How to apply:** Keep the cache handoff explicit when changing entry points or provider wrappers. Check actual browser hydration, not just successful HTML requests.

Public class dates and times must use the same explicit time zone on both server and browser.

**Why:** Native date getters silently used the server's UTC zone and the visitor's local zone. This caused both incorrect class dates and hydration failures for Pacific-time visitors, despite passing UTC-only tests.

**How to apply:** Preserve Pacific-time display for the currently supported California marketplace. When expanding regions, select an explicit class/location zone rather than inheriting the execution environment. Test hydration in more than one browser time zone.
