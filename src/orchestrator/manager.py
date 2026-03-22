"""
Orchestrator Manager -- Edu Nexus  (Phase 4 — LLM-Routed Tri-Hybrid)
=====================================================================
The central nervous system of Edu Nexus.  An **LLM Router**
(openai/gpt-oss-120b) analyses each query and *decides* which
retrieval brain(s) to invoke — like function calling:

  1. Fast Brain   — BM25 keyword search   (src.retrieval.bm25_index)
  2. Deep Brain   — Neo4j knowledge graph  (src.graph_engine)
  3. Semantic Brain — FAISS vector search  (src.vector_engine.store)

Only the chosen brain(s) execute.  Results are fused into a
``context_block`` and sent to the Answer LLM for final synthesis.
"""

from __future__ import annotations

import asyncio
import importlib.util
import json
import logging
import os
import re
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from dotenv import load_dotenv
from groq import Groq

from src.retrieval.bm25_index import KeywordEngine
from src.graph_engine.neo4j_ops import Neo4jConnector
from src.graph_engine.builder import GraphBuilder
from src.vector_engine.store import VectorStore
from src.ingest.extractor import extract_text
from src.ingest.extractor import SUPPORTED_EXTENSIONS as _EXTRACTOR_EXTENSIONS

load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("Orchestrator")

# ── Project paths ──────────────────────────────────────────────────────
RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")
ARTIFACTS_DIR = Path("data/artifacts")
SUPPORTED_EXTENSIONS = _EXTRACTOR_EXTENSIONS  # single source of truth from extractor

# ── LLM config ────────────────────────────────────────────────────────
ROUTER_MODEL = "openai/gpt-oss-120b"               # Decides strategy
ANSWER_MODEL = "moonshotai/kimi-k2-instruct-0905"   # Generates answer
BM25_TOP_K = 3
VECTOR_TOP_K = 3
GRAPH_RESULT_LIMIT = 8
MAX_CHUNK_WORDS = 200
MAX_CONTEXT_CHARS = 18000

# ── Router System Prompt ──────────────────────────────────────────────
ROUTER_PROMPT = (
    "You are the Strategy Router for a Tri-Hybrid RAG system.\n"
    "Your job is to analyze the user's query and decide exactly which "
    "retrieval brain(s) should be invoked to answer it.\n\n"
    "Available brains:\n"
    "1. **keyword** — BM25 lexical search. Best for: exact term lookups, "
    "definitions, specific names, acronyms, keyword-heavy factual questions.\n"
    "2. **graph** — Neo4j knowledge graph traversal. Best for: relationship "
    "questions (\"how does X relate to Y?\"), entity connections, taxonomy, "
    "cause-effect chains, structural/hierarchical queries.\n"
    "3. **semantic** — FAISS dense vector similarity. Best for: conceptual "
    "questions, paraphrased queries, thematic exploration, \"explain\" or "
    "\"describe\" style questions, broad topic summaries.\n\n"
    "Rules:\n"
    "- Pick 1-3 brains.  Fewer is better — only select what the query needs.\n"
    "- For a simple keyword lookup, just pick 'keyword'.\n"
    "- For relationship queries, always include 'graph'.\n"
    "- For broad/conceptual questions, include 'semantic'.\n"
    "- If unsure, pick 'keyword' + 'semantic' (the safest combo).\n\n"
    "Respond with ONLY a JSON object, nothing else:\n"
    '{"brains": ["keyword", "graph", "semantic"], "reasoning": "short explanation"}\n'
)

# ── Answer System Prompt ──────────────────────────────────────────────
ANSWER_PROMPT = (
    "You are **Edu Nexus**, an elite academic assistant powered by a "
    "Tri-Hybrid Retrieval-Augmented Generation engine.\n\n"
    "You will receive a `context_block` containing evidence from the "
    "retrieval systems that the orchestrator chose for this query.\n\n"
    "── STRICT RULES ──\n"
    "- You MUST answer using ONLY the information present in the "
    "context_block.  Do NOT use prior knowledge.\n"
    "- Cross-reference different sources to verify facts.\n"
    "- If no relevant context is provided, respond: "
    '"I don\'t have enough information in my knowledge base '
    'to answer this."\n'
    "- NEVER hallucinate facts, names, dates, or relationships.\n\n"
    "── FORMAT ──\n"
    "- Use Markdown for readability.\n"
    "- Be concise, detailed, and academic in tone.\n"
    "- Cite the source document for each claim using the format "
    "[Source: document_name] where document_name is the filename "
    "shown in the context block headers.\n"
    "- If a context section is labeled with a document name, use that "
    "name in your citation. Do NOT use generic labels like "
    "'Chunk 1' or 'Semantic Chunk'.\n"
)


