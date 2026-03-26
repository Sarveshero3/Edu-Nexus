"""
Graph Entity Extractor — Edu Nexus
====================================
Replaces the Groq LLM extractor with GLiNER for local, offline NER.
Eliminates ALL API calls during preprocessing.

GLiNER (~80MB) is loaded once on first use and runs in milliseconds/chunk.
Co-occurrence edges replace LLM-extracted relationships.
"""

from gliner import GLiNER
from config import GLINER_MODEL, ACADEMIC_ENTITY_LABELS
import itertools

_ner_model: GLiNER = None


def get_ner_model() -> GLiNER:
    """Load model once, reuse forever. ~80MB, loads in ~3s on first call."""
    global _ner_model
    if _ner_model is None:
        print(f"[GLiNER] Loading {GLINER_MODEL} — one-time download ~80MB...")
        _ner_model = GLiNER.from_pretrained(GLINER_MODEL)
        print("[GLiNER] Model loaded.")
    return _ner_model


def extract_entities(text: str) -> list[dict]:
    """
    Extract named entities from a single text chunk.
    Returns: [{"text": str, "label": str}, ...]
    Deduplicates by lowercased text.
    """
    model = get_ner_model()
    raw = model.predict_entities(text, ACADEMIC_ENTITY_LABELS, threshold=0.5)
    seen = {}
    for e in raw:
        key = e["text"].lower().strip()
        if key and key not in seen:
            seen[key] = {"text": key, "label": e["label"]}
    return list(seen.values())


def build_graph_data(
    chunks: list[str],
    doc_id: str,
    workspace_id: str
) -> tuple[list[dict], list[dict]]:
    """
    Process all chunks from one document.
    Returns (nodes, edges) ready for neo4j_ops.upsert_graph.

    Node schema:
        id          : str  (lowercased entity text — stable key)
        label       : str  (entity type from GLiNER)
        workspace_id: str
        doc_ids     : list[str]
        frequency   : int

    Edge schema:
        source      : str  (node id)
        target      : str  (node id)
        relation    : str  ("co-occurs")
        workspace_id: str
        doc_ids     : list[str]
        weight      : float (co-occurrence count, normalized later)
    """
    node_map: dict[str, dict] = {}
    edge_map: dict[tuple, dict] = {}

    # ── Relation label lookup based on entity type pairs ──────────
    #  Provides meaningful labels instead of generic "co-occurs"
    RELATION_MAP = {
        ("concept", "method"):       "uses method",
        ("concept", "algorithm"):    "implemented by",
        ("concept", "model"):        "modeled by",
        ("concept", "framework"):    "built with",
        ("concept", "tool"):         "uses tool",
        ("concept", "dataset"):      "evaluated on",
        ("concept", "metric"):       "measured by",
        ("concept", "person"):       "studied by",
        ("concept", "institution"):  "researched at",
        ("concept", "field"):        "belongs to",
        ("method", "algorithm"):     "implements",
        ("method", "model"):         "applied to",
        ("method", "dataset"):       "tested on",
        ("method", "metric"):        "evaluated with",
        ("method", "tool"):          "uses",
        ("method", "person"):        "proposed by",
        ("algorithm", "dataset"):    "trained on",
        ("algorithm", "metric"):     "scored by",
        ("algorithm", "model"):      "part of",
        ("model", "dataset"):        "trained on",
        ("model", "metric"):         "evaluated by",
        ("framework", "tool"):       "integrates",
        ("person", "institution"):   "affiliated with",
        ("person", "field"):         "works in",
        ("institution", "field"):    "specializes in",
    }

    def _get_relation(label_a: str, label_b: str) -> str:
        """Return a human-readable relation for two entity types."""
        key = (label_a, label_b)
        if key in RELATION_MAP:
            return RELATION_MAP[key]
        rev = (label_b, label_a)
        if rev in RELATION_MAP:
            return RELATION_MAP[rev]
        # Same type → "related"
        if label_a == label_b:
            return f"related {label_a}"
        return "related to"

    for chunk_text in chunks:
        entities = extract_entities(chunk_text)
        entity_ids = [e["text"] for e in entities]
        entity_labels = {e["text"]: e["label"] for e in entities}

        # Accumulate nodes
        for e in entities:
            nid = e["text"]
            if nid not in node_map:
                node_map[nid] = {
                    "id": nid,
                    "label": e["label"],
                    "workspace_id": workspace_id,
                    "doc_ids": [doc_id],
                    "frequency": 1
                }
            else:
                node_map[nid]["frequency"] += 1
                if doc_id not in node_map[nid]["doc_ids"]:
                    node_map[nid]["doc_ids"].append(doc_id)

        # Co-occurrence edges with meaningful relation labels
        for a, b in itertools.combinations(entity_ids, 2):
            key = (min(a, b), max(a, b))  # canonical undirected key
            if key not in edge_map:
                relation = _get_relation(
                    entity_labels.get(a, "concept"),
                    entity_labels.get(b, "concept")
                )
                edge_map[key] = {
                    "source": key[0],
                    "target": key[1],
                    "relation": relation,
                    "workspace_id": workspace_id,
                    "doc_ids": [doc_id],
                    "weight": 1.0
                }
            else:
                edge_map[key]["weight"] += 1.0
                if doc_id not in edge_map[key]["doc_ids"]:
                    edge_map[key]["doc_ids"].append(doc_id)

    # Normalize edge weights to [0, 1]
    if edge_map:
        max_w = max(e["weight"] for e in edge_map.values())
        for e in edge_map.values():
            e["weight"] = round(e["weight"] / max_w, 4)

    return list(node_map.values()), list(edge_map.values())
