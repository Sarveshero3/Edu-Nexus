# Edu Nexus: Tri-Hybrid GraphRAG Engine

**Edu Nexus** is a Zero-Cost University Semantic Search Engine using a Tri-Hybrid retrieval strategy (Vector + Keyword + Graph).

## 🚧 Current Status
**Focus:** The current implementation is focused on the **Graph Engine** (`src/graph_engine`) and **Ingestion Pipeline** (`src/ingest`).
- **Implemented:** Ingestion pipeline (PDF/DOCX cleaning), Graph extraction (Groq openai/gpt-oss-120b), Neo4j operations, and Text Splitting.
- **Pending:** Vector Engine and Orchestrator are currently placeholders.

## Architecture
- **Semantic Brain:** FAISS + SentenceTransformers (Vector Search)
- **Fast Brain:** BM25 (Keyword Search)
- **Deep Brain:** Neo4j + Groq openai/gpt-oss-120b (Graph Search)
- **Cleaner:** Gemini 1.5 Flash (Data Cleaning)

## Team Roles
- **Arch/Core:** Sarvesh (Orchestrator, Graph Logic, Main Repo)
- **Data Eng:** Swaraj (PDF Cleaning Pipeline)
- **Vector Eng:** Saatvik (Chunking & FAISS Store)
- **QA/Ops:** Kulvansh (Data Collection)

## Setup
1. Clone the repo.
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill in API keys (GROQ_API_KEY, NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD).
4. Test the Graph Engine:
   ```bash
   python src/graph_engine/builder.py
   ```

## 📂 Project Structure

```text
Edu-Nexus/
├── .env                  # [SECRET] API Keys (Groq, Neo4j, Gemini) - DO NOT COMMIT
├── .env.example          # [PUBLIC] Template for API keys
├── .gitignore            # Files to exclude from Git
├── config.py             # Global paths and configuration constants
├── requirements.txt      # Python dependencies
├── README.md             # Project documentation
│
├── data/                 # Shared Data Storage
│   ├── raw/              # [INPUT] Raw PDFs go here (Kulvansh)
│   ├── processed/        # [INTERMEDIATE] Cleaned .txt files (Swaraj)
│   └── artifacts/        # [OUTPUT] FAISS indices & metadata (Saatvik)
│
├── src/                  # Source Code
    ├── ingest/           # [MODULE] Data Engineering (Swaraj) - [ACTIVE]
    │   ├── processor.py  # Logic: Batch processing & DOCX extraction
    │   └── cleaner.py    # Logic: PDF extraction & Text Cleaning
    │
    ├── splitter/         # [MODULE] Text Splitting (Saatvik)
    │   └── textSplitter.py # Logic: Chunking text
    │
    ├── vector_engine/    # [MODULE] Vector Database (Saatvik) - [PENDING]
    │   └── store.py      # Logic: Chunking & FAISS Operations
    │
    ├── graph_engine/     # [MODULE] Knowledge Graph (Sarvesh) - [ACTIVE]
    │   ├── builder.py    # Logic: Orchestration (Extract -> Push to Neo4j)
    │   ├── extractor.py  # Logic: LLM Entity Extraction (Groq openai/gpt-oss-120b)
    │   └── neo4j_ops.py  # Logic: Neo4j Cypher Queries
    │
    └── orchestrator/     # [MODULE] The Brain (Sarvesh) - [PENDING]
        └── manager.py    # Logic: Routing (Graph vs Vector vs Keyword)
```


