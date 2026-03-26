"""
Edu Nexus API Server
====================
FastAPI backend exposing the Tri-Hybrid GraphRAG engine via REST endpoints.
All responses follow the envelope: { "success": bool, "data": ..., "error": str|null }

Now with:
  - workspace_id isolation on all endpoints
  - Async ingestion with job tracking
  - Rate limiting via slowapi
"""

import uvicorn
import json
import shutil
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import (
    FastAPI, UploadFile, File, Form, HTTPException,
    Query, WebSocket, WebSocketDisconnect, BackgroundTasks, Request,
)
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config import (
    RAW_DIR, PROCESSED_DIR, ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_MB, MAX_DOCS_PER_WORKSPACE, WORKSPACE_ID_PATTERN,
)
from src.auth.auth_manager import AuthManager
from src.orchestrator.manager import OrchestratorManager
from src.vector_engine import store
from src.graph_engine import neo4j_ops
from src.retrieval import bm25_index
from src.pipeline.run_pipeline import run_pipeline

# ── Logging ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("edu_nexus")

# ── App ────────────────────────────────────────────────────────────────
app = FastAPI(title="Edu Nexus API", version="3.0.0")

# ── Rate Limiting ──────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS (Rule 1 from lessons.md: always include Vite + Next ports) ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state ──────────────────────────────────────────────────────
auth = AuthManager()
manager = OrchestratorManager()
chat_history: list[dict] = []
suggestions_cache: list[str] = []
suggestions_source_hash: str = ""

# ── Async job tracking ────────────────────────────────────────────────
ingestion_jobs: dict[str, dict] = {}


# ── Session Token Middleware ──────────────────────────────────────────
# Protects all /api/* routes except auth endpoints and status

AUTH_EXEMPT_PATHS = {
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/status",
    "/api/auth/logout",
    "/api/auth/delete-account",
    "/api/status",
    "/api/status/refresh",
}


class SessionAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.url.path

        # Skip non-API, auth-exempt, jobs, and WebSocket routes
        if (
            not path.startswith("/api/")
            or path in AUTH_EXEMPT_PATHS
            or path.startswith("/api/jobs/")
            or path.startswith("/ws")
        ):
            return await call_next(request)

        token = request.headers.get("x-session-token", "")
        # Fallback: check query parameter (needed for iframe/embed file viewing)
        if not token:
            token = request.query_params.get("token", "")
        if not token or not auth.validate_session(token):
            return JSONResponse(
                status_code=401,
                content={"success": False, "data": None, "error": "Not authenticated"},
            )

        return await call_next(request)


app.add_middleware(SessionAuthMiddleware)


# ── Helpers ────────────────────────────────────────────────────────────

def ok(data=None):
    """Standard success envelope."""
    return {"success": True, "data": data, "error": None}


def fail(message: str, status_code: int = 400):
    """Standard error envelope via HTTPException."""
    raise HTTPException(
        status_code=status_code,
        detail={"success": False, "data": None, "error": message},
    )


def validate_workspace_id(workspace_id: str) -> str:
    """Call this on every workspace_id before any file I/O. Raises 422 on invalid."""
    if not WORKSPACE_ID_PATTERN.match(workspace_id):
        raise HTTPException(
            status_code=422,
            detail="Invalid workspace_id. Use only letters, numbers, hyphens, underscores (max 64 chars)."
        )
    return workspace_id


def _make_job(files: list[str]) -> str:
    job_id = str(uuid.uuid4())
    file_tracking = {}
    for fname in files:
        file_tracking[fname] = {
            "status": "pending",
            "stage": "queued",
            "chunks": 0,
            "warning": None,
            "error": None,
        }
    ingestion_jobs[job_id] = {
        "status": "queued",
        "progress": 0,
        "stage": "queued",
        "files": file_tracking,
        "started_at": datetime.utcnow().isoformat(),
        "error": None
    }
    return job_id


def _update_job(job_id: str, stage: str, pct: int):
    if job_id in ingestion_jobs:
        ingestion_jobs[job_id]["stage"] = stage
        ingestion_jobs[job_id]["progress"] = pct
        if pct < 100:
            ingestion_jobs[job_id]["status"] = "processing"
        else:
            ingestion_jobs[job_id]["status"] = "done"


