"""
Edu Nexus API Server
====================
FastAPI backend exposing the Tri-Hybrid GraphRAG engine via REST endpoints.
All responses follow the envelope: { "success": bool, "data": ..., "error": str|null }
"""

import uvicorn
import json
import os
import shutil
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.orchestrator.manager import OrchestratorManager

# ── Logging ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("edu_nexus")

# ── App ────────────────────────────────────────────────────────────────
app = FastAPI(title="Edu Nexus API", version="2.0.0")

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
manager = OrchestratorManager()
chat_history: list[dict] = []
suggestions_cache: list[str] = []
suggestions_source_hash: str = ""

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


# ====================================================================== #
#  STATUS                                                                  #
# ====================================================================== #

@app.get("/api/status")
async def get_status():
    """Returns readiness status for all three retrieval engines."""
    return ok({
        "bm25": manager._bm25_ready,
        "faiss": manager._vector_ready,
        "neo4j": manager._graph_ready,
        "ingested_count": len(manager._ingested_files),
    })


@app.get("/api/status/refresh")
async def refresh_status():
    """Re-check engine connectivity (e.g. after starting Neo4j)."""
    # Re-check Neo4j
    manager._graph_ready = manager.neo4j.verify_connectivity()
    # BM25 + FAISS are ready if index files exist
    try:
        manager.keyword_engine.load_index()
        manager._bm25_ready = True
    except Exception:
        manager._bm25_ready = False
    # FAISS readiness is just whether the store has vectors
    manager._vector_ready = manager.vector_store._index is not None
    return ok({
        "bm25": manager._bm25_ready,
        "faiss": manager._vector_ready,
        "neo4j": manager._graph_ready,
        "ingested_count": len(manager._ingested_files),
    })


# ====================================================================== #
#  SOURCES (documents)                                                     #
# ====================================================================== #

@app.get("/api/sources")
async def list_sources():
    """List all ingested source documents."""
    sources = []
    for i, name in enumerate(manager._ingested_files):
        # Try to get chunk count from processed JSONL
        chunks_count = 0
        jsonl_path = Path("data/processed") / f"{Path(name).stem}.chunks.jsonl"
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
async def upload_source(file: UploadFile = File(...)):
    """Upload a document and trigger the full ingestion pipeline.

    Returns progress stages for the frontend to display:
    extracting → cleaning → chunking → indexing → graphing → done
    """
    # Save to a temp directory first — manager.ingest_file() will copy
    # to data/raw/ internally. Saving directly to data/raw/ causes a
    # "same file" error because shutil.copy2 can't copy a file to itself.
    tmp_dir = Path("data/.tmp_uploads")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = tmp_dir / file.filename

    try:
        with open(tmp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"[upload] File save failed: {e}")
        fail(f"Failed to save file: {str(e)}", 500)

    result = await manager.ingest_file(file.filename, str(tmp_path))

    # Clean up temp file after ingestion
    try:
        if tmp_path.exists():
            tmp_path.unlink()
    except Exception:
        pass

    if result["status"] == "ok":
        return ok({
            "message": result["message"],
            "filename": file.filename,
            "chunks_count": result["chunks_count"],
            "graph_nodes": result.get("graph_nodes", 0),
            "graph_rels": result.get("graph_rels", 0),
        })
    else:
        fail(result["message"], 500)


# Keep legacy endpoint for backward compatibility
@app.post("/api/upload")
async def upload_file_legacy(file: UploadFile = File(...)):
    """Legacy upload endpoint — redirects to /api/sources/upload."""
    return await upload_source(file)


