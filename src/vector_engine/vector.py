"""
Vector Utilities — Edu Nexus
==============================
Embedding generation using sentence-transformers.
Qdrant is the vector backend; this module handles raw embedding operations.
"""

import logging

import numpy as np

from config import EMBEDDING_MODEL

logger = logging.getLogger("VectorUtils")

_model = None


def _get_model():
    """Lazy-load the SentenceTransformer model on first call."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_chunks(texts: list[str]) -> list[list[float]]:
    """
    Generate L2-normalised embeddings for a list of texts.
    Returns a list of float lists (one embedding per text).
    """
    model = _get_model()
    embeddings = model.encode(
        texts,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    return embeddings.astype(np.float32).tolist()


def embed_query(text: str) -> list[float]:
    """Generate a single embedding vector for a query string."""
    model = _get_model()
    embedding = model.encode(
        [text],
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    return embedding[0].astype(np.float32).tolist()