def _update_file_status(job_id: str, filename: str, **kwargs):
    """Update per-file tracking fields."""
    if job_id in ingestion_jobs and filename in ingestion_jobs[job_id]["files"]:
        ingestion_jobs[job_id]["files"][filename].update(kwargs)


# ====================================================================== #
#  AUTH                                                                     #
# ====================================================================== #

class AuthBody(BaseModel):
    username: str
    password: str


@app.post("/api/auth/register")
@limiter.limit("5/minute")
async def auth_register(request: Request, body: AuthBody):
    """Register the single local user."""
    try:
        token = auth.register(body.username, body.password)
        return ok({"token": token, "username": body.username})
    except ValueError as e:
        fail(str(e), 400)


@app.post("/api/auth/login")
@limiter.limit("10/minute")
async def auth_login(request: Request, body: AuthBody):
    """Login with username + password."""
    try:
        token = auth.login(body.username, body.password)
        return ok({"token": token, "username": body.username})
    except ValueError as e:
        fail(str(e), 401)


@app.post("/api/auth/logout")
async def auth_logout(request: Request):
    """Invalidate the current session."""
    token = request.headers.get("x-session-token", "")
    auth.logout(token)
    return ok({"message": "Logged out"})


@app.get("/api/auth/status")
@limiter.limit("60/minute")
async def auth_status_check(request: Request):
    """Check if a user is registered + if a valid session exists."""
    token = request.headers.get("x-session-token", "")
    status = auth.get_status()
    # Also check if the provided token is valid
    if token:
        session = auth.validate_session(token)
        status["logged_in"] = session is not None
        if session:
            status["username"] = session["username"]
    else:
        status["logged_in"] = False
    return ok(status)


@app.post("/api/auth/delete-account")
async def auth_delete_account(request: Request):
    """DELETE EVERYTHING — wipes user and all data."""
    auth.delete_account()
    return ok({"message": "Account and all data deleted"})


# ====================================================================== #
#  STATUS                                                                  #
# ====================================================================== #

@app.get("/api/status")
@limiter.limit("60/minute")
async def get_status(request: Request, workspace_id: str = Query("default")):
    """Returns readiness status for all three retrieval engines with real health checks."""
    # BM25
    bm25_online = False
    bm25_doc_count = 0
    try:
        bm25_online = bm25_index.index_exists(workspace_id)
        if bm25_online:
            bm25_doc_count = bm25_index.doc_count(workspace_id)
    except Exception:
        pass

    # Qdrant
    qdrant_online = False
    vector_count = 0
    try:
        qdrant_online = store.collection_exists()
        if qdrant_online:
            vector_count = store.count_docs(workspace_id)
    except Exception:
        pass

    # Graph (NetworkX)
    graph_online = False
    node_count = 0
    edge_count = 0
    try:
        graph_online = neo4j_ops.workspace_graph_exists(workspace_id)
        if graph_online:
            stats = neo4j_ops.get_graph_stats(workspace_id)
            node_count = stats.get("nodes", 0)
            edge_count = stats.get("edges", 0)
    except Exception:
        pass

    return ok({
        "bm25": {"online": bm25_online, "doc_count": bm25_doc_count},
        "qdrant": {"online": qdrant_online, "vector_count": vector_count},
        "graph": {"online": graph_online, "node_count": node_count, "edge_count": edge_count},
    })


@app.get("/api/status/refresh")
@limiter.limit("60/minute")
async def refresh_status(request: Request, workspace_id: str = Query("default")):
    """Re-check engine readiness."""
    return await get_status(request, workspace_id)


# ====================================================================== #
#  JOBS (async ingestion tracking)                                        #
# ====================================================================== #

@app.get("/api/jobs/{job_id}")
@limiter.limit("60/minute")
async def get_job_status(request: Request, job_id: str):
    """Check the status of an ingestion job."""
    job = ingestion_jobs.get(job_id)
    if not job:
        fail(f"Job '{job_id}' not found", 404)
    return ok({"job_id": job_id, **job})


# ====================================================================== #
#  SOURCES (documents)                                                     #
# ====================================================================== #

