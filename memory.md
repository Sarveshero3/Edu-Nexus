# Edu Nexus — Session Memory

## Session: 2026-03-22

### Completed
- **Server.py rewrite**: Replaced 3-endpoint server with full 14-endpoint REST API + legacy WebSocket. CORS fixed (5173 + 3000). Consistent `{ success, data, error }` envelopes. Chain-of-thought in `/api/chat`.
- **API client** (`frontend/src/lib/api.ts`): Typed Axios client with envelope unwrapping for all 14 endpoints.
- **Sources page**: Real upload/delete/list via TanStack Query. Drag-and-drop. Progress indicator.
- **Chat page**: REST chat with chain-of-thought expandable, EngineBadge, confidence scores, typing indicator.
- **History page**: Real data with engine tabs, delete, relative timestamps.
- **Graph Explorer**: Custom Obsidian-style force-directed simulation (SVG + requestAnimationFrame). Pan/zoom. Node detail panel from Neo4j.
- **Viewer**: Real chunks from API with pagination. Side chat wired.
- **Search**: Real API search with engine filter tabs, query highlighting, scores.
- **Settings AI Engine tab**: Load/save weights from/to backend.
- **setup.bat**: Added .env auto-creation + data directory setup.
- **run.bat**: Fixed port to 5173, added .env check, API docs URL.

### Dependencies Added
- None (axios, tanstack-query, react-force-graph-2d already in package.json — but note: react-force-graph-2d was NOT used; we built a custom force simulation instead to avoid the extra dependency)

### Known Issues
- TypeScript compilation couldn't be verified (node_modules may need `npm install`)
- Auth is mocked — `TODO: implement real auth` in `authStore.ts`

### Next Session Should Start With
- Run `setup.bat` then `run.bat` to verify end-to-end
- Upload a test PDF/PPTX/DOCX → verify Sources list → Chat about it → Check Graph
