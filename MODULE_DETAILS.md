# Module Details: Developer's Onboarding Map 🗺️

A functional guide to every critical component in the **Edu Nexus** Tri-Hybrid GraphRAG Engine.

---

## 🚀 Entry Points

### `server.py`
**The API Gateway.** A FastAPI application exposing REST endpoints for auth, file uploads, chat queries, graph data, search, history, and engine settings. Delegates all heavy logic to the orchestrator.

### `config.py`
**Configuration Hub.** Centralizes paths (`data/raw`, `data/processed`, `data/artifacts`, `data/auth`), embedding model names, and runtime constants. Uses `pathlib.Path` for cross-platform safety and auto-creates directories on import.

---

## 🧠 The Orchestrator

### `src/orchestrator/manager.py`
**The Intelligence Router.** The core brain that:
- Routes queries to the appropriate retrieval engine(s) via Groq LLM
- Fuses results from BM25, Qdrant, and NetworkX
- Builds context blocks and generates final grounded answers
- Manages the full document ingestion pipeline (extract → chunk → embed → index → graph)

---

## 🔍 The Tri-Hybrid Search Brains

### 1. Graph Engine — `src/graph_engine/`
Discovers entity relationships using GLiNER (local NER model, no API calls) and stores them as a knowledge graph in NetworkX (JSON-persisted per workspace).
- **`extractor.py`** — GLiNER-based entity extraction with cleaning filters (max 5 words, min 2 chars, frequency ≥ 2)
- **`builder.py`** — Calls the extractor and orchestrates graph construction
- **`neo4j_ops.py`** — NetworkX graph CRUD operations (upsert, read, delete, search) with JSON file persistence

### 2. Vector Engine — `src/vector_engine/`
Captures semantic meaning via dense embeddings.
- **`store.py`** — Qdrant local embedded vector store for semantic retrieval using `all-MiniLM-L6-v2`
- **`vector.py`** — Lower-level vector/embedding utilities

### 3. Keyword Engine — `src/retrieval/`
Fast lexical matching for exact terminology.
- **`bm25_index.py`** — Okapi BM25 index (build, search, serialize/deserialize) with per-workspace isolation
- **`search.py`** — Search utilities and result formatting

---

## 📥 Ingestion Pipeline

### `src/ingest/`
- **`extractor.py`** — Multi-format text extraction (PDF, DOCX, TXT, PPTX, XLSX, CSV, MD)
- **`processor.py`** — Orchestrates raw file → clean text conversion
- **`cleaner.py`** — Regex heuristics to strip headers, footers, and noise; includes sentence-based chunking
- **`ocr.py`** — OCR fallback for scanned PDFs

### `src/splitter/`
- **`textSplitter.py`** — Splits cleaned text into 500-character chunks with overlap, respecting LLM context limits

### `src/pipeline/`
- **`run_pipeline.py`** — End-to-end ingestion: extract → clean → chunk → embed → index → graph build
- **`build_index.py`** — Batch index rebuilding utility

---

## 🔐 Authentication — `src/auth/`

### `auth_manager.py`
Single-user local authentication system:
- `register_user()` — bcrypt hash (cost ≥ 12), writes `data/auth/user.json`
- `login_user()` — validates password, creates session token in `data/auth/session.json`
- `validate_session()` — checks token validity
- `delete_account()` — nuclear wipe of all data directories

---

## 🖥️ Frontend — `frontend/`

A Vite + React 18 + TypeScript SPA with Tailwind CSS.

### State Management — `stores/`
| Store | Purpose |
|-------|---------|
| `authStore.ts` | Real backend auth (register/login/logout) with session tokens |
| `workspaceStore.ts` | Workspace CRUD, source assignments, chat sessions, messages |
| `sidebarStore.ts` | Sidebar collapse state |
| `themeStore.ts` | Theme (dark/light/system) + accent color with CSS variable mapping |

### API Client — `lib/api.ts`
Typed Axios client with `X-Session-Token` interceptor and automatic `{ success, data, error }` envelope unwrapping.

### Pages — `pages/`
| Page | Route | Purpose |
|------|-------|---------|
| `Home.tsx` | `/` | Landing page with Spline 3D background, scroll animations |
| `SignIn.tsx` | `/sign-in` | Glass card sign-in form (real backend auth) |
| `SignUp.tsx` | `/sign-up` | Glass card sign-up with single-user disclaimer flow |
| `ForgotPassword.tsx` | `/forgot-password` | Password reset form |
| `Onboarding.tsx` | `/onboarding` | 3-step animated tutorial walkthrough |
| `Sources.tsx` | `/dashboard/sources` | Upload, list, delete documents per workspace |
| `Chat.tsx` | `/dashboard/chat` | RAG chat with chain-of-thought + engine status badges |
| `Graph.tsx` | `/dashboard/graph` | Knowledge graph explorer (4 layouts: Force/Radial/Hierarchy/Grid) |
| `History.tsx` | `/dashboard/history` | Query history with engine tabs |
| `Search.tsx` | `/dashboard/search` | Cross-engine search |
| `Viewer.tsx` | `/dashboard/viewer/:name` | Document chunk viewer with side chat |
| `Settings.tsx` | `/settings` | Engine weight tuning + accent color + account management |
| `Profile.tsx` | `/profile` | User profile |

### Components — `components/`
| Component | Purpose |
|-----------|---------|
| `SplineScene.tsx` | Full-screen Spline 3D WebGL background |
| `GlassCard.tsx` | Glassmorphism card with cursor-tracking hover glow |
| `PillButton.tsx` | Gradient pill-shaped CTA button |
| `EngineBadge.tsx` | Color-coded engine label (BM25/Qdrant/Graph/Hybrid) |
| `MarkdownMessage.tsx` | Renders markdown in chat responses |
| `NeuralCanvas.tsx` | Neural network background animation |
| `PageTransition.tsx` | Framer Motion page enter/exit wrapper |
| `AnimatedGradientText.tsx` | Shimmer gradient text effect |
| `BlurFade.tsx` | Bidirectional scroll-triggered fade+blur animation |
| `PublicLayout.tsx` | Shared Spline background for public pages |
| `AppShell.tsx` | Dashboard shell with sidebar, theme application, auto-workspace |
| `AuthGuard.tsx` | Route guard — validates session against backend |
| `Sidebar.tsx` | Dashboard navigation + workspace switcher |

---

## 🗄️ Data Storage — `data/`

| Directory | Contents |
|-----------|----------|
| `data/auth/` | User credentials (`user.json`) and session tokens (`session.json`) |
| `data/raw/` | User-uploaded original files |
| `data/processed/` | Extracted/cleaned text chunks (`.chunks.jsonl`) |
| `data/artifacts/qdrant/` | Qdrant vector collections (disk-persisted) |
| `data/artifacts/bm25/` | BM25 pickle indices per workspace |
| `data/artifacts/graphs/` | NetworkX graph JSON files per workspace |
