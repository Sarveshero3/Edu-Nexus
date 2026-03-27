# Edu Nexus — Implementation Plan

## Goal
Implement 8 fixes: single-user auth system, batch upload 0-chunks bug, graph layout/sidebar overlap, graph node quality & filtering, engine status badges, profile delete + settings accent/light mode, documentation updates, and graph detail panel improvements.

---

## FIX 1 — Single-User Auth System

### Root Cause
Auth is fully mocked in `authStore.ts` — `signIn`/`signUp` just set Zustand state with fake tokens. No backend validation, no persistent sessions, no real password hashing.

### Files Changed

#### [NEW] `src/auth/__init__.py`
Empty init file.

#### [NEW] `src/auth/auth_manager.py`
- `check_user_exists()` → reads `data/auth/user.json`
- `register_user(username, password)` → bcrypt hash, writes `data/auth/user.json`
- `login_user(username, password)` → validates, writes session token to `data/auth/session.json`
- `logout_user()` → deletes `data/auth/session.json`
- `validate_session(token)` → checks token in session file
- `delete_account()` → wipes `data/auth/`, `data/raw/`, `data/processed/`, `data/artifacts/qdrant/`, `data/artifacts/bm25/`, `data/artifacts/graphs/`
- All paths via `pathlib.Path`; `data/auth/` created on demand

#### [MODIFY] `requirements.txt`
Add `bcrypt>=4.0.0`

#### [MODIFY] `config.py`
Add `AUTH_DIR = DATA_DIR / "auth"` and ensure directory creation.

