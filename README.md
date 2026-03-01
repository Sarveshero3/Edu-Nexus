# Edu Nexus: Tri-Hybrid GraphRAG Engine

**Edu Nexus** is a Zero-Cost University Semantic Search Engine using a Tri-Hybrid retrieval strategy (Vector + Keyword + Graph).

## 🚧 Current Status
**Focus:** The current implementation is fully integrated across the **Graph Engine**, **Ingestion Pipeline**, **Vector Engine**, and the UI **Orchestrator**.
- **Implemented:** Ingestion pipeline (PDF/DOCX cleaning), Graph extraction (Groq openai/gpt-oss-120b), Neo4j operations, Text Splitting, Vector Engine (FAISS + SentenceTransformers), and an Orchestrator integrating them with a Chainlit UI interface.
- **Pending:** Further optimizations and advanced retrieval logic.

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
2. `python -m venv venv` and activate it.
3. `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill in API keys (GROQ_API_KEY, NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD).
5. Run the application:
   ```bash
   chainlit run app.py
   ```

## 📂 Project Structure

```text
Edu-Nexus/
├── .chainlit/            # Chainlit UI configurations and translations
├── .env                  # [SECRET] API Keys (Groq, Neo4j, Gemini) - DO NOT COMMIT
├── .env.example          # [PUBLIC] Template for API keys
├── .gitignore            # Files to exclude from Git
├── HOW_TO_RUN.txt        # Run instructions
├── app.py                # Chainlit UI entry point
├── chainlit.md           # Chainlit UI Welcome Screen configuration
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
    ├── splitter/         # [MODULE] Text Splitting (Saatvik) - [ACTIVE]
    │   └── textSplitter.py # Logic: Chunking text
    │
    ├── vector_engine/    # [MODULE] Vector Database (Saatvik) - [ACTIVE]
    │   ├── store.py      # Logic: Semantic Brain using FAISS
    │   └── vector.py     # Logic: Chunking & FAISS Operations via Langchain
    │
    ├── graph_engine/     # [MODULE] Knowledge Graph (Sarvesh) - [ACTIVE]
    │   ├── builder.py    # Logic: Orchestration (Extract -> Push to Neo4j)
    │   ├── extractor.py  # Logic: LLM Entity Extraction (Groq openai/gpt-oss-120b)
    │   └── neo4j_ops.py  # Logic: Neo4j Cypher Queries
    │
    └── orchestrator/     # [MODULE] The Brain (Sarvesh) - [ACTIVE]
        └── manager.py    # Logic: Routing (Graph vs Vector vs Keyword) and Web UI connection
```


