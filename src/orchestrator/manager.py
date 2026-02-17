import asyncio

class MockManager:
    """
    Mock Manager for Orchestrator to simulate Tri-Hybrid RAG responses.
    """
    
    async def get_tri_hybrid_response(self, query: str) -> dict:
        """
        Simulate processing a query and returning a response with graph, vector, and answer components.
        
        Args:
            query (str): The user's question.
            
        Returns:
            dict: A dictionary containing 'answer', 'graph_path', and 'vector_context'.
        """
        # Simulate processing delay
        await asyncio.sleep(2)
        
        return {
            "answer": "Based on the syllabus, the grading policy is weighted as follows: Assignments (40%), Midterm (30%), Final Exam (30%).",
            "graph_path": [
                "Course: CS101",
                "Topic: AI",
                "Professor: Dr. Smith"
            ],
            "vector_context": [
                "Syllabus.pdf (Page 2)",
                "Grading_Rubric.docx (Page 1)"
            ]
        }
