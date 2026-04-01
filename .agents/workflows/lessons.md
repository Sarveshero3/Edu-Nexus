---
description: Coding rules from past mistakes — follow every rule without exception
---
# Edu Nexus — Lessons Learned

## Rule 1: Always add Vite dev port to CORS
**Mistake made:** CORS only allowed `localhost:3000` (Next.js default), but frontend runs on `localhost:5173` (Vite).
**Rule:** Always include both `http://localhost:3000` AND `http://localhost:5173` in CORS origins when a Vite frontend exists.

## Rule 2: Never fabricate data from a wired endpoint
**Rule:** If real data is unavailable, return an honest empty state — never fabricate content to fill a UI component.

## Rule 3: Do not rewrite backend logic
**Rule:** Expose existing backend modules via HTTP — do not rewrite their internal logic.
