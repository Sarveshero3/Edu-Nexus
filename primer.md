# Edu Nexus Ultimate — Primer

*Last updated: 2026-03-22*

## What Is Edu Nexus?
A zero-cost university semantic search engine using a Tri-Hybrid RAG strategy (BM25 + FAISS + Neo4j). Students upload documents and ask questions — the system routes queries to the best retrieval brain(s) and returns grounded answers.

## Architecture
- **Backend**: Python 3, FastAPI (`server.py` — port 8000), Groq LLM (Router + Answer), Neo4j graph DB, FAISS vectors, BM25 keyword index.
- **Frontend**: Vite + React 18 + TypeScript + TailwindCSS 3 (`frontend/` — port 5173). State via Zustand. Data fetching via TanStack Query + Axios.

## Backend API Surface (`server.py` — 14 endpoints + 1 WebSocket)
| Method | Path | Status |
|--------|------|--------|
| GET | `/api/status` | ✅ Engine readiness + ingested count |
| GET | `/api/sources` | ✅ List ingested documents |
| POST | `/api/sources/upload` | ✅ Upload → full ingestion pipeline |
| DELETE | `/api/sources/{name}` | ✅ Remove source + rebuild indices |
| GET | `/api/sources/{name}/content` | ✅ Parsed text chunks |
| POST | `/api/chat` | ✅ RAG query → answer + chain-of-thought |
| GET | `/api/history` | ✅ Past queries |
| DELETE | `/api/history/{id}` | ✅ Delete history entry |
| GET | `/api/graph/nodes` | ✅ Neo4j nodes |
| GET | `/api/graph/edges` | ✅ Neo4j edges |
| GET | `/api/graph/node/{name}` | ✅ Node detail + connections |
| GET | `/api/search?q=&engine=` | ✅ Targeted search |
| GET | `/api/settings/engines` | ✅ Load engine weights |
| POST | `/api/settings/engines` | ✅ Save engine weights |
| WS | `/ws/chat` | ✅ Legacy WebSocket |

## Frontend State — All pages wired to real backend
- **Sources**: Real upload/delete/list via API. Drag-drop + click-to-browse.
- **Chat**: REST `/api/chat`. Shows chain-of-thought, EngineBadge, confidence score.
- **History**: Real data with tabs + delete.
- **Graph Explorer**: Obsidian-style force-directed simulation. Panning/zooming. Node detail panel.
- **Viewer**: Real chunks from API. Side chat wired.
- **Search**: Real search with engine filters.
- **Settings**: AI Engine tab saves/loads from backend.
- **Auth**: Mocked in Zustand (TODO: implement real auth).

## Scripts
- `setup.bat` — One-time: venv + pip + npm install + .env creation
- `run.bat` — Starts backend (8000) + frontend (5173)
