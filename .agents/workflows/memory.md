---
description: Session memory — tracks what was done and what to do next
---
# Edu Nexus — Session Memory

## Session: 2026-03-22

### Completed
- **Server.py rewrite**: Full 14-endpoint REST API + legacy WebSocket. CORS fixed. Chain-of-thought in `/api/chat`.
- **API client** (`frontend/src/lib/api.ts`): Typed Axios client with envelope unwrapping.
- **Sources page**: Real upload/delete/list via TanStack Query. Drag-and-drop.
- **Chat page**: REST chat with chain-of-thought, EngineBadge, confidence scores.
- **History page**: Real data with engine tabs, delete, relative timestamps.
- **Graph Explorer**: Neo4j Aura–style with 4 selectable layouts (Force/Radial/Hierarchy/Grid). Full-screen canvas.
- **Viewer, Search, Settings**: All wired to real API.
- **UI Polish**: Spline 3D backgrounds, glassmorphism auth pages, AnimatedGradientText, bidirectional BlurFade, onboarding tutorial.
- **setup.bat + run.bat**: Working scripts.

## Session: 2026-03-25

### Completed
- **Workspace gating (Sources page)**: Upload blocked without active workspace. Limits bar displayed.
- **Backend async uploads**: `/api/sources/upload-batch` endpoint, api.ts response transform.
- **Chat markdown rendering**: `MarkdownMessage.tsx` — headings, tables, lists, code blocks, blockquotes. Used in Chat.tsx + Viewer.tsx.
- **Engine label fixes**: Chat.tsx now says Qdrant/Graph instead of FAISS/Neo4j. Uses correct `EngineStatus` fields (`vector`/`graph`).
- **Sidebar collapse + drag resize**: Collapse button (PanelLeftClose/Open), drag handle on right edge (68px–360px), persisted width in localStorage via `sidebarStore.ts`.
- **Graph improvements**: `extractor.py` now produces meaningful relation labels (e.g. "uses method", "belongs to") instead of "co-occurs". Graph.tsx shows bolder labels, weight-based edge rendering, styled relation badges.
- **Forced workspace creation**: `authStore.ts` signUp generates unique user IDs and clears stale data. `WorkspaceGateModal.tsx` blocks dashboard until first workspace is created.

### Known Issues
- Auth is mocked — `TODO: implement real auth` in `authStore.ts`
- Graph relation labels only apply to newly ingested documents (re-upload required for old data)
- react-markdown installed in root `Edu-Nexus/` — may need reinstall in `frontend/`
- Viewer.tsx has pre-existing lint errors (sendChat 3 args, data.chunks, chunk.id)

### Next Session Should Start With
- Run `run.bat` to verify end-to-end
- Test markdown rendering by asking a question that produces tables/lists
- Test sidebar collapse/drag
- Upload a new document to see improved graph relations

## Session: 2026-04-01

### Completed — Final Audit & Hardening
- **`.gitignore` fixed**: Removed `.agents/` exclusion so project workflows are committed. Added `.gemini/` exclusion instead.
- **`.gitkeep` files created**: All 7 data subdirectories now have `.gitkeep` for fresh-clone safety.
- **`server.py` bug fixes**:
  - Added missing `Body` import from FastAPI (used by `/api/query-with-context`).
  - Fixed `process-and-return` endpoint: replaced broken `from src.ingest.chunker import chunk_pages` (module didn't exist) with correct `clean_pages + chunk_text_by_sentences` from `cleaner.py`.
  - Fixed `build_graph_data()` call arity — was missing required `doc_id` and `workspace_id` args.
  - Fixed `query-with-context` — was creating a new `OrchestratorManager()` every request instead of using global `manager`.
- **Ingestion semaphore**: Added `asyncio.Semaphore(2)` to limit concurrent pipeline runs. Background task converted to async with `asyncio.to_thread`.
- **MIME validation**: Upload endpoint now cross-checks `content_type` against expected MIME for the file extension.
- **24-hour session expiry**: `auth_manager.py` now stores `created_at` timestamps on sessions and auto-expires them after 24 hours. Legacy sessions force re-login.
- **GLiNER windowed splitting**: Verified already implemented in `_split_for_gliner()`.
- **Docling fallback**: Verified already integrated in `run_pipeline.py._extract_text_with_fallback()`.
- **Stateless endpoints**: Both `/api/process-and-return` and `/api/query-with-context` are now correctly wired.
- **IndexedDB storage**: `frontend/src/lib/storage.ts` verified complete.

### Deployment Note
- **Not Railway** — deploying through college infrastructure. Railway files (Procfile, railway.toml, runtime.txt) kept but not actively used.

### Known Issues (Resolved)
- Auth is now real (bcrypt-based, session-token, 24h expiry)
- `src.ingest.chunker` module never existed — was a phantom import, now fixed
