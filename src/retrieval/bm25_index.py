from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import List
import re

from rank_bm25 import BM25Okapi


class KeywordEngine:
    def __init__(self, artifacts_dir: str = "data/artifacts"):
        self.artifacts_dir = Path(artifacts_dir)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.artifacts_dir / "bm25.pkl"
        self.bm25 = None
        self.chunks = []

    def load_chunks(self, processed_dir: str = "data/processed") -> List[str]:
        processed = Path(processed_dir)
        texts = []

        for file in processed.glob("*.chunks.jsonl"):
            with open(file, "r", encoding="utf-8") as f:
                for line in f:
                    data = json.loads(line)
                    texts.append(data["text"])

        return texts

    def build_index(self):
        print("Loading chunks...")
        self.chunks = self.load_chunks()

        print(f"Loaded {len(self.chunks)} chunks")

        tokenized_corpus = [
            chunk.lower().split()
            for chunk in self.chunks
        ]

        self.bm25 = BM25Okapi(tokenized_corpus)

        with open(self.index_path, "wb") as f:
            pickle.dump(
                {
                    "bm25": self.bm25,
                    "chunks": self.chunks
                },
                f
            )

        print("BM25 index saved.")

    def load_index(self):
        if not self.index_path.exists():
            raise FileNotFoundError("bm25.pkl not found. Build index first.")

        with open(self.index_path, "rb") as f:
            data = pickle.load(f)

        self.bm25 = data["bm25"]
        self.chunks = data["chunks"]

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