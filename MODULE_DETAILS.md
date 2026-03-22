# Module Details: A Developer's Onboarding Map 🗺️

Welcome to **Edu Nexus**. This document is designed to give you an immediate functional understanding of the most *critical* components defining our Tri-Hybrid GraphRAG Engine. It abstracts away boilerplate to focus purely on "**What file does what**" and "**Where it fits**" in the bigger picture.

---

## 🚀 The Entry Point (The Orchestrator)

### `app.py`
**The Front Door.** This is the main entry point to the application instance locally. It boots up the Chainlit UI, instantiates the underlying engines, ingests incoming files dropping them to the pipeline, and prints the "Glass Box" (showing exactly which retrieval strategy is at play: Vector, Graph, or Keyword).

### `src/orchestrator/manager.py`
**The Core Brain.** While `app.py` is the UI, the `manager.py` is the actual intelligence router. 
- **Role:** It actively queries the Lexical BM25, the Neo4j Knowledge Graph, and FAISS Vector engines. It fuses the returned information, verifies it contextually, and prompts a local LLM to deliver the final zero-hallucination semantic answer for the user.

---

## 🧠 The Tri-Hybrid Search Brains

Edu Nexus is powerful because it uses *three* concurrent search methodologies. These are mapped below:

### 1. The Deep Brain (Graph Engine)
*Location: `src/graph_engine/`*
This pipeline discovers relationships using the Groq `openai/gpt-oss-120b` LLM and stores them as Knowledge Graphs in Neo4j.
- **`extractor.py`**: The heavy lifter identifying precise "Entities" (Nodes) and semantic "Relationships" (Edges) from document text. 
- **`neo4j_ops.py` / `builder.py`**: Pushes the extracted structural mappings logically straight into the remote Neo4j databases (`MERGE` deduplication).

### 2. The Semantic Brain (Vector Engine)
*Location: `src/vector_engine/`*
This engine captures the embedded contextual *meaning* behind chunks of text.
- **`store.py`**: Creates semantic proximity layouts mapped into an offline FAISS local database using the standard `all-MiniLM-L6-v2` HuggingFace embeddings representation.

### 3. The Fast Brain (Keyword Lexical Engine)
*Location: `src/retrieval/`*
When explicit exact match indexing matters over broad semantic meaning.
- **`bm25_index.py`**: Analyzes the raw token sequences (Okapi BM25 algorithm), bypassing LLMs, ensuring critical terminology isn't missed by vector proximity models. 

---

## 🧹 The Ingestion Pipeline

To make retrieval efficient, raw incoming documents must be standardized. 
*Location: `src/ingest/` & `src/splitter/`*

- **`src/ingest/processor.py`**: Handles incoming raw PDFs or DOCX uploads and strips them into a uniform unstructured string. 
- **`src/ingest/cleaner.py`**: Fires Regex heuristic functions rapidly resolving recurring noises (such as page headers/footers) prior to embedding.
- **`src/splitter/textSplitter.py`**: Smarts-splits the cleaned master string into strict 500-character chunks to cap processing ceilings reliably. Ensures LLM context bounds are protected and fast.

---

## 🗄️ Standardized Data Formats

*Location: `data/`*

- **`data/raw/`**: Where initial files start out (messy, PDFs, docs).
- **`data/processed/`**: The pipeline transforms raw text directly into normalized local JSON structures (`.chunks.jsonl`).
- **`data/artifacts/`**: Where our Brains (`bm25.pkl` lexicons & `faiss.index` semantical vectors) securely cache to disk so rebooting doesn't require rebuilding embeddings.
