from __future__ import annotations

import json
import pickle
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple
import re

from rank_bm25 import BM25Okapi


class KeywordEngine:
    def __init__(self, artifacts_dir: str = "data/artifacts"):
        self.artifacts_dir = Path(artifacts_dir)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.artifacts_dir / "bm25.pkl"
        self.bm25 = None
        self.chunks = []
        self.sources = []  # source filename per chunk

    def load_chunks(self, processed_dir: str = "data/processed") -> List[str]:
        processed = Path(processed_dir)
        texts = []
        sources = []

        for file in sorted(processed.glob("*.chunks.jsonl")):
            with open(file, "r", encoding="utf-8") as f:
                for line in f:
                    data = json.loads(line)
                    texts.append(data["text"])
                    source_path = data.get("source", "unknown")
                    sources.append(Path(source_path).name)

        self.sources = sources
        return texts

    def get_source_files(self) -> List[str]:
        """Return unique source filenames in the index."""
        return sorted(set(self.sources)) if self.sources else []

    def build_index(self):
        print("Loading chunks...")
        self.chunks = self.load_chunks()

        print(f"Loaded {len(self.chunks)} chunks")

        if not self.chunks:
            print("[WARNING] No chunks found in data/processed/. "
                  "Run the ingestion pipeline first to create .chunks.jsonl files.")
            return

        tokenized_corpus = [
            chunk.lower().split()
            for chunk in self.chunks
        ]

        self.bm25 = BM25Okapi(tokenized_corpus)

        with open(self.index_path, "wb") as f:
            pickle.dump(
                {
                    "bm25": self.bm25,
                    "chunks": self.chunks,
                    "sources": self.sources,
                },
                f
            )

        unique_files = set(self.sources)
        print(f"BM25 index saved ({len(self.chunks)} chunks, "
              f"{len(unique_files)} source files).")

    def load_index(self):
        if not self.index_path.exists():
            raise FileNotFoundError("bm25.pkl not found. Build index first.")

        with open(self.index_path, "rb") as f:
            data = pickle.load(f)

        self.bm25 = data["bm25"]
        self.chunks = data["chunks"]
        self.sources = data.get("sources", ["unknown"] * len(self.chunks))

        print("BM25 index loaded.")

    def search(self, query: str, k: int = 3) -> List[str]:
        if self.bm25 is None:
            raise ValueError("Index not loaded.")

        STOPWORDS = {"what", "is", "the", "a", "an", "of", "to", "and", "in"}

        tokenized_query = [
            word for word in re.findall(r"\w+", query.lower())
            if word not in STOPWORDS
        ]

        scores = self.bm25.get_scores(tokenized_query)
        top_k = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True
        )[:k]

        return [self.chunks[i] for i in top_k]

    def search_per_file(self, query: str, k_per_file: int = 2) -> List[str]:
        """
        File-aware search: returns top-*k_per_file* keyword-matched
        chunks **per source file** to guarantee cross-file coverage.
        """
        if self.bm25 is None:
            raise ValueError("Index not loaded.")

        STOPWORDS = {"what", "is", "the", "a", "an", "of", "to", "and", "in"}

        tokenized_query = [
            word for word in re.findall(r"\w+", query.lower())
            if word not in STOPWORDS
        ]

        scores = self.bm25.get_scores(tokenized_query)

        # Sort all indices by score descending
        ranked = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True,
        )

        # Bucket by source file
        per_file: Dict[str, List[str]] = defaultdict(list)
        for idx in ranked:
            source = self.sources[idx] if idx < len(self.sources) else "unknown"
            if len(per_file[source]) < k_per_file:
                per_file[source].append(self.chunks[idx])

        # Merge
        merged: List[str] = []
        for file_chunks in per_file.values():
            merged.extend(file_chunks)
        return merged

