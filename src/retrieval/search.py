import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.vector_engine.vector import VectorStoreManager

def ask_question(query):
    manager = VectorStoreManager()
    results = manager.search(query)

    print("\nTop Matches:\n")
    for r in results:
        print("-", r)


if __name__ == "__main__":
    ask_question("What is recursion?")