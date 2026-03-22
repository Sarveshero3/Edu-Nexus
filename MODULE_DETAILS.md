# Module Details: Developer's Onboarding Map 🗺️

A functional guide to every critical component in the **Edu Nexus** Tri-Hybrid GraphRAG Engine.

---

## 🚀 Entry Points

### `server.py`
**The API Gateway.** A FastAPI application exposing 14 REST endpoints and 1 WebSocket. Handles CORS, file uploads, chat queries, graph data, search, history, and engine settings. Delegates all heavy logic to the orchestrator.

### `config.py`
**Configuration Hub.** Centralizes paths (`data/raw`, `data/processed`, `data/artifacts`), embedding model names, and runtime constants.

---

## 🧠 The Orchestrator

### `src/orchestrator/manager.py`
**The Intelligence Router.** The core brain that:
- Routes queries to the appropriate retrieval engine(s) via Groq LLM
- Fuses results from BM25, FAISS, and Neo4j
- Builds context blocks and generates final grounded answers
- Manages the full document ingestion pipeline (extract → chunk → embed → index → graph)

---

## 🔍 The Tri-Hybrid Search Brains

### 1. Graph Engine — `src/graph_engine/`
Discovers entity relationships using Groq LLM and stores them as a knowledge graph in Neo4j.
- **`extractor.py`** — Identifies entities (nodes) and relationships (edges) from document text
- **`builder.py`** — Calls the extractor and orchestrates graph construction
- **`neo4j_ops.py`** — CRUD operations against Neo4j (`MERGE` deduplication, reads, deletes)

### 2. Vector Engine — `src/vector_engine/`
Captures semantic meaning via dense embeddings.
- **`store.py`** — FAISS index creation, insertion, and similarity search using `all-MiniLM-L6-v2`
- **`vector.py`** — Lower-level vector utilities

### 3. Keyword Engine — `src/retrieval/`
Fast lexical matching for exact terminology.
- **`bm25_index.py`** — Okapi BM25 index (build, search, serialize/deserialize)
- **`search.py`** — Search utilities and result formatting

---

## 📥 Ingestion Pipeline

### `src/ingest/`
- **`extractor.py`** — Multi-format text extraction (PDF, DOCX, TXT, PPTX, XLSX, CSV, MD)
- **`processor.py`** — Orchestrates raw file → clean text conversion
- **`cleaner.py`** — Regex heuristics to strip headers, footers, and noise
- **`ocr.py`** — OCR fallback for scanned PDFs

### `src/splitter/`
- **`textSplitter.py`** — Splits cleaned text into 500-character chunks with overlap, respecting LLM context limits

### `src/pipeline/`
- **`run_pipeline.py`** — End-to-end ingestion: extract → clean → chunk → embed → index
- **`build_index.py`** — Batch index rebuilding utility

---

## 🖥️ Frontend — `frontend/`

A Vite + React 18 + TypeScript SPA with Tailwind CSS.

### State Management — `stores/`
| Store | Purpose |
|-------|---------|
| `authStore.ts` | Mock auth (sign in/up/out) with localStorage persistence |
| `workspaceStore.ts` | Workspace CRUD, source assignments, chat sessions, messages |
| `sidebarStore.ts` | Sidebar collapse state |
| `themeStore.ts` | Theme preferences |

### API Client — `lib/api.ts`
Typed Axios client with automatic `{ success, data, error }` envelope unwrapping for all 14 backend endpoints.

### Pages — `pages/`
| Page | Route | Purpose |
|------|-------|---------|
| `Home.tsx` | `/` | Landing page with Spline 3D background, scroll animations |
| `SignIn.tsx` | `/sign-in` | Glass card sign-in form |
| `SignUp.tsx` | `/sign-up` | Glass card sign-up form (2×2 grid, no scroll) |
| `ForgotPassword.tsx` | `/forgot-password` | Password reset form |
| `Onboarding.tsx` | `/onboarding` | 3-step animated tutorial walkthrough |
| `Sources.tsx` | `/dashboard/sources` | Upload, list, delete documents per workspace |
| `Chat.tsx` | `/dashboard/chat` | RAG chat with chain-of-thought |
| `Graph.tsx` | `/dashboard/graph` | Neo4j Aura–style graph (4 layouts: Force/Radial/Hierarchy/Grid) |
| `History.tsx` | `/dashboard/history` | Query history with engine tabs |
| `Search.tsx` | `/dashboard/search` | Cross-engine search |
| `Viewer.tsx` | `/dashboard/viewer/:name` | Document chunk viewer with side chat |
| `Settings.tsx` | `/settings` | Engine weight tuning |
| `Profile.tsx` | `/profile` | User profile |

### Components — `components/`
| Component | Purpose |
|-----------|---------|
| `SplineScene.tsx` | Full-screen Spline 3D WebGL background |
| `GlassCard.tsx` | Glassmorphism card with cursor-tracking hover glow |
| `PillButton.tsx` | Gradient pill-shaped CTA button |
| `EngineBadge.tsx` | Color-coded engine label (BM25/FAISS/Graph) |
| `PageTransition.tsx` | Framer Motion page enter/exit wrapper |
| `AnimatedGradientText.tsx` | Shimmer gradient text effect |
| `BlurFade.tsx` | Bidirectional scroll-triggered fade+blur animation |
| `PublicLayout.tsx` | Shared Spline background for public pages |
| `AppShell.tsx` | Dashboard shell with sidebar and top bar |
| `AuthGuard.tsx` | Route guard — redirects to `/` if not authenticated |
| `Sidebar.tsx` | Dashboard navigation + workspace switcher |

---

## 🗄️ Data Storage — `data/`

| Directory | Contents |
|-----------|----------|
| `data/raw/` | User-uploaded original files |
| `data/processed/` | Extracted/cleaned text chunks (`.chunks.jsonl`) |
| `data/artifacts/` | Serialized indices (`faiss.index`, `bm25.pkl`) |