@app.post("/api/sources/upload-batch")
async def upload_batch(files: list[UploadFile] = File(...)):
    """Upload multiple documents and process them in parallel.

    Extraction+chunking runs concurrently for all files.
    Index rebuild happens ONCE at the end (not per-file).
    """
    tmp_dir = Path("data/.tmp_uploads")
    tmp_dir.mkdir(parents=True, exist_ok=True)

    results = []
    ingest_tasks = []

    # Step 1: Save all files to temp
    for file in files:
        tmp_path = tmp_dir / file.filename
        try:
            with open(tmp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            results.append({"filename": file.filename, "status": "error", "message": str(e)})
            continue

        ingest_tasks.append((file.filename, tmp_path))

    # Step 2: Run extraction+chunking in parallel
    async def process_one(fname, path):
        ext = Path(fname).suffix.lower()
        if ext not in manager._ingested_files.__class__.__mro__:
            pass  # Extension check happens in _run_ingestion
        try:
            dest = Path("data/raw") / fname
            shutil.copy2(str(path), dest)
            if fname not in manager._ingested_files:
                manager._ingested_files.append(fname)
            chunks_count, chunk_texts = await asyncio.to_thread(
                manager._run_ingestion, dest
            )
            return {"filename": fname, "status": "ok", "chunks_count": chunks_count, "chunk_texts": chunk_texts}
        except Exception as e:
            return {"filename": fname, "status": "error", "message": str(e), "chunks_count": 0, "chunk_texts": []}

    if ingest_tasks:
        batch_results = await asyncio.gather(
            *[process_one(fname, path) for fname, path in ingest_tasks]
        )
        results.extend(batch_results)

    # Step 3: Rebuild indices ONCE
    try:
        await asyncio.gather(
            asyncio.to_thread(manager._rebuild_bm25),
            asyncio.to_thread(manager._rebuild_vector),
        )
    except Exception as e:
        logger.warning(f"Index rebuild after batch upload failed: {e}")

    # Step 4: Build graph from all new chunks
    all_chunks = []
    for r in results:
        if r.get("status") == "ok":
            all_chunks.extend(r.get("chunk_texts", []))
    if manager._graph_ready and all_chunks:
        try:
            await asyncio.to_thread(manager._build_graph, all_chunks)
        except Exception as e:
            logger.warning(f"Graph build after batch upload failed: {e}")

    # Step 5: Clean up temp files + remove chunk_texts from response
    for fname, path in ingest_tasks:
        try:
            if path.exists():
                path.unlink()
        except Exception:
            pass

    clean_results = [
        {k: v for k, v in r.items() if k != "chunk_texts"}
        for r in results
    ]

    total_chunks = sum(r.get("chunks_count", 0) for r in results)
    return ok({
        "total_files": len(files),
        "total_chunks": total_chunks,
        "results": clean_results,
    })


@app.delete("/api/sources/{name}")
async def delete_source(name: str):
    """Remove a source document from the system."""
    if name not in manager._ingested_files:
        fail(f"Source '{name}' not found", 404)

    manager._ingested_files.remove(name)

    # Clean up files
    raw_path = Path("data/raw") / name
    if raw_path.exists():
        raw_path.unlink()

    processed_path = Path("data/processed") / f"{Path(name).stem}.chunks.jsonl"
    if processed_path.exists():
        processed_path.unlink()

    txt_path = Path("data/processed") / f"{Path(name).stem}.txt"
    if txt_path.exists():
        txt_path.unlink()

    # Rebuild indices without the deleted file
    try:
        await asyncio.gather(
            asyncio.to_thread(manager._rebuild_bm25),
            asyncio.to_thread(manager._rebuild_vector),
        )
    except Exception as e:
        logger.warning(f"Index rebuild after deletion failed: {e}")

    return ok({"message": f"Source '{name}' deleted successfully"})


@app.get("/api/sources/{name}/content")
async def get_source_content(name: str):
    """Get the parsed text chunks for a specific source document."""
    jsonl_path = Path("data/processed") / f"{Path(name).stem}.chunks.jsonl"

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
async def serve_source_file(name: str):
    """Serve the raw source file (PDF, DOCX, etc.) for inline viewing."""
    raw_path = Path("data/raw") / name
    if not raw_path.exists():
        fail(f"File '{name}' not found", 404)

    # Map extensions to MIME types
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
        headers={"Content-Disposition": "inline"},  # Render in browser, not download
    )


