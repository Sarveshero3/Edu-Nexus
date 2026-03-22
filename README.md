# Edu Nexus — Tri-Hybrid GraphRAG Academic Engine

**Edu Nexus** is a zero-cost university semantic search engine powered by a **Tri-Hybrid RAG** strategy (BM25 + FAISS + Neo4j). Upload research papers, query across three AI retrieval engines, and build knowledge graphs — all in one unified academic workspace.

## Architecture

| Brain | Engine | Purpose |
|-------|--------|---------|
| **Semantic** | FAISS + SentenceTransformers | Vector similarity search over document embeddings |
| **Keyword** | BM25 (Okapi) | Exact-match lexical retrieval |
| **Graph** | Neo4j + Groq LLM | Knowledge graph traversal and relationship discovery |

A Groq-hosted LLM acts as the **intelligent router**, deciding which brain(s) to invoke per query, then fusing the results into a final grounded answer with chain-of-thought transparency.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3, FastAPI (port 8000) |
| Frontend | Vite + React 18 + TypeScript + Tailwind CSS 3 (port 5173) |
| State | Zustand (auth, workspaces, sidebar) |
| Data Fetching | TanStack Query + Axios |
| 3D Background | Spline (WebGL) |
| Animations | Framer Motion, MagicUI |
| LLM | Groq (query routing + answer generation) |
| Graph DB | Neo4j Aura |
| Vector DB | FAISS (local, disk-persisted) |
| Embeddings | `all-MiniLM-L6-v2` (SentenceTransformers) |

## Features

- **Multi-format Upload**: PDF, DOCX, TXT, PPTX, XLSX, CSV, MD — drag-and-drop batch ingestion
- **Tri-Hybrid RAG Chat**: Ask questions and get answers grounded in your documents with visible chain-of-thought
- **Knowledge Graph Explorer**: Neo4j Aura–style full-screen visualization with 4 layout modes (Force, Radial, Hierarchy, Grid)
- **Workspace Management**: Organize documents and chats into named workspaces
- **Document Viewer**: Read ingested chunks with inline AI chat
- **Search**: Cross-engine search with filter tabs (BM25 / FAISS / Graph)
- **Query History**: Browse and manage past queries with engine tags
- **Engine Settings**: Tune retrieval weights per engine

## Quick Start

### One-Time Setup
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/Edu-Nexus.git
cd Edu-Nexus

# Run the setup script (creates venv, installs deps, creates .env)
setup.bat
```

Or manually:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd frontend && npm install && cd ..
copy .env.example .env
# Fill in API keys in .env
```

### Run
```bash
# Start both backend (8000) and frontend (5173)
run.bat
```

Or manually:
```bash
# Terminal 1 — Backend
venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

### Environment Variables (`.env`)
```
GROQ_API_KEY=your_groq_api_key
NEO4J_URI=neo4j+s://your_instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
```

## API Surface

14 REST endpoints + 1 WebSocket on `http://localhost:8000`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Engine readiness + ingested document count |
| GET | `/api/sources` | List all ingested documents |
| POST | `/api/sources/upload` | Upload files → full ingestion pipeline |
| DELETE | `/api/sources/{name}` | Remove a source + rebuild indices |
| GET | `/api/sources/{name}/content` | Get parsed text chunks |
| POST | `/api/chat` | RAG query → answer + chain-of-thought |
| GET | `/api/history` | Past queries |
| DELETE | `/api/history/{id}` | Delete a history entry |
| GET | `/api/graph/nodes` | All Neo4j nodes |
| GET | `/api/graph/edges` | All Neo4j edges |
| GET | `/api/graph/node/{name}` | Node detail + connections |
| GET | `/api/search?q=&engine=` | Targeted search |
| GET | `/api/settings/engines` | Load engine weights |
| POST | `/api/settings/engines` | Save engine weights |
| WS | `/ws/chat` | Legacy WebSocket chat |

## Project Structure

> See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for the full directory tree and [MODULE_DETAILS.md](MODULE_DETAILS.md) for a functional breakdown.

```
Edu-Nexus/
├── frontend/          # Vite + React + TypeScript SPA
├── src/               # Python backend — retrieval engines
│   ├── graph_engine/  # Neo4j knowledge graph pipeline
│   ├── ingest/        # Document loading, extraction, cleaning
│   ├── orchestrator/  # Central query router (manager.py)
│   ├── pipeline/      # Full ingestion workflow glue
│   ├── retrieval/     # BM25 keyword index
│   ├── splitter/      # Text chunking logic
│   └── vector_engine/ # FAISS vector store
├── server.py          # FastAPI REST API (14 endpoints)
├── config.py          # Centralized configuration
├── setup.bat          # One-time environment setup
└── run.bat            # Start backend + frontend
```

## Team

| Role | Member | Focus |
|------|--------|-------|
| Arch / Core | Sarvesh | Orchestrator, Graph Logic, Frontend, API |
| Data Eng | Swaraj | PDF Cleaning Pipeline |
| Vector Eng | Saatvik | Chunking & FAISS Store |
| QA / Ops | Kulvansh | Data Collection |

## License

See [LICENSE](LICENSE).
