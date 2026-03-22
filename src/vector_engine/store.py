"""
Vector Store — Edu Nexus (Semantic Brain)
==========================================
FAISS-backed vector store using sentence-transformers for dense
semantic retrieval.  Mirrors the KeywordEngine API so the
Orchestrator can treat every brain identically.

Supports **file-aware retrieval**: each chunk carries its source
filename so the search can guarantee cross-file coverage.
"""

from __future__ import annotations

import json
import logging
import pickle
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("VectorStore")

# ---------------------------------------------------------------------------
#  Lazy imports — keep startup fast; only load heavy libs when actually needed
# ---------------------------------------------------------------------------

_faiss = None
_SentenceTransformer = None


def _ensure_faiss():
    global _faiss
    if _faiss is None:
        import faiss
        _faiss = faiss
    return _faiss


def _ensure_st():
    global _SentenceTransformer
    if _SentenceTransformer is None:
        from sentence_transformers import SentenceTransformer
        _SentenceTransformer = SentenceTransformer
    return _SentenceTransformer


# ---------------------------------------------------------------------------
#  Constants
# ---------------------------------------------------------------------------

EMBEDDING_MODEL = "all-MiniLM-L6-v2"       # 384-dim, fast, good quality
EMBEDDING_DIM = 384
PROCESSED_DIR = Path("data/processed")
ARTIFACTS_DIR = Path("data/artifacts")


