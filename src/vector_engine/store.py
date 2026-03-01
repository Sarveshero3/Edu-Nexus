"""
Vector Store — Edu Nexus (Semantic Brain)
==========================================
FAISS-backed vector store using sentence-transformers for dense
semantic retrieval.  Mirrors the KeywordEngine API so the
Orchestrator can treat every brain identically.
"""

from __future__ import annotations

import json
import logging
import pickle
from pathlib import Path
from typing import List, Tuple

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
    def _load_chunks(processed_dir: str = "data/processed") -> List[str]:
        """Read all ``*.chunks.jsonl`` files and return a flat list of texts."""
        proc = Path(processed_dir)
        texts: List[str] = []
        for file in sorted(proc.glob("*.chunks.jsonl")):
            with open(file, "r", encoding="utf-8") as fh:
                for line in fh:
                    data = json.loads(line)
                    texts.append(data["text"])
        return texts

    # ------------------------------------------------------------------ #
    #  Index lifecycle                                                    #
    # ------------------------------------------------------------------ #

    def build_index(self) -> None:
        """Embed every chunk and persist a FAISS index + metadata."""
        faiss = _ensure_faiss()

        self.chunks = self._load_chunks()
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

        # Persist
        faiss.write_index(self.index, str(self.index_path))
        with open(self.meta_path, "wb") as f:
            pickle.dump({"chunks": self.chunks}, f)

        logger.info(
            f"FAISS index built and saved  "
            f"({len(self.chunks)} vectors, dim={dim})."
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

        logger.info(
            f"FAISS index loaded ({self.index.ntotal} vectors)."
        )

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
