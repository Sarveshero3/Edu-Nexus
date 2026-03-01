# Generation Log — Edu Nexus

> **Session Date:** 2026-02-26  
> **Objective:** Connect BM25 (retrieval), Graph Engine to Chainlit UI through an Orchestrator.

---

## Change #1 — Created `src/orchestrator/manager.py` (Orchestrator)

- **Action:** Overwrote the empty `manager.py` with a full `Orchestrator` class.
- **What it did:**
  - Imported and initialised `KeywordEngine` (BM25) and `Neo4jConnector` (Graph).
  - Loaded Groq LLM client using `GROQ_API_KEY`.
  - Implemented `_retrieve_bm25(query)` — runs keyword search, returns top-5 chunks.
  - Implemented `_retrieve_graph(query)` — builds dynamic Cypher `CONTAINS` queries from keywords, returns up to 10 triples from Neo4j.
  - Implemented `answer(query)` — full async RAG pipeline: retrieve → format context → call LLM → return structured result.
  - Included a `SYSTEM_PROMPT` instructing the LLM to synthesise both BM25 and graph context.
  - Used `meta-llama/llama-4-scout-17b-16e-instruct` as the LLM model.
- **Status:** Later **replaced by the USER** with a `MockManager` class (simulated responses). See Change #5.

---

## Change #2 — Created `app.py` (Chainlit Entry Point)

- **Action:** Created `app.py` in the project root.
- **What it did:**
  - `@cl.on_chat_start` — sends a welcome greeting with capability overview.
  - `@cl.on_message` — calls `orchestrator.answer()`, displays the LLM answer with collapsible retrieved sources (BM25 chunks + graph triples).
  - Showed a "thinking" indicator while the orchestrator processes.
- **Status:** Later **replaced by the USER** with their own version using `MockManager` and `cl.Step` for "Glass Box" reasoning. See Change #5.

---

## Change #3 — Created `chainlit.md`

- **Action:** Created the Chainlit welcome sidebar page.
- **What it did:**
  - Described Edu Nexus capabilities (BM25, Neo4j, LLM).
  - Provided example queries.
- **Status:** Later **modified by the USER** to show "Tri-Hybrid Semantic Search Engine" branding with Deep Brain / Semantic Brain / Fast Brain terminology and "Developer Preview" status.

---

## Change #4 — Modified `src/retrieval/bm25_index.py` (Empty Corpus Guard)

- **Action:** Added a guard in `build_index()` to prevent `ZeroDivisionError` when no chunks exist.
- **What changed:**
  ```diff
  +        if not self.chunks:
  +            print("[WARNING] No chunks found in data/processed/. "
  +                  "Run the ingestion pipeline first to create .chunks.jsonl files.")
  +            return
  ```
