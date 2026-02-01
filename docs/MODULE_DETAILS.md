# Module Details & Technical Specifications

This document provides a deep dive into the implemented modules, their files, processing logic, and the technology stack used.

## 1. Text Splitter Module (`src/splitter/`)

### File: `textSplitter.py`
- **Author:** Saatvik
- **Purpose:** Pre-processes raw text by breaking it into manageable chunks suitable for embedding and LLM processing.
- **Tech Stack:**
  - **Library:** `langchain_text_splitters`
  - **Class:** `RecursiveCharacterTextSplitter`
- **Processing Logic:**
  - The text is split using a hierarchy of separators (`\n\n`, `\n`, ` `, ``).
  - **Chunk Size:** 500 characters.
  - **Overlap:** 50 characters.
- **Why this Tech?**
  - **LangChain:** Provides industry-standard, robust splitting algorithms.
  - **Recursive Splitting:** Ensures that semantically related text (paragraphs/sentences) stays together as much as possible, which is crucial for maintaining context in RAG systems.
  - **Overlap:** Prevents context loss at the edges of chunks.

---

## 2. Graph Engine Module (`src/graph_engine/`)

### File: `extractor.py`
- **Purpose:** Extracts Knowledge Graph entities (Nodes) and relationships (Edges) from text chunks.
- **Tech Stack:**
  - **API:** Groq Cloud API
  - **Model:** `openai/gpt-oss-120b` (an open-weights model hosted by Groq)
  - **Library:** `groq` (Python client), `dotenv`
- **Processing Logic:**
  - Accepts a text chunk as input.
  - Sends the text to the LLM with a strict System Prompt enforcing a specific JSON schema (`nodes`, `relationships`).
  - Parses the JSON response, handling potential formatting errors (e.g., Markdown wrapping).
- **Why this Tech?**
  - **Groq:** Offers extremely fast inference speeds (LPU inference engine), which is critical for processing large volumes of text in real-time.
  - **openai/gpt-oss-120b:** A powerful open model that provides high-quality extraction without the cost of proprietary models like GPT-4.
  - **Strict JSON:** Ensures the output can be directly ingested by the database without complex post-processing.

### File: `neo4j_ops.py`
- **Purpose:** Handles all low-level interactions with the Neo4j Graph Database.
- **Tech Stack:**
  - **Database:** Neo4j (AuraDB or Local)
  - **Library:** `neo4j` (Official Python Driver)
- **Processing Logic:**
  - Manages the driver connection (Lifecycle management).
  - Provides a `run_cypher` method that executes Cypher queries within a session.
  - Handles connectivity verification and error logging.
- **Why this Tech?**
  - **Neo4j:** The leading graph database, essential for storing complex relationships between entities (e.g., `Professor TEACHES Course`).
  - **Official Driver:** Ensures thread safety and correct handling of connection pools.

### File: `builder.py`
- **Purpose:** The Orchestrator for the Graph construction pipeline.
- **Tech Stack:**
  - **Language:** Python (Standard Library)
- **Processing Logic:**
  1. **Input:** Takes raw text.
  2. **Extraction:** Calls `extractor.py` to get structured data.
  3. **Ingestion:** Iterates through the extracted nodes and relationships.
  4. **Query Construction:** Dynamically builds Cypher `MERGE` queries (idempotent writes) to ensure no duplicates are created.
  5. **Execution:** Delegates execution to `neo4j_ops.py`.
- **Why this Tech?**
  - **Modular Design:** Separating the "Coordinator" (Builder) from the "Worker" (Extractor) and "Storage" (Neo4jOps) makes the code testable and maintainable.
  - **MERGE Queries:** Using `MERGE` instead of `CREATE` ensures that if we process the same text twice, we don't end up with duplicate nodes.