#### [MODIFY] `server.py`
- Add routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/status`, `POST /api/auth/delete-account`
- Add `X-Session-Token` middleware: all `/api/*` except `/api/auth/*` and `/api/status` require valid session
- Import `src.auth.auth_manager`

#### [MODIFY] `frontend/src/lib/api.ts`
- Add auth API functions: `authRegister`, `authLogin`, `authLogout`, `authStatus`, `authDeleteAccount`
- Add request interceptor to attach `X-Session-Token` header from localStorage

#### [MODIFY] `frontend/src/stores/authStore.ts`
- Remove mock signIn/signUp logic
- Call real backend endpoints via `api.ts`
- Store session token in localStorage
- On app load, call `GET /api/auth/status` to determine state

#### [MODIFY] `frontend/src/pages/SignUp.tsx`
- On mount, call `authStatus()`. If `registered: true`, show disclaimer card before form
- "Delete Everything & Continue" calls `authDeleteAccount()`, then shows form
- Submit calls `authRegister()`

#### [MODIFY] `frontend/src/pages/SignIn.tsx`
- On mount, call `authStatus()`. If `registered: true`, show "Welcome back, {username}" hint
- If not registered, show "No account yet? Sign up first" link
- Submit calls `authLogin()`

#### [MODIFY] `frontend/src/pages/Home.tsx`
- On mount, call `authStatus()`. If `logged_in: true`, redirect to `/dashboard/sources`

#### [MODIFY] `frontend/src/components/guards/AuthGuard.tsx`
- Call `GET /api/auth/status` to validate session, not just check Zustand state

---

## FIX 2 — Batch Upload "0 Chunks" Bug

### Root Cause
`uploadSourcesBatch` in `api.ts` transforms the async job response into fake `results` with `chunks_count: 0`. The frontend shows "Done — 0 chunks" instantly because it reads from the transformed upload response, not from polling the job. The pipeline runs in the background but the frontend never checks back.

### Files Changed

#### [MODIFY] `server.py`
- `_make_job()` — track per-file status: `files: { filename: {status, chunks, stage} }`
- `run_all()` background task — update per-file entry as pipeline progresses
- On pipeline complete for a file: set `files[name]["status"] = "done"`, `files[name]["chunks"] = actual_count`
- If 0 chunks: set `files[name]["status"] = "done"`, `files[name]["warning"] = "no_content"`

#### [MODIFY] `src/pipeline/run_pipeline.py`
- After chunking, if `len(chunk_texts) == 0`: log warning, return `{"status": "ok", "chunks": 0, "warning": "no_content"}` instead of raising

#### [MODIFY] `frontend/src/lib/api.ts`
- Add `getJobStatus(jobId)` function that calls `GET /api/jobs/{job_id}`
- Update `uploadSourcesBatch` to return raw job data (not faked results)

#### [MODIFY] `frontend/src/pages/dashboard/Sources.tsx`
- After upload response, store `job_id`, start polling `getJobStatus` every 2s
- Show per-file live stage indicator (Extracting → Chunking → Embedding → Done — N chunks)
- Only show green checkmark when file status is `"done"` with chunks > 0
- Show yellow warning for 0-chunk files
- Stop polling when all files done/failed, then refresh sources

---

## FIX 3 — Graph Explorer Layout & Sidebar Overlap

### Root Cause
Graph toolbar uses `absolute top-4 left-4` which positions relative to the full viewport, overlapping the sidebar. Graph canvas has no resize listener for sidebar state changes.

### Files Changed

#### [MODIFY] `frontend/src/pages/dashboard/Graph.tsx`
- Change toolbar from `absolute top-4 left-4 z-30` to relative positioning inside the content flow
- Import `useSidebar` from sidebarStore; subscribe to `collapsed` state
- Add useEffect: on sidebar collapse change, wait 320ms then trigger container resize via ResizeObserver / re-render

---

## FIX 4 — Graph Node Quality, Naming & Filtering

### Root Cause
GLiNER mis-extracts long sentence fragments as entities when chunks truncate mid-sentence. No frequency filter means single-occurrence noise entities flood the graph.

### Files Changed

#### [MODIFY] `src/graph_engine/extractor.py`
- Add `clean_entity_text(text)` — max 5 words, min 2 chars, no URLs/paths/numbers
- Apply to every entity in `extract_entities()`; discard `None` returns
- In `build_graph_data()`, filter final node_map to only include nodes with `frequency >= 2`

#### [MODIFY] `src/graph_engine/neo4j_ops.py`
- `get_all_nodes(workspace_id, min_frequency=2)` — filter nodes by minimum frequency
- `get_all_edges(workspace_id, min_weight=0.0)` — filter edges by weight threshold and ensure both endpoints meet frequency threshold

#### [MODIFY] `server.py`
- `GET /api/graph/nodes` — add `min_frequency: int = 2` query param
- `GET /api/graph/edges` — add `min_weight: float = 0.0` query param

#### [MODIFY] `frontend/src/lib/api.ts`
- Update `getGraphNodes/getGraphEdges` to accept filter params

#### [MODIFY] `frontend/src/pages/dashboard/Graph.tsx`
- Add collapsible filter panel: min frequency slider (1-10), max nodes slider (50-500), entity type checkboxes, search input
- Add loading overlay when ingestion jobs are running
- Add browser notification when graph is ready (`new Notification(...)`)

---

## FIX 5 — Chat Engine Status Badges

### Root Cause
`GET /api/status` returns hardcoded `{"bm25": True, "faiss": True, "neo4j": True}`. Frontend reads `status?.vector` and `status?.graph` which are `undefined`, so badges show red.

### Files Changed

#### [MODIFY] `server.py`
- Rewrite `GET /api/status` — real health checks for Qdrant (collection info), NetworkX (graph file exists + counts), BM25 (pkl file exists)
- Accept `workspace_id` query param for scoped counts
- Return shaped object: `{bm25: {online, doc_count}, qdrant: {online, vector_count}, graph: {online, node_count, edge_count}}`

#### [MODIFY] `frontend/src/lib/api.ts`
- Update `EngineStatus` type to match new response shape

#### [MODIFY] `frontend/src/pages/dashboard/Chat.tsx`
- Update `EngineStatusDot` to read from new shape (`status?.bm25?.online`, etc.)
- Add tooltip showing counts on hover
- Pass `workspace_id` to status endpoint

#### [MODIFY] `src/orchestrator/manager.py`
- Before graph retrieval, check `neo4j_ops.workspace_graph_exists(workspace_id)`
- If no graph: skip retrieval, set `graph_nodes = []`, add "Skipped — no graph data" to chain-of-thought

---

## FIX 6 — Profile Delete + Settings Accent/Light Mode

### Files Changed

#### [MODIFY] `frontend/src/pages/Profile.tsx`
- Wire "Confirm Delete" to call `authDeleteAccount()`, clear auth state, redirect to `/`
- Add loading spinner, error handling

#### [MODIFY] `frontend/src/stores/themeStore.ts`
- Add full `ACCENT_COLORS` map with `--accent-primary`, `--accent-secondary`, `--accent-glow`
- Add `applyTheme(accentColor, mode)` that writes CSS variables to `document.documentElement`
- Call `applyTheme` on setTheme, setAccent, and app startup
- Use `data-theme` attribute instead of class for light/dark mode

#### [MODIFY] `frontend/src/index.css`
- Add `[data-theme="light"]` CSS rules for light color overrides

#### [MODIFY] `frontend/src/pages/Settings.tsx`
- Update accent colors to match new system (purple, teal, coral, blue instead of cyan, purple, coral, teal)
- Settings page description: replace FAISS/Neo4j with Qdrant/Graph

---

## FIX 7 — Documentation Updates

### Files Changed

#### [MODIFY] `README.md`
- Architecture table: FAISS → Qdrant, Neo4j + Groq LLM → NetworkX + GLiNER
- Tech Stack table: remove Neo4j/FAISS rows, add Qdrant/NetworkX/GLiNER
- Environment vars: remove Neo4j vars, add note about local storage
- Project structure: fix engine descriptions

#### [MODIFY] `MODULE_DETAILS.md`
- Graph Engine: "Neo4j" → "NetworkX graph (JSON file per workspace)"
- `neo4j_ops.py` description → "NetworkX graph CRUD"
- `extractor.py` → "GLiNER local NER model"
- Vector Engine: "FAISS" → "Qdrant local embedded store"
- Data Storage table: update artifact paths

#### [MODIFY] `PROJECT_STRUCTURE.md`
- Update `data/artifacts/` entries
- Update src/ descriptions: remove FAISS/Neo4j references

#### [MODIFY] `.env.example`
- Remove Neo4j vars, add comment about local storage

---

## FIX 8 — Graph Node Detail Panel

### Files Changed

#### [MODIFY] `src/graph_engine/neo4j_ops.py`
- `get_node_detail()` — include `frequency`, `doc_ids` in node data; construct relation display label as `RELATED {NEIGHBOR_TYPE}`

#### [MODIFY] `server.py`
- `GET /api/graph/node/{name}` — return enriched response with `frequency`, `doc_ids`, `weight` per connection

#### [MODIFY] `frontend/src/pages/dashboard/Graph.tsx`
- Detail panel: show frequency badge, source document badges, co-occurrence weight indicator

---

## Verification Plan

### Automated / Script-Based
1. **Backend startup test**: `cd Edu-Nexus && venv\Scripts\activate && python -c "from src.auth.auth_manager import AuthManager; print('OK')"`
2. **Auth flow test**: Use browser to navigate to `http://localhost:5173/sign-up`, create account, verify `data/auth/user.json` exists with bcrypt hash
3. **Frontend build check**: `cd frontend && npm run build` — must complete with no errors

### Manual Verification (User)
1. **Auth flow**: Sign up → creates `data/auth/user.json`. Visit sign-up again → disclaimer shown. Login → redirects to dashboard. Home page → auto-redirects if logged in.
2. **Upload flow**: Upload 3 files. Verify live per-file progress stages appear (not instant "0 chunks"). After pipeline completes, files show actual chunk counts.
3. **Graph layout**: Open Graph page. Verify toolbar doesn't overlap sidebar. Collapse/expand sidebar → graph canvas resizes.
4. **Graph filtering**: Apply frequency filter → fewer nodes shown. Search for a node → it highlights.
5. **Engine badges**: Chat page shows green/red status based on actual engine health. Refresh updates them.
6. **Delete account**: Profile → Delete Account → all data wiped, redirected to home.
7. **Accent colors**: Settings → change accent → UI colors change. Toggle light mode → app switches to light colors.
8. **Docs**: Verify `README.md`, `MODULE_DETAILS.md`, `PROJECT_STRUCTURE.md` contain zero mentions of FAISS or Neo4j.
