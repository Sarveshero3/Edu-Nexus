"""
Build Index — Legacy Standalone Script
========================================
For manual testing only. Not used by server.py or manager.py.
"""

from pypdf import PdfReader
from src.vector_engine.vector import embed_chunks
from src.vector_engine.store import add_chunks


def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def build_from_pdf(filepath, workspace_id="default"):
    print("Reading PDF...")
    text = extract_text_from_pdf(filepath)

    print("Chunking text (simple split)...")
    # Simple chunking for testing
    chunks = [text[i:i+1000] for i in range(0, len(text), 800)]
    print(f"Chunks created: {len(chunks)}")

    print("Embedding chunks...")
    embeddings = embed_chunks(chunks)

    print("Indexing to Qdrant...")
    add_chunks(workspace_id, filepath.split("/")[-1], chunks, embeddings)
    print("Qdrant index built successfully!")


if __name__ == "__main__":
    build_from_pdf("tests/Sample_data/raw/pdf/UltimateJavaCheatSheet.pdf")