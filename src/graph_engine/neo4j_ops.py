"""
Graph Database Layer — Edu Nexus
==================================
Replaces Neo4j with NetworkX + JSON file persistence.
Each workspace gets its own graph file: data/artifacts/graphs/graph_{workspace_id}.json

The frontend API contract (/api/graph/nodes, /api/graph/edges, /api/graph/node/{name})
remains identical — only the backend storage changes.
"""

import json
import networkx as nx
from pathlib import Path
from config import GRAPHS_DIR


def _graph_path(workspace_id: str) -> Path:
    return GRAPHS_DIR / f"graph_{workspace_id}.json"


def _load_graph(workspace_id: str) -> nx.Graph:
    path = _graph_path(workspace_id)
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        return nx.node_link_graph(data)
    return nx.Graph()


def _save_graph(workspace_id: str, G: nx.Graph) -> None:
    path = _graph_path(workspace_id)
    path.write_text(
        json.dumps(nx.node_link_data(G), ensure_ascii=False),
        encoding="utf-8"
    )


def upsert_graph(workspace_id: str, nodes: list[dict], edges: list[dict]) -> None:
    """
    Merge new nodes and edges into existing workspace graph.
    Nodes are keyed by 'id'. Edges are keyed by (source, target).
    Existing nodes have their frequency and doc_ids merged (not overwritten).
    """
    G = _load_graph(workspace_id)

    for node in nodes:
        nid = node["id"]
        if G.has_node(nid):
            existing = G.nodes[nid]
            existing["frequency"] = existing.get("frequency", 0) + node.get("frequency", 1)
            for did in node.get("doc_ids", []):
                if did not in existing.get("doc_ids", []):
                    existing.setdefault("doc_ids", []).append(did)
        else:
            G.add_node(nid, **node)

    for edge in edges:
        s, t = edge["source"], edge["target"]
        if G.has_edge(s, t):
            existing = G.edges[s, t]
            existing["weight"] = existing.get("weight", 0) + edge.get("weight", 1.0)
            for did in edge.get("doc_ids", []):
                if did not in existing.get("doc_ids", []):
                    existing.setdefault("doc_ids", []).append(did)
        else:
            G.add_edge(s, t, **edge)

    _save_graph(workspace_id, G)


def delete_doc_from_graph(workspace_id: str, doc_id: str) -> None:
    """
    Remove all nodes and edges that belonged only to doc_id.
    Nodes shared across multiple docs just have doc_id removed from their doc_ids list.
    """
    G = _load_graph(workspace_id)

    nodes_to_remove = []
    for nid, data in G.nodes(data=True):
        doc_ids = data.get("doc_ids", [])
        if doc_id in doc_ids:
            doc_ids.remove(doc_id)
            if not doc_ids:
                nodes_to_remove.append(nid)

    G.remove_nodes_from(nodes_to_remove)
    _save_graph(workspace_id, G)


def delete_workspace_graph(workspace_id: str) -> None:
    path = _graph_path(workspace_id)
    if path.exists():
        path.unlink()


def get_all_nodes(workspace_id: str, min_frequency: int = 1) -> list[dict]:
    G = _load_graph(workspace_id)
    nodes = []
    for nid, data in G.nodes(data=True):
        freq = data.get("frequency", 1)
        if freq >= min_frequency:
            nodes.append({"id": nid, **data})
    return nodes


def get_all_edges(workspace_id: str, min_weight: float = 0.0, min_frequency: int = 1) -> list[dict]:
    G = _load_graph(workspace_id)
    # Collect nodes that meet frequency threshold
    valid_nodes = set()
    for nid, data in G.nodes(data=True):
        if data.get("frequency", 1) >= min_frequency:
            valid_nodes.add(nid)

    edges = []
    for s, t, data in G.edges(data=True):
        if s in valid_nodes and t in valid_nodes:
            if data.get("weight", 1.0) >= min_weight:
                edges.append({"source": s, "target": t, **data})
    return edges


def get_node_detail(workspace_id: str, node_name: str) -> dict:
    G = _load_graph(workspace_id)
    name_lower = node_name.lower().strip()

    if not G.has_node(name_lower):
        return {}

    neighbors = []
    for neighbor in G.neighbors(name_lower):
        edge_data = G.edges[name_lower, neighbor]
        neighbors.append({
            "id": neighbor,
            **G.nodes[neighbor],
            "relation": edge_data.get("relation", "co-occurs"),
            "weight": edge_data.get("weight", 1.0)
        })

    return {
        "node": {"id": name_lower, **G.nodes[name_lower]},
        "neighbors": neighbors
    }


def get_graph_stats(workspace_id: str) -> dict:
    """Return basic graph statistics for health check."""
    G = _load_graph(workspace_id)
    return {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
    }


def search_graph(workspace_id: str, query_entities: list[str]) -> list[dict]:
    """
    For each query entity, find it and its 2-hop neighborhood.
    Used by orchestrator to enrich query context with related concepts.
    Returns deduplicated list of nearby node dicts.
    """
    G = _load_graph(workspace_id)
    found_nodes = set()
    result = []

    for entity in query_entities:
        entity = entity.lower().strip()
        if not G.has_node(entity):
            continue

        # 2-hop subgraph
        subgraph_nodes = {entity}
        for neighbor in G.neighbors(entity):
            subgraph_nodes.add(neighbor)
            for second_hop in G.neighbors(neighbor):
                subgraph_nodes.add(second_hop)

        for nid in subgraph_nodes:
            if nid not in found_nodes:
                found_nodes.add(nid)
                result.append({"id": nid, **G.nodes[nid]})

    return result


def workspace_graph_exists(workspace_id: str) -> bool:
    return _graph_path(workspace_id).exists()
