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

### Frontend (React 18 + Vite + TypeScript)
- Located in: `frontend/`
- Runs on: `0.0.0.0:5000`
- Proxies `/api` calls to backend at `localhost:8000`
- State management: Zustand
- Data fetching: TanStack Query + Axios

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
