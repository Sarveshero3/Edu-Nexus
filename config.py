from pathlib import Path
import re

# ── Base directories ──────────────────────────────────────────
DATA_DIR       = Path("data")
RAW_DIR        = DATA_DIR / "raw"
PROCESSED_DIR  = DATA_DIR / "processed"
ARTIFACTS_DIR  = DATA_DIR / "artifacts"

# ── Storage backends (new) ────────────────────────────────────
QDRANT_DIR     = ARTIFACTS_DIR / "qdrant"
BM25_DIR       = ARTIFACTS_DIR / "bm25"
GRAPHS_DIR     = ARTIFACTS_DIR / "graphs"

# ── Auth ──────────────────────────────────────────────────────
AUTH_DIR       = DATA_DIR / "auth"

# ── Qdrant ────────────────────────────────────────────────────
QDRANT_COLLECTION = "edu_nexus_chunks"

# ── Embeddings ────────────────────────────────────────────────
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
EMBEDDING_DIM   = 384

# ── GLiNER ────────────────────────────────────────────────────
GLINER_MODEL = "urchade/gliner_small-v2.1"
ACADEMIC_ENTITY_LABELS = [
    "concept", "method", "algorithm", "model", "framework",
    "dataset", "metric", "person", "institution", "field", "tool"
]

# ── Workspace limits ──────────────────────────────────────────
MAX_DOCS_PER_WORKSPACE  = 20
MAX_FILE_SIZE_MB        = 50
MAX_UPLOAD_TOTAL_MB     = 200
ALLOWED_EXTENSIONS      = {".pdf", ".docx", ".txt", ".pptx", ".xlsx", ".csv", ".md"}
WORKSPACE_ID_PATTERN    = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")

# ── Ensure all directories exist on import ────────────────────
for _d in [RAW_DIR, PROCESSED_DIR, QDRANT_DIR, BM25_DIR, GRAPHS_DIR, AUTH_DIR]:
    _d.mkdir(parents=True, exist_ok=True)