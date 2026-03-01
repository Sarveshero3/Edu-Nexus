# Module Details & Technical Specifications

This document provides a comprehensive overview of all the files, folders, implemented modules, their processing logic, and the overall technology stack used in **Edu Nexus**.

## 📁 Root Directory Files

### `app.py`

- **Purpose**: The main entry point for the Chainlit web interface.
- **Responsibilities**:
  - Initializes the Chainlit UI session and instantiates the `OrchestratorManager`.
  - Handles real-time file uploads (PDF, DOCX, TXT, MD) through the UI and pipelines them into the ingestion workflow.
  - Manages the question-answering conversational flow.
  - Renders the "Glass Box" reasoning output dynamically, showing the retrieval strategy chosen, the retrieved BM25 chunk preview, and graph triples to the user.

### `config.py`

- **Purpose**: Centralized configuration and path management.
- **Responsibilities**: Defines immutable paths to data directories (raw, processed, artifacts) locally and sets universal constants such as the default HuggingFace embedding model (`all-MiniLM-L6-v2`).

### `.env` & `.env.example`

- **Purpose**: Environment variable management.
- **Responsibilities**: Stores sensitive API keys such as `GROQ_API_KEY`, and database credentials (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`).

### `chainlit.md`

- **Purpose**: UI Welcome Screen configuration.
- **Responsibilities**: A markdown file that Chainlit reads to display an introduction and specific upload instructions when a user opens the web app.

### `generation_log.md`

- **Purpose**: Task/Log tracking.
- **Responsibilities**: Contains tracking and structural updates regarding what functions and features have been integrated iteratively.

### `requirements.txt`

- **Purpose**: Dependency management.
- **Responsibilities**: Lists all Python libraries required to install the project dependencies safely (e.g. `chainlit`, `groq`, `neo4j`, `rank_bm25`, `langchain_text_splitters`, etc.).

---

## 📁 Data Directories (`data/`)

The `data/` folder manages the lifecycle of document ingestion and indexing storage.

### `data/raw/`

- **Purpose**: The foundational drop zone for unprocessed files uploaded by users. Serves as the raw collection state.

### `data/processed/`

- **Purpose**: Stores intermediate text assets.
- **Details**: Outputs from the processing module go here. This includes standardized and cleaned text files as well as fully localized `.chunks.jsonl` files.

### `data/artifacts/`

- **Purpose**: Contains the compiled engine indices.
- **Details**: Stores serialized databases that are built off the processed chunks. For example, the `bm25.pkl` which represents the Okapi BM25 lexical keyword index.

---

## 📁 Source Code Modules (`src/`)

### 1. Orchestrator Module (`src/orchestrator/`)

#### File: `manager.py` (The Brain)

- **Author:** Sarvesh
- **Purpose**: Central intelligence coordinator that aggregates components of the RAG retrieval strategies.
- **Tech Stack**: Python, `asyncio`, Groq API (`meta-llama/llama-4-scout-17b-16e-instruct`).
- **Processing Logic**:
  - Determines retrieval strategy natively based on the active state of engines (`both`, `bm25_only`, `graph_only`, `none`).
  - Fetches context jointly across BM25 Engine and Neo4j Engine.
  - Validates and fuses the combined textual knowledge.
  - Instructs a powerful Groq Inference LLM over the contextual fragments avoiding hallucination bounds.
  - Dynamically runs indexing reconstruction flows whenever fresh files are consumed by the system.

### 2. Retrieval Module (`src/retrieval/`)

#### File: `bm25_index.py` (Fast Brain)

- **Purpose**: Performs high-speed lexical and keyword similarity queries over documents.
- **Tech Stack**: `rank_bm25` (Okapi BM25 structural algorithm implementation).
- **Processing Logic**:
  - Dynamically scours the chunk boundaries contained strictly in the `.chunks.jsonl` objects.
  - Builds robust indices handling lexical search features (e.g. stopword dropping, string tokenization).
  - Serializes (`pickle`) the index and state map directly back to `data/artifacts/bm25.pkl`.
  - Calculates probability scoring mechanisms to supply exact matching document bounds to the Orchestrator manager.

### 3. Graph Engine Module (`src/graph_engine/`)

#### File: `builder.py`

- **Author:** Sarvesh
- **Purpose**: The structural director representing DB pipeline pushes.
- **Processing Logic**: Orchestrates DB ingestion converting data using the Extractor natively into graph form mapping `MERGE` parameters handling duplicates gracefully over the Neo4j API.

#### File: `extractor.py`

- **Purpose**: Sub-engine focused upon Knowledge Graph Entity (Node) and Semantic Edge (Relationship) identification.
- **Tech Stack**: Groq API, Model: `openai/gpt-oss-120b`.
- **Processing Logic**: Reads the granular subsets and pushes context up via rigid System prompts constraining JSON structures. Built purely using ultra-high processing parameters.

#### File: `neo4j_ops.py`

- **Purpose**: Execution connectivity point for Database bridging.
- **Tech Stack**: Neo4j, `neo4j` Python driver.
- **Processing Logic**: Instantiates driver, manages the sessions securely, manages test-cycles and injects Cypher scripts.

### 4. Ingest Module (`src/ingest/`)

#### File: `processor.py`

- **Purpose**: The core logic boundary sorting initial uploads.
- **Tech Stack**: `python-docx`, `pdfplumber`.
- **Processing Logic**: Determines file extensions and delegates extraction logic paths for standardizing content into uniformly predictable text elements ensuring the data acts neutrally.

#### File: `cleaner.py`

- **Author:** Swaraj
- **Purpose**: Sanitization logic application scaling out text noise.
- **Processing Logic**: Employs Regex heuristics scanning standard documentation and strips page numbering, recurrent artifacts, or broken hyphens to ensure zero-cost processing overhead prior to moving content natively into chunking.

### 5. Text Splitter Module (`src/splitter/`)

#### File: `textSplitter.py`

- **Author:** Saatvik
- **Purpose**: Defines size bounds ensuring language model capacities aren't exceeded.
- **Tech Stack**: `langchain_text_splitters` (`RecursiveCharacterTextSplitter`).
- **Processing Logic**: Smashes combined strings predictably down from paragraphs into distinct blocks using specific separator hierarchies. Restricts bounds to 500 characters while preserving 50 character limits for surrounding contextual overlays.

### 6. Vector Engine Module (`src/vector_engine/`)

#### File: `store.py` (Semantic Brain)

- **Author:** Saatvik
- **Purpose**: Future placeholder representing the Vector mapping component algorithms.
- **Tech Stack**: FAISS + SentenceTransformers (pending integration).
- **Processing Logic**: Designed conceptually to interpret and map complex semantic relationships by deploying vector stores.

---

## 📁 Auxiliary Directories

### `docs/`

- **Purpose**: Retains supporting architectural documentation spanning API bounds internally to allow deeper onboarding and reference scoping across operations.

### `tests/`

- **Purpose**: Scaffolds integration layers and strict units evaluating the programmatic fidelity across discrete bounds inside Edu Nexus.

### `prompts/`

- **Purpose**: Holds system schemas defining contextual limitations forcing the external LLMs into desired outcomes natively without polluting Python functionality bounds.
