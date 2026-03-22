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

### Known Issues
- Auth is mocked — `TODO: implement real auth` in `authStore.ts`
- Workspace data persists in localStorage — stale workspaces from previous sessions may appear

### Next Session Should Start With
- Run `setup.bat` then `run.bat` to verify end-to-end
- Upload a test PDF/PPTX/DOCX → verify Sources list → Chat about it → Check Graph
