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
