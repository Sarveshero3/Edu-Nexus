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

