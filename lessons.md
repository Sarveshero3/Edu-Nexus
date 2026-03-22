# Edu Nexus — Lessons Learned

_Rules from past mistakes. Follow every rule here without exception._

## Rule 1: Always add Vite dev port to CORS
**Mistake made:** CORS only allowed `localhost:3000` (Next.js default), but frontend runs on `localhost:5173` (Vite).
**Context:** Initial server.py setup assumed Next.js.
**Rule:** Always include both `http://localhost:3000` AND `http://localhost:5173` in CORS origins when a Vite frontend exists.
**Date:** 2026-03-22

## Rule 2: Never fabricate data from a wired endpoint
**Mistake made:** N/A (preventive rule from system prompt).
**Context:** Building real integrations.
**Rule:** If real data is unavailable, return an honest empty state — never fabricate content to fill a UI component.
**Date:** 2026-03-22

## Rule 3: Do not rewrite backend logic
**Mistake made:** N/A (preventive rule).
**Context:** The existing manager.py, extractor.py, store.py, bm25_index.py are working.
**Rule:** Expose existing backend modules via HTTP — do not rewrite their internal logic.
**Date:** 2026-03-22
