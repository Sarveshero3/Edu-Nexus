import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import asyncio

from src.orchestrator.manager import OrchestratorManager

app = FastAPI(title="Edu Nexus API")

# Setup CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global orchestrator manager
manager = OrchestratorManager()

class QueryRequest(BaseModel):
    query: str

@app.get("/api/status")
async def get_status():
    return {
        "fast_ready": manager._bm25_ready,
        "deep_ready": manager._graph_ready,
        "semantic_ready": manager._vector_ready,
    }

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # Save the file temporarily
    file_path = f"data/raw/{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Run the ingestion pipeline
    result = await manager.ingest_file(file.filename, file_path)
    if result["status"] == "ok":
        return {"message": "File processed successfully", "result": result}
    else:
        raise HTTPException(status_code=500, detail=result["message"])

import json
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Expecting a JSON with the query
            try:
                msg = json.loads(data)
                query = msg.get("query")
            except:
                query = data

            if not query:
                continue
            
            # Send an acknowledgement
            await websocket.send_json({"type": "status", "message": "Analyzing query..."})

            response = await manager.generate_answer(query)
            
            # Send back the full structured response
            await websocket.send_json({
                "type": "result",
                "router_decision": response.get("router_decision", {}),
                "chosen_brains": response.get("chosen_brains", []),
                "bm25_chunks": response.get("bm25_chunks", []),
                "graph_triples": response.get("graph_triples", []),
                "vector_results": response.get("vector_results", []),
                "answer": response.get("answer", "")
            })
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
