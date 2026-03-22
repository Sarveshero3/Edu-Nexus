# Edu Nexus — Tri-Hybrid GraphRAG Academic Engine

**Edu Nexus** is a zero-cost university semantic search engine powered by a **Tri-Hybrid RAG** strategy (BM25 + FAISS + Neo4j). Upload research papers, query across three AI retrieval engines, and build knowledge graphs — all in one unified academic workspace.

## Architecture

| Brain | Engine | Purpose |
|-------|--------|---------|
| **Semantic** | FAISS + SentenceTransformers | Vector similarity search over document embeddings |
| **Keyword** | BM25 (Okapi) | Exact-match lexical retrieval |
| **Graph** | Neo4j + Groq LLM | Knowledge graph traversal and relationship discovery |

A Groq-hosted LLM acts as the **intelligent router**, deciding which brain(s) to invoke per query, then fusing the results into a final grounded answer with chain-of-thought transparency.

## 📂 Project Structure (Overview)

> **New to the project?** See [MODULE_DETAILS.md](MODULE_DETAILS.md) for a functional introduction and [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for a deep-dive directory map.

```text
Edu-Nexus/
├── data/                 # Stores raw PDFs, processed JSON chunks, and active serialized FAISS/BM25 Index artifacts.
├── docs/                 # Internal system documentation.
├── frontend/             # Dedicated React/Next web assets bridging the API.
├── src/                  # Tri-Hybrid retrieval engine source components (Graph, Vector, Lexical keyword).
├── tests/                # Testing framework suites.
├── app.py                # Chainlit UI/API orchestrator runtime entry point.
├── config.py             # Root configurations, embedding models, and runtime paths.
├── PROJECT_STRUCTURE.md  # Detailed, granular breakdown of the directory map.
└── MODULE_DETAILS.md     # Detailed functional map linking crucial files to their operations.
```