# ====================================================================== #
#  ORCHESTRATOR                                                           #
# ====================================================================== #

class OrchestratorManager:
    """
    LLM-Routed Tri-Hybrid RAG Orchestrator.

    The Router LLM (openai/gpt-oss-120b) analyzes each query and decides
    which brain(s) to invoke.  Only the selected brains execute.

    Previous session data is purged on every startup.

    Public API used by ``app.py``:
        - ``generate_answer(query)`` — full RAG pipeline → dict
        - ``get_response(query)``   — alias
        - ``ingest_file(name, path)``  — upload + rebuild indices + build graph
    """

    # ------------------------------------------------------------------ #
    #  Startup cleanup                                                    #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _purge_local_data() -> None:
        """Delete all files in data/raw, data/processed, and data/artifacts."""
        for folder in (RAW_DIR, PROCESSED_DIR, ARTIFACTS_DIR):
            if folder.exists():
                for item in folder.iterdir():
                    try:
                        if item.is_file():
                            item.unlink()
                        elif item.is_dir():
                            shutil.rmtree(item)
                    except Exception as e:
                        logger.warning(f"Could not remove {item}: {e}")
                logger.info(f"Purged previous data from {folder}")

    def _purge_neo4j(self) -> None:
        """Delete ALL nodes and relationships from Neo4j for a fresh session."""
        if not self._graph_ready:
            return
        try:
            self.neo4j.run_cypher(
                "MATCH (n) DETACH DELETE n"
            )
            logger.info("Deep Brain (Neo4j) -- all previous data purged.")
        except Exception as e:
            logger.warning(f"Could not purge Neo4j data: {e}")

    # ------------------------------------------------------------------ #
    #  Init                                                               #
    # ------------------------------------------------------------------ #

    def __init__(self) -> None:
        # ── Wipe local previous session data ──────────────────────────
        self._purge_local_data()

        RAW_DIR.mkdir(parents=True, exist_ok=True)
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

        # ── File registry (tracks all ingested documents) ─────────────
        self._ingested_files: List[str] = []

        # ── 1. Fast Brain (BM25) ──────────────────────────────────────
        self.keyword_engine = KeywordEngine()
        try:
            self.keyword_engine.load_index()
            self._bm25_ready = True
            logger.info("Fast Brain (BM25) -- index loaded.")
        except FileNotFoundError:
            self._bm25_ready = False
            logger.warning(
                "Fast Brain (BM25) -- index not found; "
                "available after first file upload."
            )

        # ── 2. Deep Brain (Neo4j Graph) ───────────────────────────────
        self.neo4j = Neo4jConnector()
        self._graph_ready = self.neo4j.verify_connectivity()
        if self._graph_ready:
            logger.info("Deep Brain (Neo4j) -- connected.")
            self._purge_neo4j()  # Clean old data
        else:
            logger.warning(
                "Deep Brain (Neo4j) -- not reachable; "
                "graph retrieval disabled."
            )

        # ── 3. Semantic Brain (FAISS vectors) ─────────────────────────
        self.vector_store = VectorStore()
        try:
            self.vector_store.load_index()
            self._vector_ready = True
            logger.info("Semantic Brain (FAISS) -- index loaded.")
        except FileNotFoundError:
            self._vector_ready = False
            logger.warning(
                "Semantic Brain (FAISS) -- index not found; "
                "available after first file upload."
            )

        # ── Groq LLM clients (Router + Answer) ───────────────────────
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set in environment.")
        self.llm = Groq(api_key=api_key)

    # ================================================================== #
    #  LLM ROUTER — decides which brain(s) to invoke                     #
    # ================================================================== #

    async def _route_query(self, query: str) -> dict:
        """
        Call the Router LLM to decide which brain(s) to use.

        Returns
        -------
        dict with keys: brains (list[str]), reasoning (str)
        """
        # Build available list based on what's online
        available = []
        if self._bm25_ready:
            available.append("keyword")
        if self._graph_ready:
            available.append("graph")
        if self._vector_ready:
            available.append("semantic")

        if not available:
            return {
                "brains": [],
                "reasoning": "No retrieval engines are online.",
            }

        user_msg = (
            f"Available brains: {available}\n\n"
            f"User query: \"{query}\"\n\n"
            f"Which brain(s) should handle this query? "
            f"Respond with ONLY the JSON object, no markdown, no explanation."
        )

        try:
            completion = await asyncio.to_thread(
                lambda: self.llm.chat.completions.create(
                    model=ROUTER_MODEL,
                    messages=[
                        {"role": "system", "content": ROUTER_PROMPT},
                        {"role": "user", "content": user_msg},
                    ],
                    temperature=0,
                    max_tokens=200,
                    stream=False,
                )
            )
            raw = completion.choices[0].message.content or ""
            raw = raw.strip()
            logger.info(f"Router LLM raw response: {raw}")

            # Parse JSON — handle multiple formats the model might return
            data = self._parse_router_json(raw, available)

            # Filter to only available brains
            chosen = [b for b in data.get("brains", []) if b in available]
            reasoning = data.get("reasoning", "No reasoning provided.")

            if not chosen:
                # Fallback: use all available
                chosen = available
                reasoning += " (Fallback: using all available brains.)"

            return {"brains": chosen, "reasoning": reasoning}

        except Exception as e:
            logger.error(f"Router LLM failed: {e}. Falling back to all brains.")
            return {
                "brains": available,
                "reasoning": f"Router error ({e}). Using all available brains as fallback.",
            }

    @staticmethod
    def _parse_router_json(raw: str, available: List[str]) -> dict:
        """
        Robustly parse the Router LLM response into a dict.
        Handles: plain JSON, markdown-wrapped JSON, partial text, empty.
        """
        if not raw:
            return {"brains": available, "reasoning": "Empty router response."}

        # 1. Try direct parse
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # 2. Strip markdown code fences: ```json ... ``` or ``` ... ```
        cleaned = re.sub(r'```(?:json)?\s*', '', raw)
        cleaned = cleaned.strip().rstrip('`').strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # 3. Find first { ... } block in the text
        match = re.search(r'\{[^{}]*\}', raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        # 4. Find { ... } allowing nested braces
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        # 5. Last resort — look for brain names in the text
        found = []
        for brain in ["keyword", "graph", "semantic"]:
            if brain in raw.lower():
                found.append(brain)

        if found:
            return {"brains": found, "reasoning": f"Parsed from text: {raw[:100]}"}

        # 6. Give up — return all available
        logger.warning(f"Could not parse router response at all: {raw}")
        return {"brains": available, "reasoning": f"Unparseable response. Fallback to all."}

    # ================================================================== #
    #  RETRIEVAL — one method per brain                                   #
    # ================================================================== #

    @property
    def _multi_file(self) -> bool:
        """True when more than one document has been ingested."""
        return len(self._ingested_files) > 1

    def _retrieve_bm25(self, query: str) -> List[str]:
        """Fast Brain: keyword-matched chunks.
        Uses per-file retrieval when multiple files are ingested so
        every document is represented (the detective's Ctrl+F runs
        across ALL case files, not just the top-scoring one).
        """
        if not self._bm25_ready:
            return []
        try:
            if self._multi_file:
                results = self.keyword_engine.search_per_file(
                    query, k_per_file=BM25_TOP_K
                )
            else:
                results = self.keyword_engine.search(query, k=BM25_TOP_K)
            logger.info(f"Fast Brain returned {len(results)} chunks.")
            return results
        except Exception as e:
            logger.error(f"Fast Brain search failed: {e}")
            return []

    def _retrieve_graph(self, query: str) -> List[Dict]:
        """Deep Brain: knowledge-graph triples matching query keywords.
        The detective's string board — connects entities across ALL files.
        """
        if not self._graph_ready:
            return []

        stopwords = {
            "what", "is", "the", "a", "an", "of", "to", "and", "in",
            "for", "on", "how", "does", "do", "are", "was", "were",
            "who", "which", "can", "about", "tell", "me", "explain",
            "this", "that", "it", "they", "them", "their", "its",
        }
        keywords = [
            w for w in query.split()
            if w.lower() not in stopwords and len(w) > 1
        ]
        if not keywords:
            return []

        where_clauses = " OR ".join(
            f"toLower(a.name) CONTAINS toLower($kw{i}) OR "
            f"toLower(b.name) CONTAINS toLower($kw{i})"
            for i in range(len(keywords))
        )

        # Increase limit when multiple files exist
        limit = GRAPH_RESULT_LIMIT * 2 if self._multi_file else GRAPH_RESULT_LIMIT

        cypher = (
            f"MATCH (a)-[r]->(b) "
            f"WHERE {where_clauses} "
            f"RETURN a.name AS source, type(r) AS relation, b.name AS target "
            f"LIMIT {limit}"
        )
        params = {f"kw{i}": kw for i, kw in enumerate(keywords)}

        try:
            results = self.neo4j.run_cypher(cypher, params)
            logger.info(f"Deep Brain returned {len(results)} triples.")
            return results
        except Exception as e:
            logger.error(f"Deep Brain query failed: {e}")
            return []

    def _retrieve_vector(self, query: str) -> List[Tuple[str, float]]:
        """Semantic Brain: dense-vector similar chunks.
        Uses per-file retrieval when multiple files are ingested so
        every document is represented (the detective reads diaries
        from ALL suspects, not just the most talkative one).
        """
        if not self._vector_ready:
            return []
        try:
            if self._multi_file:
                results = self.vector_store.search_per_file(
                    query, k_per_file=VECTOR_TOP_K
                )
            else:
                results = self.vector_store.search(query, k=VECTOR_TOP_K)
            logger.info(f"Semantic Brain returned {len(results)} chunks.")
            return results
        except Exception as e:
            logger.error(f"Semantic Brain search failed: {e}")
            return []

    # ================================================================== #
    #  CONTEXT FORMATTING                                                 #
    # ================================================================== #

    @staticmethod
    def _truncate(text: str, max_words: int = MAX_CHUNK_WORDS) -> str:
        """Truncate text to *max_words* words to control context size."""
        words = text.split()
        if len(words) <= max_words:
            return text
        return " ".join(words[:max_words]) + " ..."

    def _format_keyword_context(self, chunks: List[str]) -> str:
        if not chunks:
            return "_No keyword chunks retrieved._"
        lines = []
        for i, chunk in enumerate(chunks, 1):
            # Try to identify which document this chunk came from
            doc_name = self._guess_chunk_source(chunk)
            label = f"[Source: {doc_name}]" if doc_name else f"[Keyword Result {i}]"
            lines.append(f"**{label}**\n{OrchestratorManager._truncate(chunk)}")
        return "\n\n".join(lines)

    @staticmethod
    def _format_graph_context(triples: List[Dict]) -> str:
        if not triples:
            return "_No graph triples retrieved._"
        lines = []
        for t in triples:
            src = t.get("source", "?")
            rel = t.get("relation", "?")
            tgt = t.get("target", "?")
            lines.append(f"- **{src}** -> _{rel}_ -> **{tgt}**")
        return "\n".join(lines)

    def _format_semantic_context(self, results: List[Tuple[str, float]]) -> str:
        if not results:
            return "_No semantic chunks retrieved._"
        lines = []
        for i, (chunk, score) in enumerate(results, 1):
            doc_name = self._guess_chunk_source(chunk)
            label = f"[Source: {doc_name}]" if doc_name else f"[Semantic Result {i}]"
            lines.append(
                f"**{label}** (relevance: {score:.2f})\n{OrchestratorManager._truncate(chunk)}"
            )
        return "\n\n".join(lines)

    def _guess_chunk_source(self, chunk_text: str) -> Optional[str]:
        """Try to match a chunk to its source document by checking JSONL files."""
        snippet = chunk_text[:80]
        for fname in self._ingested_files:
            jsonl = PROCESSED_DIR / f"{Path(fname).stem}.chunks.jsonl"
            if jsonl.exists():
                try:
                    with open(jsonl, "r", encoding="utf-8") as f:
                        for line in f:
                            data = json.loads(line.strip())
                            text = data.get("text", data.get("chunk", ""))
                            if snippet in text:
                                return fname
                except Exception:
                    pass
        # Fallback: return first file if only one exists
        if len(self._ingested_files) == 1:
            return self._ingested_files[0]
        return None

    def _build_context_block(
        self,
        bm25_chunks: List[str],
        graph_triples: List[Dict],
        vector_results: List[Tuple[str, float]],
        chosen_brains: List[str],
    ) -> str:
        """Fuse retrieval outputs into a single context_block."""
        sections = []

        # ── File inventory (tells the LLM which documents are loaded) ─
        if self._ingested_files:
            file_list = "\n".join(
                f"  {i}. {name}" for i, name in enumerate(self._ingested_files, 1)
            )
            sections.append(
                f"## [Document Inventory]\n\n"
                f"The following {len(self._ingested_files)} file(s) have been "
                f"uploaded and indexed:\n{file_list}\n\n"
                f"All retrieval results below come from these documents."
            )

        if "keyword" in chosen_brains:
            keyword_ctx = self._format_keyword_context(bm25_chunks)
            sections.append(
                f"## [Keyword Context]  (Fast Brain -- BM25)\n\n{keyword_ctx}"
            )

        if "graph" in chosen_brains:
            graph_ctx = self._format_graph_context(graph_triples)
            sections.append(
                f"## [Graph Context]  (Deep Brain -- Neo4j)\n\n{graph_ctx}"
            )

        if "semantic" in chosen_brains:
            semantic_ctx = self._format_semantic_context(vector_results)
            sections.append(
                f"## [Semantic Context]  (Semantic Brain -- FAISS)\n\n{semantic_ctx}"
            )

        block = "\n\n---\n\n".join(sections)

        # Hard-cap to avoid exceeding Groq token limits
        if len(block) > MAX_CONTEXT_CHARS:
            logger.warning(
                f"Context block too large ({len(block)} chars), "
                f"truncating to {MAX_CONTEXT_CHARS} chars."
            )
            block = block[:MAX_CONTEXT_CHARS] + "\n\n... [context truncated]"

        return block

    # ================================================================== #
    #  MULTI-FILE QUERY DETECTION                                          #
    # ================================================================== #

    @staticmethod
    def _is_multi_file_query(query: str) -> bool:
        """
        Detect whether the user's query is about multiple / all uploaded files.

        Triggers on patterns like:
          - "summarize both files"
          - "compare the documents"
          - "tell me about all files"
          - "what do these files say"
          - "overview of everything"
        """
        q = query.lower()
        multi_markers = [
            "both file", "all file", "all document", "every file",
            "every document", "each file", "each document",
            "these file", "these document", "the files", "the documents",
            "compare", "contrast", "differences between",
            "similarities between", "overview of everything",
            "summarize everything", "summarise everything",
            "all of them", "both of them",
            "across file", "across document",
        ]
        return any(marker in q for marker in multi_markers)

    # ================================================================== #
    #  STRATEGY (human-readable label)                                    #
    # ================================================================== #

    def _decide_strategy(self) -> str:
        """Return a human-readable label describing which brains are active."""
        active = []
        if self._bm25_ready:
            active.append("Fast")
        if self._graph_ready:
            active.append("Deep")
        if self._vector_ready:
            active.append("Semantic")
        return "+".join(active) if active else "none"

    # ================================================================== #
    #  MAIN ANSWER PIPELINE                                               #
    # ================================================================== #

    async def generate_answer(self, query: str) -> dict:
        """
        LLM-Routed Tri-Hybrid RAG pipeline:

          1. Router LLM analyses the query and picks brain(s).
          2. Only the chosen brains execute (concurrently).
          3. Results are fused into a ``context_block``.
          4. Answer LLM synthesises the final answer.
          5. Return a structured dict.

        Returns
        -------
        dict with keys:
            answer, bm25_chunks, graph_triples, vector_results,
            strategy, router_decision
        """
        logger.info(f"Query received: {query}")

        strategy = self._decide_strategy()
        logger.info(f"Available brains: {strategy}")

        # ── Step 1: Router LLM decides which brain(s) ─────────────────
        router_decision = await self._route_query(query)
        chosen_brains = router_decision["brains"]
        routing_reasoning = router_decision["reasoning"]

        # If multiple files AND a broad/meta query, force all brains
        # so every file gets covered from every angle
        if self._multi_file and self._is_multi_file_query(query):
            available = []
            if self._bm25_ready:
                available.append("keyword")
            if self._graph_ready:
                available.append("graph")
            if self._vector_ready:
                available.append("semantic")
            chosen_brains = available
            routing_reasoning += (
                " [Override: multi-file query detected — "
                "using all available brains for full coverage.]"
            )
            router_decision["brains"] = chosen_brains
            router_decision["reasoning"] = routing_reasoning

        logger.info(f"Router chose: {chosen_brains} — {routing_reasoning}")

        # ── Step 2: Run ONLY chosen brains concurrently ───────────────
        tasks = {}
        if "keyword" in chosen_brains:
            tasks["bm25"] = asyncio.to_thread(self._retrieve_bm25, query)
        if "graph" in chosen_brains:
            tasks["graph"] = asyncio.to_thread(self._retrieve_graph, query)
        if "semantic" in chosen_brains:
            tasks["vector"] = asyncio.to_thread(self._retrieve_vector, query)

        # Execute concurrently
        results = {}
        if tasks:
            keys = list(tasks.keys())
            values = await asyncio.gather(*tasks.values())
            results = dict(zip(keys, values))

        bm25_chunks = results.get("bm25", [])
        graph_triples = results.get("graph", [])
        vector_results = results.get("vector", [])

        # ── Step 3: Build context block ───────────────────────────────
        context_block = self._build_context_block(
            bm25_chunks, graph_triples, vector_results, chosen_brains
        )

        # ── Step 4: Answer LLM synthesis ──────────────────────────────
        has_context = bool(bm25_chunks or graph_triples or vector_results)

        if not has_context and strategy == "none":
            answer_text = (
                "I don't have any knowledge base loaded yet. "
                "Please upload a document first using the attachment button."
            )
        else:
            messages = [
                {"role": "system", "content": ANSWER_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"### Context Block\n\n{context_block}\n\n"
                        f"---\n\n### Question\n\n{query}"
                    ),
                },
            ]
            try:
                completion = await asyncio.to_thread(
                    lambda: self.llm.chat.completions.create(
                        model=ANSWER_MODEL,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=512,
                        stream=False,
                    )
                )
                answer_text = completion.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"LLM generation failed: {e}")
                answer_text = (
                    "I encountered an error while generating the answer. "
                    "Please try again."
                )

        return {
            "answer": answer_text,
            "bm25_chunks": bm25_chunks,
            "graph_triples": graph_triples,
            "vector_results": vector_results,
            "strategy": strategy,
            "router_decision": router_decision,
            "chosen_brains": chosen_brains,
        }

    # Backward-compatible alias used by app.py
    async def get_response(self, query: str) -> dict:
        """Alias for ``generate_answer`` to keep ``app.py`` compatible."""
        return await self.generate_answer(query)

    # ================================================================== #
    #  FILE INGESTION (from UI uploads)                                   #
    # ================================================================== #

    async def ingest_file(self, file_name: str, file_path: str) -> dict:
        """
        Process an uploaded file end-to-end:

          1. Copy raw file to ``data/raw/``.
          2. Run cleaner + chunker -> ``data/processed/*.chunks.jsonl``.
          3. Rebuild BM25 + FAISS indices.
          4. Build Neo4j knowledge graph from chunks.
        """
        ext = Path(file_name).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            return {
                "status": "error",
                "message": (
                    f"Unsupported file type '{ext}'. "
                    f"Supported: {', '.join(SUPPORTED_EXTENSIONS)}"
                ),
                "chunks_count": 0,
            }

        try:
            dest = RAW_DIR / file_name
            shutil.copy2(file_path, dest)
            logger.info(f"Saved uploaded file to {dest}")

            # Track in file registry
            if file_name not in self._ingested_files:
                self._ingested_files.append(file_name)

            # Run ingestion (clean + chunk)
            chunks_count, chunk_texts = await asyncio.to_thread(
                self._run_ingestion, dest
            )

            # Rebuild BM25 + FAISS indices concurrently
            await asyncio.gather(
                asyncio.to_thread(self._rebuild_bm25),
                asyncio.to_thread(self._rebuild_vector),
            )

            # Build Neo4j graph from chunks (if connected)
            graph_nodes = 0
            graph_rels = 0
            if self._graph_ready and chunk_texts:
                graph_nodes, graph_rels = await asyncio.to_thread(
                    self._build_graph, chunk_texts
                )

            return {
                "status": "ok",
                "message": (
                    f"Processed '{file_name}' -> {chunks_count} chunks. "
                    "BM25 + FAISS indices rebuilt."
                ),
                "chunks_count": chunks_count,
                "graph_nodes": graph_nodes,
                "graph_rels": graph_rels,
            }

        except Exception as e:
            logger.error(f"Ingestion failed for {file_name}: {e}")
            return {
                "status": "error",
                "message": f"Failed to process '{file_name}': {str(e)}",
                "chunks_count": 0,
            }

    # ================================================================== #
    #  PRIVATE HELPERS                                                    #
    # ================================================================== #

    @staticmethod
    def _run_ingestion(file_path: Path) -> Tuple[int, List[str]]:
        """Run the unified extractor + cleaner + chunker on a single file.
        Returns (chunk_count, list_of_chunk_texts).
        """
        cleaner_path = Path(__file__).parent.parent / "ingest" / "cleaner.py"
        spec = importlib.util.spec_from_file_location("cleaner", cleaner_path)
        cleaner = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cleaner)

        # ── Unified extraction (supports PDF, DOCX, PPTX, XLSX, CSV, TXT, MD)
        pages = extract_text(file_path)
        if not pages:
            logger.warning(f"No text extracted from {file_path.name}")
            return 0, []

        cleaned_text = cleaner.clean_pages(pages, source_type="pdf")
        basename = file_path.stem
        cleaner.write_cleaned_text(PROCESSED_DIR, basename, cleaned_text)
        chunks = cleaner.chunk_text_by_sentences(
            cleaned_text, max_tokens=500, overlap=100
        )
        cleaner.write_chunks_jsonl(
            PROCESSED_DIR, basename, file_path, chunks
        )

        chunk_texts = [text for (_, _, text) in chunks]
        logger.info(f"Ingested {file_path.name}: {len(chunks)} chunks")
        return len(chunks), chunk_texts

    def _rebuild_bm25(self) -> None:
        """Rebuild and reload the BM25 index."""
        self.keyword_engine.build_index()
        try:
            self.keyword_engine.load_index()
            self._bm25_ready = True
            logger.info("Fast Brain (BM25) index rebuilt and reloaded.")
        except FileNotFoundError:
            self._bm25_ready = False
            logger.warning("Fast Brain rebuild produced no index.")

    def _rebuild_vector(self) -> None:
        """Rebuild and reload the FAISS vector index."""
        self.vector_store.build_index()
        try:
            self.vector_store.load_index()
            self._vector_ready = True
            logger.info("Semantic Brain (FAISS) index rebuilt and reloaded.")
        except FileNotFoundError:
            self._vector_ready = False
            logger.warning("Semantic Brain rebuild produced no index.")

    def _build_graph(self, chunk_texts: List[str]) -> Tuple[int, int]:
        """
        Build Neo4j knowledge graph from document chunks.
        Uses GraphBuilder + GraphExtractor to extract entities/relations
        from each chunk and push them to Neo4j.

        Returns (total_nodes_estimate, total_rels_estimate).
        """
        try:
            builder = GraphBuilder()
            total_nodes = 0
            total_rels = 0

            # Process chunks in batches to avoid too many LLM calls
            # Combine every 3 chunks into one block for extraction
            batch_size = 3
            for i in range(0, len(chunk_texts), batch_size):
                batch = chunk_texts[i:i + batch_size]
                combined = "\n\n".join(batch)
                # Truncate to avoid huge LLM calls
                words = combined.split()
                if len(words) > 800:
                    combined = " ".join(words[:800])

                try:
                    builder.process_text(combined)
                    # We can't easily count from builder, estimate
                    total_nodes += 1  # at least one batch processed
                except Exception as e:
                    logger.warning(f"Graph build batch {i//batch_size} failed: {e}")
                    continue

            logger.info(
                f"Graph build complete: processed {len(chunk_texts)} chunks "
                f"in {(len(chunk_texts) + batch_size - 1) // batch_size} batches."
            )
            return total_nodes, total_rels

        except Exception as e:
            logger.error(f"Graph building failed: {e}")
            return 0, 0
