import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

# Try importing splitter if available
try:
    from src.splitter.textSplitter import chunk_text
except Exception:
    chunk_text = None


class VectorStoreManager:
    def __init__(self, db_path="data/artifacts/faiss_index"):
        self.db_path = db_path
        self.embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        self.vector_db = None

    # ---------- CREATE DATABASE ----------
    def create_database(self, chunks):
        print("Creating FAISS index...")
        self.vector_db = FAISS.from_texts(chunks, self.embedding_model)

        os.makedirs(self.db_path, exist_ok=True)
        self.vector_db.save_local(self.db_path)

        print(f"Saved FAISS index at {self.db_path}")

    # ---------- LOAD DATABASE ----------
    def load_database(self):
        print("Loading FAISS index...")
        self.vector_db = FAISS.load_local(
            self.db_path,
            self.embedding_model,
            allow_dangerous_deserialization=True
        )

    # ---------- SEARCH ----------
    def search(self, query, k=5):
        if self.vector_db is None:
            self.load_database()

        docs = self.vector_db.similarity_search(query, k=k)
        return [d.page_content for d in docs]


# ================================
# TEST SECTION (Dummy + Splitter)
# ================================
if __name__ == "__main__":

    manager = VectorStoreManager()

    print("\n=== Dummy Test ===")

    dummy_chunks = [
        "Recursion is when a function calls itself.",
        "Neural networks are inspired by the human brain.",
        "Computer networking connects devices together.",
        "Operating systems manage hardware and software.",
        "Databases store and organize data efficiently."
    ]

    manager.create_database(dummy_chunks)

    results = manager.search("What is a function calling itself?")
    print("\nResults:")
    for r in results:
        print("-", r)

    # OPTIONAL real splitter test
    if chunk_text:
        print("\n=== Splitter Test ===")

        sample_text = """
        Artificial Intelligence is used in healthcare and robotics.
        Machine learning learns from data.
        Deep learning uses neural networks.
        """ * 40

        chunks = chunk_text(sample_text)
        manager.create_database(chunks)

        results = manager.search("Where is AI used?")
        print("\nResults from splitter:")
        for r in results:
            print("-", r)