class VectorStore:
    """
    Semantic retrieval engine built on FAISS + sentence-transformers.

    Lifecycle
    ---------
    1. ``build_index()``  — reads chunks from ``data/processed/``, embeds
       them, and persists a FAISS index + metadata to ``data/artifacts/``.
    2. ``load_index()``   — loads a previously built index from disk.
    3. ``search(query)``  — returns the top-k most semantically similar
       chunks for the given query string.
    4. ``search_per_file(query)`` — returns top-k per source file for
       cross-file coverage.
    """

    def __init__(
        self,
        artifacts_dir: str = "data/artifacts",
        model_name: str = EMBEDDING_MODEL,
    ):
        self.artifacts_dir = Path(artifacts_dir)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.artifacts_dir / "faiss.index"
        self.meta_path = self.artifacts_dir / "faiss_meta.pkl"

        self.model_name = model_name
        self._model = None          # lazy-loaded SentenceTransformer
        self.index = None           # FAISS index object
        self.chunks: List[str] = []
        self.sources: List[str] = []   # source filename per chunk

    # ------------------------------------------------------------------ #
    #  Model                                                              #
    # ------------------------------------------------------------------ #

    def _get_model(self):
        """Lazy-load the embedding model on first use."""
        if self._model is None:
            ST = _ensure_st()
            logger.info(f"Loading embedding model: {self.model_name}")
            self._model = ST(self.model_name)
        return self._model

    def _embed(self, texts: List[str]) -> np.ndarray:
        """Return L2-normalised float32 embeddings for a list of texts."""
        model = self._get_model()
        embeddings = model.encode(
            texts,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        return embeddings.astype(np.float32)

    # ------------------------------------------------------------------ #
    #  Chunk loading (shared format with KeywordEngine)                   #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _load_chunks_with_sources(
        processed_dir: str = "data/processed",
    ) -> Tuple[List[str], List[str]]:
        """Read all ``*.chunks.jsonl`` files and return texts + source filenames."""
        proc = Path(processed_dir)
        texts: List[str] = []
        sources: List[str] = []
        for file in sorted(proc.glob("*.chunks.jsonl")):
            with open(file, "r", encoding="utf-8") as fh:
                for line in fh:
                    data = json.loads(line)
                    texts.append(data["text"])
                    # Extract just the filename from the source path
                    source_path = data.get("source", "unknown")
                    sources.append(Path(source_path).name)
        return texts, sources

    @staticmethod
    def _load_chunks(processed_dir: str = "data/processed") -> List[str]:
        """Read all ``*.chunks.jsonl`` files and return a flat list of texts."""
        texts, _ = VectorStore._load_chunks_with_sources(processed_dir)
        return texts

    # ------------------------------------------------------------------ #
    #  Index lifecycle                                                    #
    # ------------------------------------------------------------------ #

    def build_index(self) -> None:
        """Embed every chunk and persist a FAISS index + metadata."""
        faiss = _ensure_faiss()

        self.chunks, self.sources = self._load_chunks_with_sources()
        logger.info(f"Loaded {len(self.chunks)} chunks for vector index.")

        if not self.chunks:
            logger.warning(
                "[WARNING] No chunks found in data/processed/. "
                "Run the ingestion pipeline first."
            )
            return

        embeddings = self._embed(self.chunks)
        dim = embeddings.shape[1]

        # Inner-product index (embeddings are already L2-normalised, so
        # IP == cosine similarity).
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings)

        # Persist (now includes sources)
        faiss.write_index(self.index, str(self.index_path))
        with open(self.meta_path, "wb") as f:
            pickle.dump({"chunks": self.chunks, "sources": self.sources}, f)

        unique_files = set(self.sources)
        logger.info(
            f"FAISS index built and saved  "
            f"({len(self.chunks)} vectors, dim={dim}, "
            f"{len(unique_files)} source files)."
        )

    def load_index(self) -> None:
        """Load a previously persisted FAISS index from disk."""
        faiss = _ensure_faiss()

        if not self.index_path.exists():
            raise FileNotFoundError(
                "faiss.index not found in data/artifacts/. "
                "Build the vector index first."
            )

        self.index = faiss.read_index(str(self.index_path))

        with open(self.meta_path, "rb") as f:
            meta = pickle.load(f)
        self.chunks = meta["chunks"]
        self.sources = meta.get("sources", ["unknown"] * len(self.chunks))

        logger.info(
            f"FAISS index loaded ({self.index.ntotal} vectors)."
        )

    # ------------------------------------------------------------------ #
    #  Source-file helpers                                                 #
    # ------------------------------------------------------------------ #

    def get_source_files(self) -> List[str]:
        """Return unique source filenames in the index."""
        return sorted(set(self.sources)) if self.sources else []

    # ------------------------------------------------------------------ #
    #  Search                                                             #
    # ------------------------------------------------------------------ #

    def search(self, query: str, k: int = 5) -> List[Tuple[str, float]]:
        """
        Return the top-*k* chunks most semantically similar to *query*.

        Returns
        -------
        list of (chunk_text, similarity_score) tuples, sorted descending.
        """
        if self.index is None:
            raise ValueError("Vector index not loaded. Call load_index() first.")

        query_vec = self._embed([query])
        scores, indices = self.index.search(query_vec, min(k, self.index.ntotal))

        results: List[Tuple[str, float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((self.chunks[idx], float(score)))
        return results

    def search_per_file(
        self, query: str, k_per_file: int = 3
    ) -> List[Tuple[str, float]]:
        """
        File-aware search: returns top-*k_per_file* chunks **per source file**.

        This guarantees every ingested file is represented in the results,
        which is critical for multi-document queries like
        "summarize both files" or "compare all documents".

        Returns
        -------
        list of (chunk_text, similarity_score) tuples, sorted descending.
        """
        if self.index is None:
            raise ValueError("Vector index not loaded. Call load_index() first.")

        # Search broadly — fetch enough to cover all files
        n_files = len(set(self.sources)) if self.sources else 1
        fetch_k = min(k_per_file * n_files * 3, self.index.ntotal)

        query_vec = self._embed([query])
        scores, indices = self.index.search(query_vec, fetch_k)

        # Bucket results by source file
        per_file: Dict[str, List[Tuple[str, float]]] = defaultdict(list)
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            source = self.sources[idx] if idx < len(self.sources) else "unknown"
            if len(per_file[source]) < k_per_file:
                per_file[source].append((self.chunks[idx], float(score)))

        # Merge all per-file results, sorted by score
        merged: List[Tuple[str, float]] = []
        for file_results in per_file.values():
            merged.extend(file_results)
        merged.sort(key=lambda x: x[1], reverse=True)

        return merged
