"""
Edu Nexus — Chainlit UI  (Phase 4: LLM-Routed Tri-Hybrid)
===========================================================
Branded chat interface with Visual Chain-of-Thought.

The LLM Router (openai/gpt-oss-120b) analyzes each query and decides
which retrieval brain(s) to invoke.  Users see the full reasoning:
  - Which brains are available
  - Which brains the Router CHOSE and WHY
  - Results from each chosen brain
  - Final LLM synthesis

On startup the UI declares the health of every retrieval engine.
"""

import chainlit as cl
from src.orchestrator.manager import OrchestratorManager
from src.ingest.extractor import SUPPORTED_EXTENSIONS as _EXT_SET

# Chainlit uses extensions without the leading dot
SUPPORTED_EXTENSIONS = {ext.lstrip(".") for ext in _EXT_SET}
BOT_AUTHOR = "Edu Nexus"


# ====================================================================== #
#  CHAT START — Health checks + welcome                                   #
# ====================================================================== #

@cl.on_chat_start
async def on_chat_start():
    # ── Initialise the orchestrator ──────────────────────────────────
    manager = OrchestratorManager()
    cl.user_session.set("manager", manager)

    # ── Service health-check panel ───────────────────────────────────
    def _icon(ready: bool) -> str:
        return "✅" if ready else "❌"

    bm25_ok   = manager._bm25_ready
    graph_ok  = manager._graph_ready
    vector_ok = manager._vector_ready
    all_ok    = bm25_ok and graph_ok and vector_ok

    health_table = (
        "| Brain | Engine | Status |\n"
        "|-------|--------|--------|\n"
        f"| **Fast Brain** | BM25 Keyword Index | {_icon(bm25_ok)} {'Ready' if bm25_ok else 'Index not built — upload a file first'} |\n"
        f"| **Deep Brain** | Neo4j Knowledge Graph | {_icon(graph_ok)} {'Connected & cleaned' if graph_ok else 'Not reachable — check Neo4j'} |\n"
        f"| **Semantic Brain** | FAISS Vector Store | {_icon(vector_ok)} {'Ready' if vector_ok else 'Index not built — upload a file first'} |\n"
    )

    if all_ok:
        banner = "🟢 **All systems operational** — ready to answer questions!"
    elif bm25_ok or vector_ok or graph_ok:
        banner = "🟡 **Partial availability** — some engines need setup (see table below)."
    else:
        banner = "🔴 **No engines ready** — upload a file to build the keyword & vector indices, and ensure Neo4j is running."

    await cl.Message(
        author=BOT_AUTHOR,
        content=(
            "# 🎓 Welcome to Edu Nexus\n\n"
            f"{banner}\n\n"
            "### 🔍 Service Health Check\n\n"
            f"{health_table}\n"
            "---\n\n"
            "I'm your **LLM-Routed Tri-Hybrid Academic Assistant**.\n\n"
            "An AI Router (`openai/gpt-oss-120b`) analyzes each of your questions "
            "and **intelligently decides** which retrieval brain(s) to invoke:\n\n"
            "- **Fast Brain (BM25)** — Keyword matching across your documents\n"
            "- **Deep Brain (Neo4j)** — Traverses a knowledge graph of entities & relationships\n"
            "- **Semantic Brain (FAISS)** — Dense vector similarity search\n\n"
            "**Upload a file** (PDF, DOCX, PPTX, XLSX, CSV, TXT, MD) to build the knowledge base, "
            "then ask me anything about it.\n\n"
            "---\n"
            "*Tip: Watch the reasoning steps below each answer to see "
            "the Router's decision and which brains contributed.*"
        ),
    ).send()


# ====================================================================== #
#  MESSAGE HANDLER                                                        #
# ====================================================================== #

