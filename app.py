import chainlit as cl
from src.orchestrator.manager import OrchestratorManager

SUPPORTED_EXTENSIONS = {"pdf", "docx", "txt", "md"}


@cl.on_chat_start
async def on_chat_start():
    manager = OrchestratorManager()
    cl.user_session.set("manager", manager)

    await cl.Message(
        content=(
            "# Welcome to Edu Nexus\n\n"
            "Ask me any question about your course material, "
            "or **upload a file** (PDF, DOCX, TXT) to add it to the knowledge base."
        )
    ).send()


@cl.on_message
async def on_message(message: cl.Message):
    manager: OrchestratorManager = cl.user_session.get("manager")

    # ── Handle file uploads ───────────────────────────────────
    if message.elements:
        for element in message.elements:
            if hasattr(element, "path") and element.path:
                file_name = element.name
                file_path = element.path

                processing_msg = cl.Message(
                    content=f"Processing **{file_name}**..."
                )
                await processing_msg.send()

                result = await manager.ingest_file(file_name, file_path)

                await processing_msg.remove()

                if result["status"] == "ok":
                    await cl.Message(
                        content=(
                            f"**{file_name}** ingested successfully!\n\n"
                            f"- Chunks created: **{result['chunks_count']}**\n"
                            f"- BM25 index rebuilt\n\n"
                            f"You can now ask questions about this document."
                        )
                    ).send()
                else:
                    await cl.Message(
                        content=f"Failed to process **{file_name}**: {result['message']}"
                    ).send()

        # If the message was only a file upload with no text, stop here
        if not message.content.strip():
            return

    # ── Question answering flow ───────────────────────────────
    async with cl.Step(name="Orchestrator") as step:
        step.input = message.content

        response = await manager.get_response(message.content)

        # Format the Glass Box reasoning output
        strategy = response["strategy"]
        bm25_chunks = response["bm25_chunks"]
        graph_triples = response["graph_triples"]

        reasoning_parts = [f"**Strategy:** `{strategy}`\n"]

        if bm25_chunks:
            reasoning_parts.append(
                f"**BM25 Chunks ({len(bm25_chunks)}):**\n"
                + "\n".join(
                    f"- Chunk {i}: {c[:120]}..." if len(c) > 120 else f"- Chunk {i}: {c}"
                    for i, c in enumerate(bm25_chunks, 1)
                )
            )
        else:
            reasoning_parts.append("**BM25 Chunks:** _None retrieved_")

        if graph_triples:
            reasoning_parts.append(
                f"**Graph Triples ({len(graph_triples)}):**\n"
                + "\n".join(
                    f"- {t['source']} -> {t['relation']} -> {t['target']}"
                    for t in graph_triples
                )
            )
        else:
            reasoning_parts.append("**Graph Triples:** _None retrieved_")

        step.output = "\n\n".join(reasoning_parts)

    # Send the final answer
    await cl.Message(content=response["answer"]).send()
