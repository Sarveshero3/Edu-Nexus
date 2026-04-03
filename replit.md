# Edu Nexus — Tri-Hybrid GraphRAG Academic Engine

## Overview
An advanced academic search engine and workspace. Users upload documents (PDF, DOCX, PPTX, etc.) and query them using a sophisticated tri-hybrid retrieval system combining:
- **Semantic search** via Qdrant vector store + sentence-transformers
- **Keyword search** via BM25 (Okapi)
- **Knowledge graph traversal** via NetworkX + GLiNER NER

AI reasoning is powered by Groq-hosted LLMs.

## Architecture

### Backend (Python / FastAPI)
- Entry point: `server.py`
- Config: `config.py`
- Runs on: `localhost:8000`
- Modules in `src/`: auth, orchestrator, vector_engine, graph_engine, retrieval, ingest, pipeline, splitter

### Document Ingestion Pipeline
Priority chain for text extraction:
1. **Docling** (primary) — high-quality extraction for PDFs, PPTX, scanned docs. Produces clean markdown, skips header/footer cleaner. Controlled by `DOCLING_ENABLED=true` in config.
2. **Default extractors** (fallback) — pdfplumber, python-docx, etc. Output runs through cleaner (header/footer removal, normalization).
3. **OCR** (last resort) — pytesseract for images/scanned documents.

Key files: `src/pipeline/run_pipeline.py`, `src/ingest/docling_extractor.py`, `src/ingest/cleaner.py`, `src/ingest/extractor.py`

### Frontend (React 18 + Vite + TypeScript)
- Located in: `frontend/`
- Runs on: `0.0.0.0:5000`
- Proxies `/api` calls to backend at `localhost:8000`
- State management: Zustand
- Data fetching: TanStack Query + Axios

### Frontend Performance Optimizations
- **Route-level lazy loading**: All pages use `React.lazy()` + `Suspense` so only the code for the current route is loaded
- **Heavy component lazy loading**: SplineScene (3D background) is lazily loaded in PublicLayout
- **React.memo**: Applied to expensive components — SplineScene, NeuralNetwork3D, NeuralCanvas, MarkdownMessage — to prevent unnecessary re-renders
- **Vite chunk splitting**: Vendor libraries split into separate chunks (`vendor-react`, `vendor-motion`, `vendor-query`, `vendor-state`, `vendor-three`) for better caching
- **Build target**: `esnext` with esbuild minification + CSS minification
- **Initial bundle**: ~50KB (everything else loads on demand per route)

## Required Secrets
- `GROQ_API_KEY` — Required for AI query routing and answer generation (get one free at https://console.groq.com/)

## Running Locally
- **Backend workflow**: `python server.py` (port 8000)
- **Frontend workflow**: `cd frontend && npm run dev` (port 5000)

## Data Storage
All persistent data lives in `data/`:
- `data/raw/` — uploaded source files
- `data/processed/` — extracted text chunks
- `data/artifacts/qdrant/` — vector store
- `data/artifacts/bm25/` — BM25 indexes
- `data/artifacts/graphs/` — knowledge graphs
- `data/auth/` — session tokens

## Deployment
- Target: VM (always-running, uses persistent local file state)
- Build: `cd frontend && npm install && npm run build`
- Run: `python server.py & cd frontend && npm run preview -- --host 0.0.0.0 --port 5000`