@cl.on_message
async def on_message(message: cl.Message):
    manager: OrchestratorManager = cl.user_session.get("manager")

    if manager is None:
        await cl.Message(
            author=BOT_AUTHOR,
            content=(
                "⚠️ **Session not initialised.** Please reload the page to start fresh."
            ),
        ).send()
        return

    # ── Handle file uploads ───────────────────────────────────────────
    if message.elements:
        for element in message.elements:
            if hasattr(element, "path") and element.path:
                file_name = element.name
                file_path = element.path

                # ── Master step: File Processing Pipeline ────────────
                async with cl.Step(name="📄 File Processing Pipeline") as pipeline_step:
                    pipeline_step.input = f"Processing **{file_name}**"

                    # Step 1: File validation
                    async with cl.Step(name="🔍 Step 1 — Validating File") as step_validate:
                        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
                        if ext in SUPPORTED_EXTENSIONS:
                            step_validate.output = (
                                f"✅ **{file_name}** — File type `.{ext}` is supported.\n"
                                f"- File path: `{file_path}`"
                            )
                        else:
                            step_validate.output = (
                                f"❌ **{file_name}** — Unsupported file type `.{ext}`.\n"
                                f"Supported: {', '.join(SUPPORTED_EXTENSIONS)}"
                            )
                            pipeline_step.output = f"❌ Aborted — unsupported file type `.{ext}`"
                            await cl.Message(
                                author=BOT_AUTHOR,
                                content=f"❌ Cannot process **{file_name}** — unsupported file type `.{ext}`.",
                            ).send()
                            continue

                    # Step 2: Copy to raw storage
                    async with cl.Step(name="📁 Step 2 — Saving to Raw Storage") as step_save:
                        step_save.output = (
                            f"Copying **{file_name}** to `data/raw/` for permanent storage..."
                        )

                    # Step 3: Cleaning & text extraction
                    async with cl.Step(name="🧹 Step 3 — Cleaning & Text Extraction") as step_clean:
                        step_clean.output = (
                            "Extracting raw text from the document...\n"
                            "- Removing headers, footers, page numbers\n"
                            "- Fixing hyphenation & broken lines\n"
                            "- Normalising whitespace"
                        )

                    # Step 4: Chunking
                    async with cl.Step(name="✂️ Step 4 — Chunking") as step_chunk:
                        step_chunk.output = (
                            "Splitting cleaned text into overlapping sentence-based chunks:\n"
                            "- Max tokens per chunk: **500**\n"
                            "- Overlap: **100 tokens**\n"
                            "- Writing chunks to `data/processed/*.chunks.jsonl`"
                        )

                    # Step 5: Actual ingestion (this does the real work)
                    result = await manager.ingest_file(file_name, file_path)

                    # Step 6: Building BM25 index
                    async with cl.Step(name="🔑 Step 5 — Rebuilding BM25 Index") as step_bm25:
                        if result["status"] == "ok":
                            step_bm25.output = (
                                f"✅ BM25 keyword index rebuilt with all processed chunks.\n"
                                f"- Tokenised corpus loaded\n"
                                f"- BM25Okapi index saved to `data/artifacts/bm25.pkl`"
                            )
                        else:
                            step_bm25.output = "❌ BM25 rebuild skipped due to processing error."

                    # Step 7: Building FAISS vector index
                    async with cl.Step(name="🧠 Step 6 — Rebuilding FAISS Vector Index") as step_faiss:
                        if result["status"] == "ok":
                            step_faiss.output = (
                                f"✅ FAISS vector index rebuilt.\n"
                                f"- Embedding model: `all-MiniLM-L6-v2` (384 dimensions)\n"
                                f"- L2-normalised embeddings computed\n"
                                f"- IndexFlatIP (cosine similarity) index saved to `data/artifacts/faiss.index`"
                            )
                        else:
                            step_faiss.output = "❌ FAISS rebuild skipped due to processing error."

                    # Step 8: Building Neo4j graph
                    async with cl.Step(name="🕸️ Step 7 — Building Knowledge Graph (Neo4j)") as step_graph:
                        if result["status"] == "ok":
                            graph_nodes = result.get("graph_nodes", 0)
                            graph_rels = result.get("graph_rels", 0)
                            if graph_nodes > 0 or manager._graph_ready:
                                step_graph.output = (
                                    f"✅ Knowledge graph built from document chunks.\n"
                                    f"- Entity extraction via LLM (`openai/gpt-oss-120b`)\n"
                                    f"- Entities & relationships pushed to Neo4j\n"
                                    f"- Batches processed: **{graph_nodes}**"
                                )
                            else:
                                step_graph.output = (
                                    "⚠️ Neo4j is not connected — graph building skipped.\n"
                                    "The Knowledge Graph brain will be unavailable for queries."
                                )
                        else:
                            step_graph.output = "❌ Graph building skipped due to processing error."

                    # Final pipeline summary
                    if result["status"] == "ok":
                        pipeline_step.output = (
                            f"✅ **{file_name}** processed successfully!\n\n"
                            f"| Metric | Value |\n"
                            f"|--------|-------|\n"
                            f"| Chunks created | **{result['chunks_count']}** |\n"
                            f"| BM25 index | Rebuilt ✅ |\n"
                            f"| FAISS index | Rebuilt ✅ |\n"
                            f"| Neo4j graph | {'Built ✅' if result.get('graph_nodes', 0) > 0 else 'Skipped ⚠️'} |\n"
                        )

                        # Post-ingestion health re-check
                        bm25_now   = manager._bm25_ready
                        vector_now = manager._vector_ready
                        graph_now  = manager._graph_ready

                        def _icon(ready: bool) -> str:
                            return "✅" if ready else "❌"

                        await cl.Message(
                            author=BOT_AUTHOR,
                            content=(
                                f"### ✅ {file_name} — Ingestion Complete\n\n"
                                f"- **Chunks created:** {result['chunks_count']}\n"
                                f"- **BM25 + FAISS indices rebuilt**\n"
                                f"- **Neo4j knowledge graph:** {'Built' if result.get('graph_nodes', 0) > 0 else 'Skipped (Neo4j offline)'}\n\n"
                                "### Updated Service Status\n\n"
                                "| Brain | Status |\n"
                                "|-------|--------|\n"
                                f"| Fast Brain (BM25) | {_icon(bm25_now)} |\n"
                                f"| Deep Brain (Neo4j) | {_icon(graph_now)} |\n"
                                f"| Semantic Brain (FAISS) | {_icon(vector_now)} |\n\n"
                                "You can now ask questions about this document."
                            ),
                        ).send()
                    else:
                        pipeline_step.output = (
                            f"❌ Failed to process **{file_name}**: {result['message']}"
                        )
                        await cl.Message(
                            author=BOT_AUTHOR,
                            content=(
                                f"❌ Failed to process **{file_name}**: "
                                f"{result['message']}"
                            ),
                        ).send()

        # If the message was only a file upload with no text, stop here
        if not message.content.strip():
            return

    # ── Visual Chain-of-Thought: Router + brain steps ─────────────────
    query = message.content

    # Call the orchestrator (Router LLM decides, then chosen brains execute)
    response = await manager.generate_answer(query)

    bm25_chunks = response["bm25_chunks"]
    graph_triples = response["graph_triples"]
    vector_results = response.get("vector_results", [])
    router_decision = response.get("router_decision", {})
    chosen_brains = response.get("chosen_brains", [])

    # ── Step 0: LLM Router Decision ───────────────────────────────────
    async with cl.Step(name="🧭 LLM Router — Analyzing Query") as step_router:
        step_router.input = query

        reasoning = router_decision.get("reasoning", "N/A")
        brain_labels = {
            "keyword": "⚡ Fast Brain (BM25)",
            "graph": "🕸️ Deep Brain (Neo4j)",
            "semantic": "🔗 Semantic Brain (FAISS)",
        }

        router_lines = [
            "**Router LLM** (`openai/gpt-oss-120b`) analyzed the query and decided:\n",
        ]

        # Show what was chosen vs skipped
        all_brains = ["keyword", "graph", "semantic"]
        for brain in all_brains:
            label = brain_labels[brain]
            if brain in chosen_brains:
                router_lines.append(f"- ✅ **{label}** — **SELECTED**")
            else:
                # Check if it was available but not chosen, or unavailable
                is_available = (
                    (brain == "keyword" and manager._bm25_ready) or
                    (brain == "graph" and manager._graph_ready) or
                    (brain == "semantic" and manager._vector_ready)
                )
                if is_available:
                    router_lines.append(f"- ⏭️ {label} — Available but not needed")
                else:
                    router_lines.append(f"- ❌ {label} — Offline")

        router_lines.append(f"\n**Router's reasoning:** _{reasoning}_")
        router_lines.append(
            f"\n🚀 **{len(chosen_brains)} brain(s) will execute** for this query."
        )

        step_router.output = "\n".join(router_lines)

    # ── Show results from CHOSEN brains only ──────────────────────────

    if "keyword" in chosen_brains:
        async with cl.Step(name="⚡ Fast Brain — Scanning Keywords (BM25)") as step1:
            step1.input = query
            if bm25_chunks:
                step1.output = (
                    f"**Fast Brain** found **{len(bm25_chunks)}** keyword-matched chunks:\n\n"
                    + "\n".join(
                        f"- **Chunk {i}:** {c[:150]}{'...' if len(c) > 150 else ''}"
                        for i, c in enumerate(bm25_chunks, 1)
                    )
                )
            else:
                step1.output = (
                    "**Fast Brain** — _No keyword chunks retrieved._ "
                    "(Index may not be built yet.)"
                )

    if "graph" in chosen_brains:
        async with cl.Step(name="🕸️ Deep Brain — Traversing Knowledge Graph (Neo4j)") as step2:
            step2.input = query
            if graph_triples:
                step2.output = (
                    f"**Deep Brain** found **{len(graph_triples)}** graph triples:\n\n"
                    + "\n".join(
                        f"- **{t['source']}** -> _{t['relation']}_ -> **{t['target']}**"
                        for t in graph_triples
                    )
                )
            else:
                step2.output = (
                    "**Deep Brain** — _No graph triples retrieved._ "
                    "(No matching entities found in the knowledge graph.)"
                )

    if "semantic" in chosen_brains:
        async with cl.Step(name="🔗 Semantic Brain — Searching Vectors (FAISS)") as step3:
            step3.input = query
            if vector_results:
                step3.output = (
                    f"**Semantic Brain** found **{len(vector_results)}** similar passages:\n\n"
                    + "\n".join(
                        f"- **Chunk {i}** (similarity: {score:.4f}): "
                        f"{txt[:150]}{'...' if len(txt) > 150 else ''}"
                        for i, (txt, score) in enumerate(vector_results, 1)
                    )
                )
            else:
                step3.output = (
                    "**Semantic Brain** — _No vector results retrieved._ "
                    "(FAISS index may not be built yet.)"
                )

    # ── Step: LLM Synthesis ───────────────────────────────────────────
    async with cl.Step(name="🤖 Answer LLM — Generating Response") as step_llm:
        step_llm.input = (
            f"Fusing context from chosen brains: **{', '.join(chosen_brains)}**\n"
            f"- Keyword chunks: {len(bm25_chunks)}\n"
            f"- Graph triples: {len(graph_triples)}\n"
            f"- Semantic chunks: {len(vector_results)}"
        )
        step_llm.output = (
            f"**Router chose:** `{', '.join(chosen_brains)}`\n"
            f"**Answer model:** `moonshotai/kimi-k2-instruct-0905`\n\n"
            f"Sent unified context block to Answer LLM with strict academic prompt.\n"
            f"Rules enforced: no hallucination, cross-reference sources, cite evidence."
        )

    # ── Send the final synthesised answer ─────────────────────────────
    await cl.Message(
        author=BOT_AUTHOR,
        content=response["answer"],
    ).send()
