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
    """
    Extract text using a priority chain:
      1. Docling (primary — best quality for PDFs/PPTX/scanned docs)
      2. Default extractors (pdfplumber, python-docx, etc.)
      3. OCR fallback (pytesseract)

    Docling is tried first when DOCLING_ENABLED=true (default).
    If Docling fails or returns empty text, falls back silently.
    """
    # ── Priority 1: Docling ──────────────────────────────────────
    if DOCLING_ENABLED:
        try:
            from src.ingest.docling_extractor import extract_with_docling, DOCLING_AVAILABLE
            if DOCLING_AVAILABLE:
                text = extract_with_docling(file_path)
                if text and text.strip():
                    logger.info(f"Docling extracted {len(text)} chars from {file_path.name}")
                    # Docling returns one markdown string; wrap as single "page"
                    return [text]
                logger.warning(f"Docling returned empty text for {file_path.name}, falling back")
            else:
                logger.info("Docling not installed, falling back to default extractor")
        except Exception as e:
            logger.warning(f"Docling failed for {file_path.name} ({e}), falling back")

    # ── Priority 2: Default extractors ───────────────────────────
    pages = extract_text(file_path)
    if pages and any(p.strip() for p in pages):
        logger.info(f"Default extractor produced {len(pages)} pages from {file_path.name}")
        return pages

    # ── Priority 3: OCR fallback (images/scanned PDFs only) ────────
    ocr_extensions = {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"}
    if file_path.suffix.lower() in ocr_extensions:
        logger.warning(f"Default extractor produced no text for {file_path.name}, trying OCR")
        try:
            from src.ingest.ocr import OCR
            ocr = OCR()
            ocr_text = ocr.image_to_text(str(file_path))
            if ocr_text and ocr_text.strip():
                logger.info(f"OCR extracted {len(ocr_text)} chars from {file_path.name}")
                return [ocr_text]
        except Exception as e:
            logger.warning(f"OCR fallback failed for {file_path.name}: {e}")

    # Nothing worked — return whatever we got (may be empty)
    return pages or []


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