# ====================================================================== #
#  CHAT                                                                    #
# ====================================================================== #

class ChatRequest(BaseModel):
    query: str


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Send a query to the Tri-Hybrid RAG engine.

    Returns the answer along with chain-of-thought showing which brains
    were selected and what each retrieved, plus an engine_used label.
    """
    query = request.query.strip()
    if not query:
        fail("Query cannot be empty")

    try:
        response = await manager.generate_answer(query)
    except Exception as e:
        logger.error(f"[chat] Failed: {str(e)}", extra={
            "endpoint": "POST /api/chat",
            "input_summary": query[:200],
            "error_type": type(e).__name__,
        })
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

    # Build chain-of-thought steps for frontend transparency
    chain_of_thought = []
    router = response.get("router_decision", {})

    chain_of_thought.append({
        "step": "Analyzing query",
        "detail": f"Understanding what you're asking about...",
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
            "detail": f"Searching through your documents...",
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
        sources.append({"type": "keyword", "preview": chunk[:150], "index": i})
    for i, triple in enumerate(graph_triples):
        sources.append({
            "type": "graph",
            "preview": f"{triple.get('source', '?')} → {triple.get('relation', '?')} → {triple.get('target', '?')}",
            "index": i,
        })
    for i, (chunk, score) in enumerate(vector_results):
        sources.append({"type": "semantic", "preview": chunk[:150], "score": score, "index": i})

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
async def get_history():
    """Get all past chat queries and answers."""
    return ok(chat_history)


@app.delete("/api/history/{entry_id}")
async def delete_history(entry_id: str):
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
async def get_graph_nodes():
    """Fetch all nodes from the Neo4j knowledge graph."""
    if not manager._graph_ready:
        return ok({"nodes": [], "message": "Knowledge graph not connected"})

    try:
        cypher = "MATCH (n) RETURN id(n) AS id, n.name AS name, labels(n) AS labels LIMIT 500"
        results = manager.neo4j.run_cypher(cypher)
        nodes = []
        for r in results:
            nodes.append({
                "id": str(r.get("id", "")),
                "name": r.get("name", "Unknown"),
                "group": r.get("labels", ["Entity"])[0] if r.get("labels") else "Entity",
            })
        return ok({"nodes": nodes, "total": len(nodes)})
    except Exception as e:
        logger.error(f"[graph/nodes] Failed: {e}")
        fail(f"Failed to fetch graph nodes: {str(e)}", 500)


@app.get("/api/graph/edges")
async def get_graph_edges():
    """Fetch all edges/relationships from the Neo4j knowledge graph."""
    if not manager._graph_ready:
        return ok({"edges": [], "message": "Knowledge graph not connected"})

    try:
        cypher = (
            "MATCH (a)-[r]->(b) "
            "RETURN id(a) AS source, id(b) AS target, type(r) AS relation, "
            "a.name AS source_name, b.name AS target_name "
            "LIMIT 1000"
        )
        results = manager.neo4j.run_cypher(cypher)
        edges = []
        for r in results:
            edges.append({
                "source": str(r.get("source", "")),
                "target": str(r.get("target", "")),
                "relation": r.get("relation", "RELATED_TO"),
                "source_name": r.get("source_name", ""),
                "target_name": r.get("target_name", ""),
            })
        return ok({"edges": edges, "total": len(edges)})
    except Exception as e:
        logger.error(f"[graph/edges] Failed: {e}")
        fail(f"Failed to fetch graph edges: {str(e)}", 500)


@app.get("/api/graph/node/{node_name}")
async def get_graph_node_detail(node_name: str):
    """Fetch a single node and its connections from Neo4j."""
    if not manager._graph_ready:
        fail("Knowledge graph not connected", 503)

    try:
        cypher = (
            "MATCH (n) WHERE toLower(n.name) = toLower($name) "
            "OPTIONAL MATCH (n)-[r]-(m) "
            "RETURN n.name AS name, labels(n) AS labels, "
            "collect(DISTINCT {relation: type(r), connected: m.name}) AS connections "
            "LIMIT 1"
        )
        results = manager.neo4j.run_cypher(cypher, {"name": node_name})
        if not results:
            fail(f"Node '{node_name}' not found", 404)

        node = results[0]
        return ok({
            "name": node.get("name", node_name),
            "labels": node.get("labels", []),
            "connections": node.get("connections", []),
        })
    except Exception as e:
        logger.error(f"[graph/node] Failed: {e}")
        fail(f"Failed to fetch node detail: {str(e)}", 500)


# ====================================================================== #
#  SEARCH                                                                  #
# ====================================================================== #

@app.get("/api/search")
async def search(
    q: str = Query(..., description="Search query"),
    engine: Optional[str] = Query(None, description="Engine: bm25, faiss, neo4j, or all"),
):
    """Run a targeted search across the tri-hybrid engines."""
    if not q.strip():
        fail("Query parameter 'q' is required")

    engine = (engine or "all").lower()
    results = {"query": q, "engine": engine, "hits": []}

    try:
        if engine in ("bm25", "all"):
            bm25_hits = manager._retrieve_bm25(q)
            for i, chunk in enumerate(bm25_hits):
                results["hits"].append({
                    "engine": "bm25",
                    "rank": i + 1,
                    "text": chunk[:300],
                    "score": None,
                })

        if engine in ("faiss", "all"):
            faiss_hits = manager._retrieve_vector(q)
            for i, (chunk, score) in enumerate(faiss_hits):
                results["hits"].append({
                    "engine": "faiss",
                    "rank": i + 1,
                    "text": chunk[:300],
                    "score": round(score, 4),
                })

        if engine in ("neo4j", "all"):
            graph_hits = manager._retrieve_graph(q)
            for i, triple in enumerate(graph_hits):
                results["hits"].append({
                    "engine": "neo4j",
                    "rank": i + 1,
                    "text": f"{triple.get('source', '?')} → {triple.get('relation', '?')} → {triple.get('target', '?')}",
                    "score": None,
                })

        results["total"] = len(results["hits"])
        return ok(results)

    except Exception as e:
        logger.error(f"[search] Failed: {e}")
        fail(f"Search failed: {str(e)}", 500)


# ====================================================================== #
#  SUGGESTIONS                                                             #
# ====================================================================== #

@app.get("/api/suggestions")
async def get_suggestions():
    """Generate 3 AI-suggested questions based on ingested documents."""
    global suggestions_cache, suggestions_source_hash

    # Use cached suggestions if sources haven't changed
    current_hash = ",".join(sorted(manager._ingested_files))
    if suggestions_cache and current_hash == suggestions_source_hash:
        return ok(suggestions_cache)

    if not manager._ingested_files:
        return ok([])

    # Gather a sample of chunks to generate questions from
    sample_chunks = []
    for fname in manager._ingested_files[:3]:  # Max 3 files
        jsonl_path = Path("data/processed") / f"{Path(fname).stem}.chunks.jsonl"
        if jsonl_path.exists():
            with open(jsonl_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                # Take first 2 chunks from each file
                for line in lines[:2]:
                    try:
                        chunk = json.loads(line.strip())
                        text = chunk.get("text", chunk.get("chunk", ""))[:300]
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

    # Fallback static suggestions
    fallback = [
        f"Summarize the key concepts in {manager._ingested_files[0]}",
        "What are the main topics covered in the uploaded documents?",
        "Explain the relationship between the key terms in my documents",
    ]
    return ok(fallback)


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
            except Exception:
                query = data

            if not query:
                continue

            await websocket.send_json({"type": "status", "message": "Analyzing query..."})

            response = await manager.generate_answer(query)

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
