"""
Ingestion Pipeline — Edu Nexus
=================================
End-to-end ingestion: extract → clean → chunk → embed → index → graph.
All stages are workspace-scoped. Supports progress callbacks for async job tracking.
"""

import json
import importlib.util
import logging
from pathlib import Path

from config import PROCESSED_DIR, DOCLING_ENABLED
from src.ingest.extractor import extract_text
from src.vector_engine import vector as vec
from src.vector_engine import store
from src.retrieval import bm25_index
from src.graph_engine.extractor import build_graph_data
from src.graph_engine.neo4j_ops import upsert_graph

logger = logging.getLogger("Pipeline")


def _extract_text_with_fallback(file_path: Path) -> list[str]:
    """Extract text using Docling (if enabled) or default extractors."""
    if DOCLING_ENABLED:
        try:
            from src.ingest.docling_extractor import extract_with_docling
            text = extract_with_docling(file_path)
            if text and text.strip():
                # Docling returns one big markdown string; wrap as single "page"
                return [text]
            logger.warning(f"Docling returned empty text for {file_path.name}, falling back")
        except Exception as e:
            logger.warning(f"Docling failed ({e}), falling back to default extractor")
    return extract_text(file_path)


def run_pipeline(
    file_path: Path,
    workspace_id: str,
    on_progress: callable = None,
) -> dict:
    """
    Full ingestion pipeline for one file.
    Calls on_progress at each stage if provided.
    Returns {"status": "ok", "chunks": int} or raises on error.
    """

    def progress(stage: str, pct: int):
        if on_progress:
            on_progress(stage, pct)

    # ── Extract text ──────────────────────────────────────────────
    progress("extracting text", 5)
    pages = _extract_text_with_fallback(file_path)
    if not pages:
        raise ValueError(f"No text extracted from {file_path.name}")

    # ── Clean ─────────────────────────────────────────────────────
    progress("cleaning", 15)
    cleaner_path = Path(__file__).parent.parent / "ingest" / "cleaner.py"
    spec = importlib.util.spec_from_file_location("cleaner", cleaner_path)
    cleaner = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cleaner)

    cleaned_text = cleaner.clean_pages(pages, source_type="pdf")
    basename = file_path.stem

    # ── Chunk ─────────────────────────────────────────────────────
    progress("chunking", 25)
    chunks = cleaner.chunk_text_by_sentences(
        cleaned_text, max_tokens=500, overlap=100
    )
    chunk_texts = [text for (_, _, text) in chunks]

    if not chunk_texts:
        logger.warning(f"No chunks produced from {file_path.name} — skipping embedding/indexing")
        progress("done", 100)
        return {"status": "ok", "chunks": 0, "warning": "no_content"}

    # ── Embed ─────────────────────────────────────────────────────
    progress("embedding", 40)
    embeddings = vec.embed_chunks(chunk_texts)

    # ── Index vectors (Qdrant) ────────────────────────────────────
    progress("indexing vectors", 60)
    store.add_chunks(workspace_id, file_path.name, chunk_texts, embeddings)

    # ── BM25 index ────────────────────────────────────────────────
    progress("building BM25 index", 72)
    bm25_index.add_doc_chunks(workspace_id, chunk_texts)

    # ── Graph entities (GLiNER — local, no API calls) ─────────────
    progress("extracting graph entities", 82)
    nodes, edges = build_graph_data(chunk_texts, file_path.name, workspace_id)

    progress("building graph", 94)
    upsert_graph(workspace_id, nodes, edges)

    # ── Save processed chunks to disk ─────────────────────────────
    out_dir = PROCESSED_DIR / workspace_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{basename}.chunks.jsonl"
    with open(out_path, "w", encoding="utf-8") as f:
        for i, chunk in enumerate(chunk_texts):
            f.write(json.dumps({
                "doc_id": file_path.name,
                "chunk_index": i,
                "text": chunk,
                "source": file_path.name,
            }) + "\n")

    # Also write cleaned text file
    cleaner.write_cleaned_text(out_dir, basename, cleaned_text)

    progress("done", 100)
    logger.info(f"Pipeline complete: {file_path.name} → {len(chunk_texts)} chunks")
    return {"status": "ok", "chunks": len(chunk_texts)}