- **Why:** `BM25Okapi` crashes with `ZeroDivisionError` if given an empty corpus. The `data/processed/` directory was empty.
- **Status:** File was then **deleted by the USER** and later **recreated by me** (see Change #6).

---

## Change #5 — USER Modifications (Not by me)

The USER made the following manual changes:

1. **Replaced `app.py`** — rewrote to use `MockManager` with `cl.Step` for Glass Box reasoning.
2. **Replaced `src/orchestrator/manager.py`** — replaced full `Orchestrator` with a `MockManager` class returning hardcoded simulated responses.
3. **Modified `chainlit.md`** — updated branding to "Tri-Hybrid Semantic Search Engine" with Developer Preview status.
4. **Deleted `src/retrieval/bm25_index.py`** — removed the BM25 engine file entirely.

---

## Change #6 — Recreated `src/retrieval/bm25_index.py`

- **Action:** Recreated the file after the USER deleted it.
- **What it contains:**
  - `KeywordEngine` class with `build_index()`, `load_index()`, `search()` methods.
  - Includes the empty-corpus guard from Change #4.
  - Initially used `⚠️` emoji in the warning message — caused `UnicodeEncodeError` on Windows (cp1252 encoding).
- **Fix applied:** Replaced emoji with ASCII-safe `[WARNING]` prefix.
  ```diff
  -            print("⚠️  No chunks found in data/processed/. "
  +            print("[WARNING] No chunks found in data/processed/. "
  ```

---

## Change #7 — Updated `src/orchestrator/manager.py` (File Upload Support)

- **Action:** Added `ingest_file()` method to `MockManager`.
- **What it does:**
  1. Copies uploaded file to `data/raw/`.
  2. Dynamically imports `cleaner.py` and runs the cleaning + chunking pipeline.
  3. Handles PDF (via `pdfplumber`), DOCX (via `python-docx`), TXT, and MD files.
  4. Writes `.cleaned.txt` and `.chunks.jsonl` to `data/processed/`.
  5. Rebuilds the BM25 index by calling `KeywordEngine().build_index()`.
  6. Uses `asyncio.to_thread()` to avoid blocking the Chainlit event loop.
- **Added imports:** `shutil`, `logging`, `pathlib.Path`, `asyncio`.
- **Added constants:** `RAW_DIR`, `PROCESSED_DIR`, `SUPPORTED_EXTENSIONS`.

---

## Change #8 — Updated `app.py` (File Upload Handling in UI)

- **Action:** Added file upload detection and processing to `on_message`.
- **What it does:**
  - Checks `message.elements` for file attachments.
  - For each attached file, calls `manager.ingest_file(file_name, file_path)`.
  - Shows a processing indicator, then displays success/failure message with chunk count.
  - Supports uploading a file AND asking a question in the same message — file is ingested first, then the question is answered.
  - Added a welcome message in `on_chat_start` mentioning upload capability.

---

## Dependency Installed

- **`pdfplumber`** — installed via `pip install pdfplumber` to fix `ModuleNotFoundError` when running the ingestion pipeline.

---

## Current File State Summary

| File                          | Status        | Description                                                    |
| ----------------------------- | ------------- | -------------------------------------------------------------- |
| `app.py`                      | **Modified**  | Chainlit UI with file upload + MockManager question flow       |
| `src/orchestrator/manager.py` | **Modified**  | MockManager with `get_tri_hybrid_response()` + `ingest_file()` |
| `src/retrieval/bm25_index.py` | **Recreated** | KeywordEngine with empty-corpus guard                          |
| `chainlit.md`                 | **Modified**  | Tri-Hybrid branding (USER modified)                            |

---

## Architecture Flow

```
User (Chainlit UI)
  |
  |-- Upload file --> manager.ingest_file()
  |       |
  |       +--> Copy to data/raw/
  |       +--> cleaner.py (extract + clean)
  |       +--> Chunk to data/processed/*.chunks.jsonl
  |       +--> Rebuild BM25 index
  |
  |-- Ask question --> manager.get_tri_hybrid_response()
          |
          +--> [Mock mode: returns hardcoded response]
          +--> [Future: BM25 + Neo4j Graph + LLM pipeline]
```

---

## Phase 3 — The Great Merge

> **Session Date:** 2026-03-01

---

### Step 1 — The Purge (Remove Test Data)

**Timestamp:** 2026-03-01T14:55:00+05:30

**Objective:** Cleanse all engine modules of hardcoded test data and `if __name__` execution blocks to make them pure, importable modules.

**Files Scanned:** 15 Python files in `src/` (including `__init__.py` files).

**Files Cleansed:**

| #   | File                            | What Was Removed                                                                                                                                                                            |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/graph_engine/builder.py`   | `if __name__ == "__main__":` block (lines 122-131): instantiated `GraphBuilder`, checked Neo4j connectivity, ran `test_text` through `process_text()`.                                      |
| 2   | `src/graph_engine/extractor.py` | `if __name__ == "__main__":` block (lines 73-79): instantiated `GraphExtractor`, hardcoded `test_text`, printed extracted JSON.                                                             |
| 3   | `src/graph_engine/neo4j_ops.py` | `if __name__ == "__main__":` block (lines 96-103): instantiated `Neo4jConnector`, tested connectivity with emoji output.                                                                    |
| 4   | `src/ingest/processor.py`       | `if __name__ == "__main__":` block (lines 162-177): argparse CLI entrypoint. Also removed orphaned `import argparse`. The reusable `main()` function was **preserved**.                     |
| 5   | `src/splitter/textSplitter.py`  | Hardcoded `sample_text` variable (AI text repeated 40x), module-level `chunks = chunk_text(sample_text)` call, and print loop. Only the reusable `chunk_text()` function was **preserved**. |

**Files Already Clean (No Changes Needed):**

| File                              | Reason                                  |
| --------------------------------- | --------------------------------------- |
| `src/retrieval/bm25_index.py`     | No `__main__` block, no test variables. |
| `src/orchestrator/manager.py`     | No `__main__` block, no test variables. |
| `src/ingest/cleaner.py`           | No `__main__` block, no test variables. |
| `src/ingest/config.py`            | Placeholder file (3 lines, future use). |
| `src/vector_engine/store.py`      | Empty file.                             |
| All `__init__.py` files (5 files) | Empty package markers.                  |

**Status:** ✅ Complete

---

### Step 2 — Tri-Hybrid Orchestrator Merge

**Timestamp:** 2026-03-01T15:00:00+05:30

**Objective:** Rewrite `src/orchestrator/manager.py` to import and execute all three brains concurrently; create the missing VectorStore; and update `app.py` to display all three retrieval outputs.

**Files Created:**

| File                         | Description                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/vector_engine/store.py` | **VectorStore** class — the Semantic Brain. Uses `sentence-transformers` (`all-MiniLM-L6-v2`, 384-dim) for embeddings and `faiss-cpu` (`IndexFlatIP` for cosine similarity) for retrieval. Mirrors KeywordEngine's API: `build_index()` / `load_index()` / `search()`. Lazy-loads heavy dependencies for fast startup. Persists `faiss.index` + `faiss_meta.pkl` to `data/artifacts/`. |

**Files Rewritten:**

| File                          | What Changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/orchestrator/manager.py` | **Complete rewrite** — now imports all three brains: `KeywordEngine` (BM25), `Neo4jConnector` (Graph), `VectorStore` (FAISS). Added `generate_answer(query)` method that runs all three retrievals **concurrently** via `asyncio.gather(asyncio.to_thread(...))`. Builds a fused `context_block` with headers `[Keyword Context]`, `[Graph Context]`, `[Semantic Context]`. Uses a strict anti-hallucination system prompt requiring cross-referencing across sources. Calls Groq LLM (`meta-llama/llama-4-scout-17b-16e-instruct`). `get_response()` kept as backward-compatible alias. File ingestion now rebuilds BOTH BM25 and FAISS indices concurrently. |

**Files Modified:**

| File     | What Changed                                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.py` | Updated Glass Box reasoning panel to show all three brains: Fast Brain (BM25), Deep Brain (Graph), Semantic Brain (FAISS) with similarity scores. Step name changed to "Tri-Hybrid Orchestrator". Added `vector_results` extraction from response dict. |

**Key Design Decisions:**

1. **Concurrent retrieval** — All three `_retrieve_*` methods are synchronous internally but wrapped in `asyncio.to_thread()` and dispatched via `asyncio.gather()` so they run in parallel threads without blocking Chainlit's event loop.
2. **Graceful degradation** — Each brain is independently guarded with a `_*_ready` flag. If Neo4j is offline or FAISS isn't built yet, the remaining brains still operate.
3. **Anti-hallucination prompt** — The system prompt mandates: (a) answer ONLY from the context_block, (b) cross-reference graph entities with textual chunks before stating facts, (c) cite retrieval sources in the answer, (d) refuse if context is insufficient.
4. **Index co-rebuild** — `ingest_file()` now rebuilds BM25 and FAISS indices concurrently after a file upload so both search engines are immediately up-to-date.
5. **Backward compatibility** — `get_response()` is an alias for `generate_answer()` so `app.py` continues to work without changes to its call sites.

**Architecture Flow (Updated):**

```
User (Chainlit UI)
  |
  |-- Upload file --> manager.ingest_file()
  |       |
  |       +--> Copy to data/raw/
  |       +--> cleaner.py (extract + clean)
  |       +--> Chunk to data/processed/*.chunks.jsonl
  |       +--> Rebuild BM25 index   } concurrent
  |       +--> Rebuild FAISS index  }
  |
  |-- Ask question --> manager.generate_answer(query)
          |
          +--> asyncio.gather(
          |        _retrieve_bm25(query),     # Fast Brain
          |        _retrieve_graph(query),     # Deep Brain
          |        _retrieve_vector(query),    # Semantic Brain
          |    )
          |
          +--> Fuse into context_block:
          |        [Keyword Context]
          |        [Graph Context]
          |        [Semantic Context]
          |
          +--> Groq LLM (strict system prompt)
          |
          +--> Return structured response
```

**Status:** ✅ Complete

---

### Step 3 — UI Polish & Branding

**Timestamp:** 2026-03-01T15:08:00+05:30

**Objective:** Update the Chainlit frontend to reflect the full Tri-Hybrid integration, establish the Edu Nexus brand identity, implement Visual Chain-of-Thought with three sequential brain steps, and switch the LLM model to `openai/gpt-oss-120b`.

**Files Created / Moved:**

| Action            | Path                                      | Detail                                          |
| ----------------- | ----------------------------------------- | ----------------------------------------------- |
| Created directory | `.chainlit/public/`                       | Required by Chainlit for serving static assets. |
| Copied            | `logo.png` -> `.chainlit/public/logo.png` | Bot avatar and header logo source.              |

**Files Modified:**

| File                          | What Changed                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.chainlit/config.toml`       | Assistant name set to `"Edu Nexus"`. Dark theme enabled (`default_theme = "dark"`). Wide layout enabled (`layout = "wide"`). `logo_file_url` and `default_avatar_file_url` both set to `"/public/logo.png"`. Chain-of-Thought display mode already `"full"`. |
| `src/orchestrator/manager.py` | LLM model changed from `meta-llama/llama-4-scout-17b-16e-instruct` to **`openai/gpt-oss-120b`** (user directive).                                                                                                                                            |
| `app.py`                      | **Full rewrite** — see details below.                                                                                                                                                                                                                        |

**`app.py` Changes in Detail:**

1. **Brand identity** — All `cl.Message(...)` calls now include `author="Edu Nexus"`, which Chainlit maps to the avatar image at `/public/logo.png`.
2. **Avatar setup** — `cl.Avatar(name="Edu Nexus", path="logo.png")` is sent on chat start so the bot avatar renders from the first message.
3. **Welcome message** — Rich Markdown with a table describing the three brains (Fast Brain / Deep Brain / Semantic Brain) and a tip about reasoning steps.
4. **Visual Chain-of-Thought** — Instead of one monolithic `cl.Step`, questions now produce **three sequential, named steps**:
   - `async with cl.Step(name="Scanning Keywords (BM25)...")` — shows BM25 chunk previews
   - `async with cl.Step(name="Traversing Knowledge Graph (Neo4j)...")` — shows graph triples
   - `async with cl.Step(name="Searching Semantic Vectors (FAISS)...")` — shows vector results with similarity scores
5. **Orchestrator call** — `manager.generate_answer(query)` is called once (all three brains run concurrently inside), and the response dict is unpacked into the three visual steps.
6. **File upload** — Ingestion success message updated to mention both BM25 + FAISS index rebuilds.

**LLM Model Change:**

| Component                       | Before                                      | After                           |
| ------------------------------- | ------------------------------------------- | ------------------------------- |
| `src/orchestrator/manager.py`   | `meta-llama/llama-4-scout-17b-16e-instruct` | `openai/gpt-oss-120b`           |
| `src/graph_engine/extractor.py` | `openai/gpt-oss-120b`                       | _(no change — already correct)_ |

**Status:** ✅ Complete

---

### Step 4 — UI Fixes, Health Checks & Glass-Box Enhancements

**Timestamp:** 2026-03-01T16:20:00+05:30

**Objective:** Fix the `Avatar` KeyError crash, fix the cascading `NoneType` manager error, add service health checks on startup, add detailed file processing pipeline visualization, show orchestrator strategy decisions, fix Keras 3 compatibility, and create setup/run scripts.

**Bugs Fixed:**

| Bug                                                | Root Cause                                                                                                                                                                    | Fix                                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `KeyError: 'Avatar'`                               | `cl.Avatar` was removed in Chainlit 2.x (deprecated since v1.1.300). The code used the old API.                                                                               | Removed `cl.Avatar(...)` call. Avatars now use the file-based system: place logo at `.chainlit/public/avatars/edu nexus.png`. |
| `'NoneType' object has no attribute 'ingest_file'` | Cascade from the Avatar crash — `on_chat_start()` failed before `OrchestratorManager()` was stored in `cl.user_session`, so `cl.user_session.get("manager")` returned `None`. | Fixed root cause (Avatar removed). Added null check on `manager` in `on_message()` with user-friendly error.                  |
| Logo not visible                                   | The Avatar crash prevented UI initialization; config was already correct (`logo_file_url = "/public/logo.png"`).                                                              | Fixed by removing the crashing Avatar code.                                                                                   |
| `Keras 3 not supported in Transformers`            | `sentence-transformers` pulls in `transformers` which requires `tf-keras` shim when Keras 3 (from TensorFlow) is installed.                                                   | Added `tf-keras` to `requirements.txt`.                                                                                       |

**Features Added:**

| Feature                               | Description                                                                                                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Service Health Check**              | On `on_chat_start()`, displays a health table showing ✅/❌ status for each brain (BM25, Neo4j, FAISS) with a colored banner (🟢 all ok / 🟡 partial / 🔴 none).                                                                             |
| **Detailed File Processing Pipeline** | File uploads now show a master "File Processing Pipeline" step with 6 sub-steps: (1) Validating File, (2) Saving to Raw Storage, (3) Cleaning & Text Extraction, (4) Chunking, (5) Rebuilding BM25 Index, (6) Rebuilding FAISS Vector Index. |
| **Post-Ingestion Health Update**      | After file ingestion, shows an updated service status table.                                                                                                                                                                                 |
| **Orchestrator Strategy Visibility**  | Before each query, shows a "Strategy — Deciding Retrieval Plan" step explaining which brains are online/offline, the selected strategy label (e.g. `Fast+Deep+Semantic`), and how many brains will run concurrently.                         |
| **LLM Synthesis Step**                | Shows a "LLM Synthesis — Generating Answer" step with context fusion details and rules enforced.                                                                                                                                             |
| **Null Manager Guard**                | `on_message()` now gracefully handles `manager == None` instead of crashing.                                                                                                                                                                 |

**Files Created:**

| File             | Description                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `run.bat`        | Batch script: creates venv, activates, installs deps, sets up avatar, launches Chainlit. |
| `HOW_TO_RUN.txt` | Plain text step-by-step CLI instructions.                                                |

**Files Modified:**

| File               | What Changed                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.py`           | Complete rewrite — removed `cl.Avatar`, added health checks, 6-step file processing pipeline, strategy visibility, LLM synthesis step, null manager guard. |
| `requirements.txt` | Added `tf-keras`, removed `google-generativeai` (user change), removed duplicate `tqdm`, bumped `chainlit>=2.0.0`, reorganized with clearer comments.      |

**Files Deleted (by USER):**

| File              | Reason                                            |
| ----------------- | ------------------------------------------------- |
| `setup_avatar.py` | USER deleted; functionality moved into `run.bat`. |

**Status:** ✅ Complete

---

### Step 5 — LLM-Routed Strategy & Neo4j Graph Fix

**Timestamp:** 2026-03-01T17:06:00+05:30

**Objective:** Replace blind "run all brains" approach with an LLM Router that intelligently selects which brain(s) to invoke per query. Fix Neo4j graph engine (wasn't building graphs from uploaded documents, and old data wasn't cleaned).

**Architecture Change — LLM Router:**

The orchestrator now uses **two separate LLM models**:

| Role       | Model                              | Purpose                                                                   |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------- |
| **Router** | `openai/gpt-oss-120b`              | Analyzes query → decides which brain(s) to invoke (like function calling) |
| **Answer** | `moonshotai/kimi-k2-instruct-0905` | Synthesises final answer from retrieved context                           |

**How the Router works:**

1. Router receives the query + list of available (online) brains.
2. Router prompt describes each brain's strengths (keyword=exact lookups, graph=relationships, semantic=conceptual).
3. Router responds with JSON: `{"brains": ["keyword", "semantic"], "reasoning": "..."}`.
4. Only the chosen brains execute (via `asyncio.gather`).
5. If the Router fails, all available brains are used as fallback.

**Neo4j Fixes:**

| Issue                                     | Fix                                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Old data persists across sessions         | Added `_purge_neo4j()` — runs `MATCH (n) DETACH DELETE n` on startup                                                                          |
| Graph never built from uploaded documents | Added `_build_graph()` — uses `GraphBuilder` + `GraphExtractor` during file ingestion to extract entities/relations via LLM and push to Neo4j |
| Graph queries returning empty             | Old data had no matching node names for new queries; now graph is built fresh from each document                                              |

**File Ingestion Pipeline (Updated):**

```
Upload file → copy to data/raw/
  → clean + chunk (cleaner.py)
  → write .chunks.jsonl
  → rebuild BM25 index        } concurrent
  → rebuild FAISS index        }
  → build Neo4j graph (extract entities via LLM, push to Neo4j)
```

**Query Pipeline (Updated):**

```
User query
  → Router LLM (openai/gpt-oss-120b) → picks brain(s)
  → Execute ONLY chosen brains (concurrent)
  → Fuse context block (only chosen sections)
  → Answer LLM (moonshotai/kimi-k2-instruct-0905) → final response
```

**Files Rewritten:**

| File                          | What Changed                                                                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/orchestrator/manager.py` | Complete rewrite — added LLM Router, Neo4j purge on startup, graph building during ingestion, selective brain execution                                                      |
| `app.py`                      | Updated to show Router decision (chosen vs skipped brains + reasoning), only display steps for chosen brains, added graph building step in pipeline, updated welcome message |

**Status:** ✅ Complete
