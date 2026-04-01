"""
Vector Store — Edu Nexus (Semantic Brain)
==========================================
Qdrant-backed vector store using sentence-transformers for dense
semantic retrieval.

All vectors carry workspace_id + doc_id in their payload for
workspace-scoped filtered retrieval.
"""

from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
    FilterSelector,
)
from config import QDRANT_DIR, QDRANT_COLLECTION, EMBEDDING_DIM
import hashlib

_client: QdrantClient = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(path=str(QDRANT_DIR))
        _ensure_collection()
    return _client


def _ensure_collection():
    c = get_client()
    existing = [col.name for col in c.get_collections().collections]
    if QDRANT_COLLECTION not in existing:
        c.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE)
        )


def _point_id(workspace_id: str, doc_id: str, chunk_index: int) -> int:
    """Deterministic integer ID — makes upserts idempotent."""
    key = f"{workspace_id}:{doc_id}:{chunk_index}"
    return int(hashlib.md5(key.encode()).hexdigest(), 16) % (2 ** 63)


def add_chunks(workspace_id: str, doc_id: str, chunks: list[str], embeddings: list[list[float]]) -> None:
    c = get_client()
    points = [
        PointStruct(
            id=_point_id(workspace_id, doc_id, i),
            vector=embeddings[i],
            payload={
                "workspace_id": workspace_id,
                "doc_id": doc_id,
                "chunk_index": i,
                "text": chunks[i],
                "source": doc_id
            }
        )
        for i in range(len(chunks))
    ]
    c.upsert(collection_name=QDRANT_COLLECTION, points=points)


def search(workspace_id: str, query_vector: list[float], top_k: int = 10) -> list[dict]:
    c = get_client()
    results = c.query_points(
        collection_name=QDRANT_COLLECTION,
        query=query_vector,
        query_filter=Filter(must=[
            FieldCondition(key="workspace_id", match=MatchValue(value=workspace_id))
        ]),
        limit=top_k
    ).points
    return [
        {
            "text": r.payload["text"],
            "doc_id": r.payload["doc_id"],
            "chunk_index": r.payload["chunk_index"],
            "score": r.score
        }
        for r in results
    ]


def delete_doc(workspace_id: str, doc_id: str) -> None:
    c = get_client()
    c.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=FilterSelector(filter=Filter(must=[
            FieldCondition(key="workspace_id", match=MatchValue(value=workspace_id)),
            FieldCondition(key="doc_id", match=MatchValue(value=doc_id))
        ]))
    )


def delete_workspace(workspace_id: str) -> None:
    c = get_client()
    c.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=FilterSelector(filter=Filter(must=[
            FieldCondition(key="workspace_id", match=MatchValue(value=workspace_id))
        ]))
    )


def list_docs(workspace_id: str) -> list[str]:
    c = get_client()
    doc_ids = set()
    offset = None
    while True:
        result = c.scroll(
            collection_name=QDRANT_COLLECTION,
            scroll_filter=Filter(must=[
                FieldCondition(key="workspace_id", match=MatchValue(value=workspace_id))
            ]),
            limit=100,
            offset=offset,
            with_payload=["doc_id"],
            with_vectors=False
        )
        for point in result[0]:
            doc_ids.add(point.payload["doc_id"])
        offset = result[1]
        if offset is None:
            break
    return list(doc_ids)


def count_docs(workspace_id: str) -> int:
    return len(list_docs(workspace_id))


def collection_exists() -> bool:
    """Check if the Qdrant collection exists and is accessible."""
    try:
        c = get_client()
        existing = [col.name for col in c.get_collections().collections]
        return QDRANT_COLLECTION in existing
    except Exception:
        return False

