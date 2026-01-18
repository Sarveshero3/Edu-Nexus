# Edu Nexus: Tri-Hybrid GraphRAG Engine

**Edu Nexus** is a Zero-Cost University Semantic Search Engine using a Tri-Hybrid retrieval strategy (Vector + Keyword + Graph).

## Architecture
- **Semantic Brain:** FAISS + SentenceTransformers (Vector Search)
- **Fast Brain:** BM25 (Keyword Search)
- **Deep Brain:** Neo4j + Groq Llama-3 (Graph Search)

## Team Roles
- **Arch/Core:** Sarvesh (Orchestrator, Graph Logic, Main Repo)
- **Data Eng:** Swaraj (PDF Cleaning Pipeline)
- **Vector Eng:** Saatvik (Chunking & FAISS Store)
- **QA/Ops:** Kulvansh (Data Collection)

## Setup
1. Clone the repo.
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill in API keys.
4. Run `chainlit run main.py -w`

## 📂 Project Structure

```text
Edu-Nexus/
├── .env                  # [SECRET] API Keys (Groq, Neo4j, Gemini) - DO NOT COMMIT
├── .env.example          # [PUBLIC] Template for API keys
├── .gitignore            # Files to exclude from Git
├── config.py             # Global paths and configuration constants
├── main.py               # [ENTRY POINT] Chainlit UI & Application Loop
├── requirements.txt      # Python dependencies
├── README.md             # Project documentation
│
├── data/                 # Shared Data Storage
│   ├── raw/              # [INPUT] Raw PDFs go here (Kulvansh)
│   ├── processed/        # [INTERMEDIATE] Cleaned .txt files (Swaraj)
│   └── artifacts/        # [OUTPUT] FAISS indices & metadata (Saatvik)
│
├── notebooks/            # Jupyter notebooks for prototyping
│
└── src/                  # Source Code
    ├── __init__.py
    │
    ├── ingest/           # [MODULE] Data Engineering (Swaraj)
    │   ├── __init__.py
    │   └── cleaner.py    # Logic: PDF -> Clean Text
    │
    ├── vector_engine/    # [MODULE] Vector Database (Saatvik)
    │   ├── __init__.py
    │   └── store.py      # Logic: Chunking & FAISS Operations
    │
    ├── graph_engine/     # [MODULE] Knowledge Graph (Sarvesh)
    │   ├── __init__.py
    │   ├── extractor.py  # Logic: LLM Entity Extraction (Groq)
    │   └── neo4j_ops.py  # Logic: Neo4j Cypher Queries
    │
    └── orchestrator/     # [MODULE] The Brain (Sarvesh)
        ├── __init__.py
        └── manager.py    # Logic: Routing (Graph vs Vector vs Keyword)