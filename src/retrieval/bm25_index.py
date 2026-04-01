"""
Keyword Engine (BM25) — Edu Nexus (Fast Brain)
================================================
Okapi BM25 keyword retrieval with per-workspace index isolation.
Each workspace gets its own pickle file: data/artifacts/bm25/bm25_{workspace_id}.pkl
"""

from __future__ import annotations

import json
import pickle
import re
from pathlib import Path
from typing import Dict, List

from rank_bm25 import BM25Okapi

from config import BM25_DIR, PROCESSED_DIR

STOPWORDS = {"what", "is", "the", "a", "an", "of", "to", "and", "in"}


def _index_path(workspace_id: str) -> Path:
    return BM25_DIR / f"bm25_{workspace_id}.pkl"


def _load_workspace_chunks(workspace_id: str) -> List[str]:
    """Load all chunks from processed JSONL files for a workspace."""
    ws_dir = PROCESSED_DIR / workspace_id
    texts = []
    if not ws_dir.exists():
        return texts
    for file in sorted(ws_dir.glob("*.chunks.jsonl")):
        with open(file, "r", encoding="utf-8") as f:
            for line in f:
                data = json.loads(line)
                texts.append(data.get("text", ""))
    return texts


def build_index(workspace_id: str, chunks: List[str]) -> None:
    """Build a BM25 index from chunks and save to disk."""
    if not chunks:
        return

    tokenized_corpus = [chunk.lower().split() for chunk in chunks]
    bm25 = BM25Okapi(tokenized_corpus)

    path = _index_path(workspace_id)
    with open(path, "wb") as f:
        pickle.dump({"bm25": bm25, "chunks": chunks}, f)


def search(workspace_id: str, query: str, top_k: int = 10) -> List[dict]:
    """
    Search the workspace BM25 index.
    Returns: [{"text": str, "score": float}, ...]
    """
    path = _index_path(workspace_id)
    if not path.exists():
        return []

    with open(path, "rb") as f:
        data = pickle.load(f)

    bm25 = data["bm25"]
    chunks = data["chunks"]

    tokenized_query = [
        word for word in re.findall(r"\w+", query.lower())
        if word not in STOPWORDS
    ]

    scores = bm25.get_scores(tokenized_query)
    ranked = sorted(
        range(len(scores)),
        key=lambda i: scores[i],
        reverse=True
    )[:top_k]

    return [
        {"text": chunks[i], "score": float(scores[i])}
        for i in ranked
        if scores[i] > 0
    ]


def add_doc_chunks(workspace_id: str, new_chunks: List[str]) -> None:
    """Load existing index, append new chunks, rebuild, save."""
    path = _index_path(workspace_id)
    existing_chunks = []

    if path.exists():
        with open(path, "rb") as f:
            data = pickle.load(f)
        existing_chunks = data.get("chunks", [])

    all_chunks = existing_chunks + new_chunks
    build_index(workspace_id, all_chunks)


def delete_doc_and_rebuild(workspace_id: str, doc_id: str) -> None:
    """
    Rebuild the BM25 index without the deleted doc's chunks.
    Reads all remaining .chunks.jsonl files for this workspace.
    """
    ws_dir = PROCESSED_DIR / workspace_id
    remaining_chunks = []

    if ws_dir.exists():
        for file in sorted(ws_dir.glob("*.chunks.jsonl")):
            with open(file, "r", encoding="utf-8") as f:
                for line in f:
                    data = json.loads(line)
                    # Skip chunks belonging to the deleted doc
                    if data.get("doc_id", "") == doc_id:
                        continue
                    remaining_chunks.append(data.get("text", ""))

    if remaining_chunks:
        build_index(workspace_id, remaining_chunks)
    else:
        # No chunks left — remove the index file
        path = _index_path(workspace_id)
        if path.exists():
            path.unlink()


def index_exists(workspace_id: str) -> bool:
    """Check if a BM25 index exists for this workspace."""
    return _index_path(workspace_id).exists()


def doc_count(workspace_id: str) -> int:
    """Count how many chunks are in the BM25 index."""
    path = _index_path(workspace_id)
    if not path.exists():
        return 0
    with open(path, "rb") as f:
        data = pickle.load(f)
    return len(data.get("chunks", []))