@app.get("/api/sources")
@limiter.limit("60/minute")
async def list_sources(request: Request, workspace_id: str = Query("default")):
    """List all ingested source documents for a workspace."""
    validate_workspace_id(workspace_id)

    doc_names = store.list_docs(workspace_id)
    sources = []
    for i, name in enumerate(doc_names):
        chunks_count = 0
        jsonl_path = PROCESSED_DIR / workspace_id / f"{Path(name).stem}.chunks.jsonl"
        # Fallback: check legacy flat path
        if not jsonl_path.exists():
            jsonl_path = PROCESSED_DIR / f"{Path(name).stem}.chunks.jsonl"
        if jsonl_path.exists():
            with open(jsonl_path, "r", encoding="utf-8") as f:
                chunks_count = sum(1 for _ in f)

        ext = Path(name).suffix.lower().lstrip(".")
        sources.append({
            "id": str(i),
            "name": name,
            "type": ext,
            "chunks": chunks_count,
            "date": datetime.now(timezone.utc).isoformat(),
        })
    return ok(sources)


@app.post("/api/sources/upload")
@limiter.limit("5/minute")
async def upload_sources(
    request: Request,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    workspace_id: str = Form("default"),
):
    """Upload documents and trigger background ingestion pipeline."""
    validate_workspace_id(workspace_id)

    # Validate file extensions and sizes
    file_contents = []
    for file in files:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"File type {ext} not allowed.")
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"{file.filename} exceeds {MAX_FILE_SIZE_MB}MB limit.")
        file_contents.append((file.filename, content))

    # Check workspace doc limit
    current_count = store.count_docs(workspace_id)
    if current_count + len(files) > MAX_DOCS_PER_WORKSPACE:
        raise HTTPException(
            400,
            f"Workspace limit is {MAX_DOCS_PER_WORKSPACE} documents. "
            f"Currently has {current_count}."
        )

    # Save files to workspace raw dir
    ws_raw_dir = RAW_DIR / workspace_id
    ws_raw_dir.mkdir(parents=True, exist_ok=True)
    saved_paths = []
    for filename, content in file_contents:
        dest = ws_raw_dir / filename
        dest.write_bytes(content)
        saved_paths.append(dest)

    # Create job and start background ingestion
    job_id = _make_job([p.name for p in saved_paths])

    def run_all():
        total_files = len(saved_paths)
        for idx, path in enumerate(saved_paths):
            fname = path.name
            try:
                # Update per-file status
                _update_file_status(job_id, fname, status="processing", stage="starting")

                def file_progress(stage, pct):
                    _update_file_status(job_id, fname, stage=stage)
                    # Overall progress: combine file index and per-file pct
                    overall = int(((idx * 100) + pct) / total_files)
                    _update_job(job_id, f"{fname}: {stage}", min(overall, 99))

                result = run_pipeline(path, workspace_id, on_progress=file_progress)
                chunks = result.get("chunks", 0)
                warning = result.get("warning")
                _update_file_status(
                    job_id, fname,
                    status="done",
                    stage="done",
                    chunks=chunks,
                    warning=warning,
                )
            except Exception as e:
                _update_file_status(
                    job_id, fname,
                    status="error",
                    stage="failed",
                    error=str(e),
                )
                logger.error(f"Ingestion failed for {fname}: {e}")

        # Mark overall job done
        ingestion_jobs[job_id]["status"] = "done"
        ingestion_jobs[job_id]["progress"] = 100
        ingestion_jobs[job_id]["stage"] = "done"

    background_tasks.add_task(run_all)
    return ok({"job_id": job_id, "status": "queued", "files": [p.name for p in saved_paths]})


# Frontend calls /api/sources/upload-batch (multi-file)
@app.post("/api/sources/upload-batch")
@limiter.limit("5/minute")
async def upload_batch(
    request: Request,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    workspace_id: str = Form("default"),
):
    """Multi-file upload — the endpoint the frontend actually calls."""
    return await upload_sources(
        request=request,
        background_tasks=background_tasks,
        files=files,
        workspace_id=workspace_id,
    )


# Keep legacy single-file endpoint
@app.post("/api/upload")
@limiter.limit("5/minute")
async def upload_file_legacy(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    workspace_id: str = Form("default"),
):
    """Legacy upload endpoint — redirects to /api/sources/upload."""
    return await upload_sources(
        request=request,
        background_tasks=background_tasks,
        files=[file],
        workspace_id=workspace_id,
    )


