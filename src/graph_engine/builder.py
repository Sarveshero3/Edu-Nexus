"""
Graph Builder — Edu Nexus
===========================
Orchestrates: extract entities from chunks → upsert into workspace graph.
Uses GLiNER-based extractor (no API calls) and NetworkX-based neo4j_ops.
"""

import logging

from src.graph_engine.extractor import build_graph_data
from src.graph_engine.neo4j_ops import upsert_graph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("GraphBuilder")


def build_graph(
    chunks: list[str],
    doc_id: str,
    workspace_id: str
) -> tuple[int, int]:
    """
    Extract entities from document chunks and build the knowledge graph.

    Parameters
    ----------
    chunks : list of text strings (one per chunk)
    doc_id : filename of the source document
    workspace_id : workspace this document belongs to

    Returns
    -------
    (node_count, edge_count) — how many nodes and edges were produced
    """
    if not chunks:
        logger.warning("No chunks provided to build_graph.")
        return 0, 0

    try:
        nodes, edges = build_graph_data(chunks, doc_id, workspace_id)
        logger.info(
            f"Extracted {len(nodes)} nodes, {len(edges)} edges "
            f"from {len(chunks)} chunks (doc={doc_id}, ws={workspace_id})"
        )

        if nodes or edges:
            upsert_graph(workspace_id, nodes, edges)
            logger.info(f"Graph upserted for workspace={workspace_id}")

        return len(nodes), len(edges)

    except Exception as e:
        logger.error(f"Graph build failed for {doc_id}: {e}")
        return 0, 0
