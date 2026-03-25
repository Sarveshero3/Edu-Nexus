"""
Search Utilities — Edu Nexus
===============================
Standalone search script (not used by server.py or manager.py).
"""

# NOTE: The VectorStoreManager class was removed during the Qdrant migration.
# Use src.vector_engine.store and src.vector_engine.vector directly.


def ask_question(query: str):
    """Legacy standalone search function — for manual testing only."""
    from src.vector_engine.vector import embed_query
    from src.vector_engine.store import search

    query_vec = embed_query(query)
    # Requires a workspace_id — use 'default' for standalone testing
    results = search("default", query_vec, top_k=5)

    print("\nTop Matches:\n")
    for r in results:
        print(f"- [score={r['score']:.4f}] {r['text'][:200]}")


if __name__ == "__main__":
    ask_question("What is recursion?")