@app.delete("/api/sources/{name}")
@limiter.limit("60/minute")
async def delete_source(request: Request, name: str, workspace_id: str = Query("default")):
    """Remove a source document from a workspace."""
    validate_workspace_id(workspace_id)

    # Delete from Qdrant
    store.delete_doc(workspace_id, name)

    # Delete from NetworkX graph
    neo4j_ops.delete_doc_from_graph(workspace_id, name)

    # Delete from BM25 and rebuild
    bm25_index.delete_doc_and_rebuild(workspace_id, name)

    # Clean up files
    raw_path = RAW_DIR / workspace_id / name
    if raw_path.exists():
        raw_path.unlink()

    processed_path = PROCESSED_DIR / workspace_id / f"{Path(name).stem}.chunks.jsonl"
    if processed_path.exists():
        processed_path.unlink()

    txt_path = PROCESSED_DIR / workspace_id / f"{Path(name).stem}.txt"
    if txt_path.exists():
        txt_path.unlink()

    return ok({"message": f"Source '{name}' deleted successfully"})


@app.get("/api/sources/{name}/content")
@limiter.limit("60/minute")
async def get_source_content(request: Request, name: str, workspace_id: str = Query("default")):
    """Get the parsed text chunks for a specific source document."""
    validate_workspace_id(workspace_id)

    jsonl_path = PROCESSED_DIR / workspace_id / f"{Path(name).stem}.chunks.jsonl"
    if not jsonl_path.exists():
        fail(f"Content for '{name}' not found", 404)

    chunks = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f):
            try:
                chunk_data = json.loads(line.strip())
                chunks.append({
                    "id": line_num,
                    "text": chunk_data.get("text", chunk_data.get("chunk", "")),
                    "source": chunk_data.get("source", name),
                })
            except json.JSONDecodeError:
                continue

    return ok({"name": name, "chunks": chunks, "total": len(chunks)})


@app.get("/api/sources/{name}/file")
@limiter.limit("60/minute")
async def serve_source_file(request: Request, name: str, workspace_id: str = Query("default")):
    """Serve the raw source file for inline viewing."""
    validate_workspace_id(workspace_id)

    raw_path = RAW_DIR / workspace_id / name
    # Fallback: check legacy flat path
    if not raw_path.exists():
        raw_path = RAW_DIR / name
    if not raw_path.exists():
        fail(f"File '{name}' not found", 404)

    mime_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".csv": "text/csv",
        ".txt": "text/plain",
        ".md": "text/markdown",
    }
    ext = raw_path.suffix.lower()
    media_type = mime_map.get(ext, "application/octet-stream")

    return FileResponse(
        path=str(raw_path),
        media_type=media_type,
        filename=name,
        headers={"Content-Disposition": "inline"},
    )


# ====================================================================== #
#  CHAT                                                                    #
# ====================================================================== #

class ChatRequest(BaseModel):
    query: str
    workspace_id: str = "default"
    source_filter: list[str] | None = None
    single_doc: bool = False


