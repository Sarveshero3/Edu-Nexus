---
name: ai-rag-architectures
description: Use when designing or implementing Retrieval-Augmented Generation systems, integrating vector stores, graph databases, or keyword searches
---

# AI RAG Architectures (Tri-Hybrid Models)

## Overview

Retrieval-Augmented Generation (RAG) dramatically reduces LLM hallucinations by providing curated context. A Tri-Hybrid RAG system combines multiple retrieval strategies (e.g., BM25 keyword search, FAISS Vector Store, and Neo4j Graph DB) to ensure accurate, context-aware, and nuanced answers across diverse queries.

## When to Use

- When building document Q&A interfaces
- When creating intelligent "Orchestrators" or "Manager" agents
- When synthesizing data streams for an LLM before text generation
- When integrating BM25, FAISS, or Graph DBs into backend AI systems

## Core Pattern

### The Tri-Hybrid Retrieval System

1. **BM25 Search (Lexical Context)**: Retrieves documents matching exact keywords or phrases seamlessly. Best for precision queries.
2. **Vector Store (Semantic Context)**: Use FAISS or ChromaDB. Embeds queries into vectors to find conceptually similar passages even if terminology differs.
3. **Graph Engine (Relational Context)**: Uses Neo4j or similar to trace entities and relationships, preserving the "who handles what" or multi-hop logic.

### Orchestration

- Use an `asyncio.gather` pattern to execute all three retrievers concurrently.
- Fuse outputs chronologically or logically into a `<context_block>`.
- Pass a strict system prompt instructing the LLM to ground _all_ answers in the provided context, clearly separating sections.

## Quick Reference

| Engine | Ideal For                                 | Failure Mode                                                     |
| ------ | ----------------------------------------- | ---------------------------------------------------------------- |
| BM25   | Proper nouns, specific IDs, rare keywords | Misses synonyms, spelling variations                             |
| FAISS  | Theme matching, conceptual Q&A            | Can retrieve irrelevant tangents if similarity threshold is weak |
| Graph  | "How are X and Y related?"                | Hard to populate automatically; requires strong schema           |

## Common Mistakes

- **Sequential Retrieval**: Running engines sequentially causes long latencies.
  - Fix: Always `await asyncio.gather(bm25(), faiss(), graph())`!
- **Context Stuffing**: Overwhelming the LLM window.
  - Fix: Impose strict top-k limits (e.g., top 3 from each engine).
- **Silent Failures**: Proceeding when an engine crashes.
  - Fix: Wrap retrievers in try-except; log errors but allow partial return.
