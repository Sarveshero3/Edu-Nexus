"""
Build Index — Legacy Standalone Script
========================================
For manual testing only. Not used by server.py or manager.py.
"""

import logging

from pypdf import PdfReader
from src.vector_engine.vector import embed_chunks
from src.vector_engine.store import add_chunks

logger = logging.getLogger("BuildIndex")


def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def build_from_pdf(filepath, workspace_id="default"):
    logger.info("Reading PDF...")
    text = extract_text_from_pdf(filepath)

    logger.info("Chunking text (simple split)...")
    # Simple chunking for testing
    chunks = [text[i:i+1000] for i in range(0, len(text), 800)]
    logger.info(f"Chunks created: {len(chunks)}")

    logger.info("Embedding chunks...")
    embeddings = embed_chunks(chunks)

    logger.info("Indexing to Qdrant...")
    add_chunks(workspace_id, filepath.split("/")[-1], chunks, embeddings)
    logger.info("Qdrant index built successfully!")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    build_from_pdf("tests/Sample_data/raw/pdf/UltimateJavaCheatSheet.pdf")