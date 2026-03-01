from pypdf import PdfReader
from src.splitter.textSplitter import chunk_text
from src.vector_engine.vector import VectorStoreManager


def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text


def build_from_pdf(filepath):
    print("Reading PDF...")
    text = extract_text_from_pdf(filepath)

    print("Chunking text...")
    chunks = chunk_text(text)

    print("Chunks created:", len(chunks))

    manager = VectorStoreManager()
    manager.create_database(chunks)

    print("FAISS index built successfully!")


if __name__ == "__main__":
    build_from_pdf("tests/Sample_data/raw/pdf/UltimateJavaCheatSheet.pdf")