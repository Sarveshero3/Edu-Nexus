import chainlit as cl
from src.orchestrator.manager import MockManager

@cl.on_chat_start
async def on_chat_start():
    # Instantiate the MockManager and store it in the user session
    manager = MockManager()
    cl.user_session.set("manager", manager)
    
@cl.on_message
async def on_message(message: cl.Message):
    # Retrieve the manager from the session
    manager = cl.user_session.get("manager")
    
    # Create the Orchestrator step
    async with cl.Step(name="Orchestrator") as step:
        step.input = message.content
        
        # Call the simulates tri-hybrid response
        response = await manager.get_tri_hybrid_response(message.content)
        
        # Format the output for the "Glass Box" reasoning
        step.output = (
            f"**Graph Path:**\n{response['graph_path']}\n\n"
            f"**Vector Context:**\n{response['vector_context']}"
        )
        
    # Send the final answer
    await cl.Message(content=response["answer"]).send()