@app.post("/api/chat")
@limiter.limit("10/minute")
async def chat(request: Request, body: ChatRequest):
    """Send a query to the Tri-Hybrid RAG engine."""
    validate_workspace_id(body.workspace_id)
    query = body.query.strip()
    if not query:
        fail("Query cannot be empty")

    try:
        response = await manager.generate_answer(
            query,
            workspace_id=body.workspace_id,
            source_filter=body.source_filter,
            single_doc=body.single_doc,
        )
    except Exception as e:
        logger.error(f"[chat] Failed: {str(e)}")
        fail(f"Chat query failed: {str(e)}", 500)

    # Determine primary engine used
    chosen = response.get("chosen_brains", [])
    if len(chosen) >= 2:
        engine_used = "hybrid"
    elif "keyword" in chosen:
        engine_used = "bm25"
    elif "semantic" in chosen:
        engine_used = "faiss"
    elif "graph" in chosen:
        engine_used = "neo4j"
    else:
        engine_used = "none"

    # Build chain-of-thought steps
    chain_of_thought = []
    router = response.get("router_decision", {})

    chain_of_thought.append({
        "step": "Analyzing query",
        "detail": "Understanding what you're asking about...",
        "status": "done",
    })

    chain_of_thought.append({
        "step": "Selecting retrieval strategy",
        "detail": router.get("reasoning", "Choosing the best retrieval brains"),
        "status": "done",
    })

    brain_labels = {
        "keyword": "Fast Brain (Keyword Search)",
        "semantic": "Semantic Brain (Vector Search)",
        "graph": "Deep Brain (Knowledge Graph)",
    }
    for brain in chosen:
        label = brain_labels.get(brain, brain)
        chain_of_thought.append({
            "step": f"Querying {label}",
            "detail": "Searching through your documents...",
            "status": "done",
        })

    chain_of_thought.append({
        "step": "Synthesizing answer",
        "detail": "Combining context from all sources into a coherent answer",
        "status": "done",
    })

    # Build sources list
    sources = []
    bm25_chunks = response.get("bm25_chunks", [])
    graph_triples = response.get("graph_triples", [])
    vector_results = response.get("vector_results", [])

    for i, chunk in enumerate(bm25_chunks):
        text = chunk.get("text", "") if isinstance(chunk, dict) else chunk
        sources.append({"type": "keyword", "preview": text[:150], "index": i})

    for i, node in enumerate(graph_triples):
        nid = node.get("id", "?") if isinstance(node, dict) else str(node)
        label = node.get("label", "entity") if isinstance(node, dict) else ""
        sources.append({
            "type": "graph",
            "preview": f"{nid} ({label})",
            "index": i,
        })

    for i, r in enumerate(vector_results):
        text = r.get("text", "") if isinstance(r, dict) else str(r)
        score = r.get("score", 0.0) if isinstance(r, dict) else 0.0
        sources.append({
            "type": "semantic",
            "preview": text[:150],
            "score": round(score, 4) if isinstance(score, float) else score,
            "index": i,
        })

    # Compute basic confidence
    total_sources = len(bm25_chunks) + len(graph_triples) + len(vector_results)
    confidence = min(1.0, total_sources / 6.0) if total_sources > 0 else 0.0

    # Save to history
    entry_id = str(uuid.uuid4())
    history_entry = {
        "id": entry_id,
        "query": query,
        "answer": response.get("answer", ""),
        "engine_used": engine_used,
        "chosen_brains": chosen,
        "confidence": round(confidence, 2),
        "sources_count": total_sources,
        "workspace_id": body.workspace_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    chat_history.insert(0, history_entry)

    return ok({
        "answer": response.get("answer", ""),
        "engine_used": engine_used,
        "chosen_brains": chosen,
        "sources": sources,
        "confidence": round(confidence, 2),
        "chain_of_thought": chain_of_thought,
        "router_reasoning": router.get("reasoning", ""),
    })


# ====================================================================== #
#  HISTORY                                                                 #
# ====================================================================== #

@app.get("/api/history")
@limiter.limit("60/minute")
async def get_history(request: Request):
    """Get all past chat queries and answers."""
    return ok(chat_history)


@app.delete("/api/history/{entry_id}")
@limiter.limit("60/minute")
async def delete_history(request: Request, entry_id: str):
    """Delete a history entry by ID."""
    global chat_history
    before = len(chat_history)
    chat_history = [h for h in chat_history if h["id"] != entry_id]
    if len(chat_history) == before:
        fail(f"History entry '{entry_id}' not found", 404)
    return ok({"message": "History entry deleted"})


# ====================================================================== #
#  GRAPH                                                                   #
# ====================================================================== #

@app.get("/api/graph/nodes")
@limiter.limit("60/minute")
async def get_graph_nodes(
    request: Request,
    workspace_id: str = Query("default"),
    min_frequency: int = Query(1, ge=1, description="Minimum entity frequency"),
):
    """Fetch all nodes from the workspace knowledge graph."""
    validate_workspace_id(workspace_id)

    try:
        raw_nodes = neo4j_ops.get_all_nodes(workspace_id, min_frequency=min_frequency)
        nodes = []
        for n in raw_nodes:
            nodes.append({
                "id": n.get("id", ""),
                "name": n.get("id", "Unknown"),
                "group": n.get("label", "Entity"),
                "frequency": n.get("frequency", 1),
                "doc_ids": n.get("doc_ids", []),
            })
        return ok({"nodes": nodes, "total": len(nodes)})
    except Exception as e:
        logger.error(f"[graph/nodes] Failed: {e}")
        fail(f"Failed to fetch graph nodes: {str(e)}", 500)


@app.get("/api/graph/edges")
@limiter.limit("60/minute")
async def get_graph_edges(
    request: Request,
    workspace_id: str = Query("default"),
    min_frequency: int = Query(1, ge=1, description="Minimum node frequency"),
    min_weight: float = Query(0.0, ge=0.0, description="Minimum edge weight"),
):
    """Fetch all edges from the workspace knowledge graph."""
    validate_workspace_id(workspace_id)

    try:
        raw_edges = neo4j_ops.get_all_edges(workspace_id, min_weight=min_weight, min_frequency=min_frequency)
        edges = []
        for e in raw_edges:
            edges.append({
                "source": e.get("source", ""),
                "target": e.get("target", ""),
                "relation": e.get("relation", "co-occurs"),
                "weight": e.get("weight", 1.0),
                "source_name": e.get("source", ""),
                "target_name": e.get("target", ""),
            })
        return ok({"edges": edges, "total": len(edges)})
    except Exception as e:
        logger.error(f"[graph/edges] Failed: {e}")
        fail(f"Failed to fetch graph edges: {str(e)}", 500)


@app.get("/api/graph/node/{node_name}")
@limiter.limit("60/minute")
async def get_graph_node_detail(request: Request, node_name: str, workspace_id: str = Query("default")):
    """Fetch a single node and its connections."""
    validate_workspace_id(workspace_id)

    try:
        detail = neo4j_ops.get_node_detail(workspace_id, node_name)
        if not detail:
            fail(f"Node '{node_name}' not found", 404)

        node_data = detail.get("node", {})
        neighbors = detail.get("neighbors", [])

        connections = [
            {
                "relation": nb.get("relation", "co-occurs"),
                "connected": nb.get("id", ""),
            }
            for nb in neighbors
        ]

        return ok({
            "name": node_data.get("id", node_name),
            "labels": [node_data.get("label", "Entity")],
            "connections": connections,
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[graph/node] Failed: {e}")
        fail(f"Failed to fetch node detail: {str(e)}", 500)


# ====================================================================== #
#  SEARCH                                                                  #
# ====================================================================== #

@app.get("/api/search")
@limiter.limit("30/minute")
async def search_endpoint(
    request: Request,
    q: str = Query(..., description="Search query"),
    engine: Optional[str] = Query(None, description="Engine: bm25, faiss, neo4j, or all"),
    workspace_id: str = Query("default"),
):
    """Run a targeted search across the tri-hybrid engines."""
    validate_workspace_id(workspace_id)

    if not q.strip():
        fail("Query parameter 'q' is required")

    engine = (engine or "all").lower()
    results = {"query": q, "engine": engine, "hits": []}

    try:
        if engine in ("bm25", "all"):
            bm25_hits = bm25_index.search(workspace_id, q, top_k=10)
            for i, hit in enumerate(bm25_hits):
                results["hits"].append({
                    "engine": "bm25",
                    "rank": i + 1,
                    "text": hit.get("text", "")[:300],
                    "score": hit.get("score"),
                })

        if engine in ("faiss", "all"):
            query_vec = vec_embed_query(q)
            faiss_hits = store.search(workspace_id, query_vec, top_k=10)
            for i, hit in enumerate(faiss_hits):
                results["hits"].append({
                    "engine": "faiss",
                    "rank": i + 1,
                    "text": hit.get("text", "")[:300],
                    "score": round(hit.get("score", 0), 4),
                })

        if engine in ("neo4j", "all"):
            # Extract keywords for graph search
            stopwords = {
                "what", "is", "the", "a", "an", "of", "to", "and", "in",
                "for", "on", "how", "does", "do", "are",
            }
            keywords = [
                w.lower() for w in q.split()
                if w.lower() not in stopwords and len(w) > 1
            ]
            graph_hits = neo4j_ops.search_graph(workspace_id, keywords)
            for i, node in enumerate(graph_hits):
                results["hits"].append({
                    "engine": "neo4j",
                    "rank": i + 1,
                    "text": f"{node.get('id', '?')} ({node.get('label', 'entity')})",
                    "score": None,
                })

        results["total"] = len(results["hits"])
        return ok(results)

    except Exception as e:
        logger.error(f"[search] Failed: {e}")
        fail(f"Search failed: {str(e)}", 500)


# Helper for search endpoint
def vec_embed_query(text: str) -> list[float]:
    from src.vector_engine.vector import embed_query
    return embed_query(text)


# ====================================================================== #
#  SUGGESTIONS                                                             #
# ====================================================================== #

@app.get("/api/suggestions")
@limiter.limit("60/minute")
async def get_suggestions(request: Request, workspace_id: str = Query("default")):
    """Generate 3 AI-suggested questions based on ingested documents."""
    import asyncio
    global suggestions_cache, suggestions_source_hash

    validate_workspace_id(workspace_id)

    doc_names = store.list_docs(workspace_id)
    current_hash = ",".join(sorted(doc_names))

    if suggestions_cache and current_hash == suggestions_source_hash:
        return ok(suggestions_cache)

    if not doc_names:
        return ok([])

    # Gather sample chunks
    sample_chunks = []
    for fname in doc_names[:3]:
        jsonl_path = PROCESSED_DIR / workspace_id / f"{Path(fname).stem}.chunks.jsonl"
        if jsonl_path.exists():
            with open(jsonl_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for line in lines[:2]:
                    try:
                        chunk = json.loads(line.strip())
                        text = chunk.get("text", "")[:300]
                        sample_chunks.append(f"[{fname}]: {text}")
                    except json.JSONDecodeError:
                        continue

    if not sample_chunks:
        return ok([])

    try:
        from groq import Groq
        client = Groq()
        prompt = (
            "Based on these document excerpts, generate exactly 3 short questions "
            "a student might ask. Return ONLY a JSON array of 3 strings, nothing else.\n\n"
            + "\n".join(sample_chunks)
        )
        completion = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=200,
            )
        )
        raw = completion.choices[0].message.content.strip()
        questions = json.loads(raw)
        if isinstance(questions, list) and len(questions) >= 1:
            suggestions_cache = questions[:3]
            suggestions_source_hash = current_hash
            return ok(suggestions_cache)
    except Exception as e:
        logger.warning(f"[suggestions] Failed to generate: {e}")

    # Fallback
    fallback = [
        f"Summarize the key concepts in {doc_names[0]}" if doc_names else "Upload a document to get started",
        "What are the main topics covered in the uploaded documents?",
        "Explain the relationship between the key terms in my documents",
    ]
    return ok(fallback)


# ====================================================================== #
#  SETTINGS                                                                #
# ====================================================================== #

engine_weights = {
    "bm25_weight": 0.33,
    "graph_weight": 0.33,
    "vector_weight": 0.34,
}


class EngineWeights(BaseModel):
    bm25_weight: float
    graph_weight: float
    vector_weight: float


@app.get("/api/settings/engines")
@limiter.limit("60/minute")
async def get_engine_settings(request: Request):
    """Get current engine weights."""
    return ok(engine_weights)


@app.post("/api/settings/engines")
@limiter.limit("60/minute")
async def save_engine_settings(request: Request, weights: EngineWeights):
    """Save engine weights."""
    global engine_weights
    engine_weights = {
        "bm25_weight": weights.bm25_weight,
        "graph_weight": weights.graph_weight,
        "vector_weight": weights.vector_weight,
    }
    return ok({"message": "Engine weights saved", **engine_weights})


# ====================================================================== #
#  WEBSOCKET CHAT (kept for backward compatibility)                        #
# ====================================================================== #

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket chat endpoint — legacy, kept for backward compat."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                query = msg.get("query")
                ws_id = msg.get("workspace_id", "default")
            except Exception:
                query = data
                ws_id = "default"

            if not query:
                continue

            await websocket.send_json({"type": "status", "message": "Analyzing query..."})

            response = await manager.generate_answer(query, workspace_id=ws_id)

            await websocket.send_json({
                "type": "result",
                "router_decision": response.get("router_decision", {}),
                "chosen_brains": response.get("chosen_brains", []),
                "bm25_chunks": response.get("bm25_chunks", []),
                "graph_triples": response.get("graph_triples", []),
                "vector_results": response.get("vector_results", []),
                "answer": response.get("answer", ""),
            })
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")


# ====================================================================== #
#  ENTRYPOINT                                                              #
# ====================================================================== #

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
