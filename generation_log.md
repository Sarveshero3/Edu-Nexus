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
