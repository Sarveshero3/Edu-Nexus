import os
import json
import re
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

class GraphExtractor:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable not set.")
        self.client = Groq(api_key=self.api_key)
        self.model = "openai/gpt-oss-120b"

    def extract(self, text_chunk: str) -> dict:
        """
        Extracts entities and relationships from the given text chunk using Llama-3.
        Returns a Python dictionary with 'nodes' and 'relationships'.
        """
        system_prompt = (
            "You are a precise Knowledge Graph Entity Extractor. "
            "Your task is to analyze the input text and extract entities (nodes) and "
            "relationships specific to the domain of the text.\n\n"
            "Output MUST be strict JSON only. No conversational text, no markdown code blocks.\n"
            "The JSON structure must be exactly:\n"
            "{\n"
            '  "nodes": [{"id": "Name", "label": "Type", "properties": {}}],\n'
            '  "relationships": [{"source": "Name", "target": "Name", "type": "RELATION_TYPE", "properties": {}}]\n'
            "}\n\n"
            "Rules:\n"
            "1. Nodes: 'id' should be the entity name. 'label' is the entity type (e.g., Person, Course, University).\n"
            "2. Relationships: 'type' defines the link (e.g., TEACHES, LOCATED_AT).\n"
            "3. Do not include duplicate nodes or relationships.\n"
            "4. If no entities are found, return empty lists for nodes and relationships.\n"
            "5. Ensure the JSON is valid."
        )

        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text_chunk}
                ],
                temperature=0,  # Low temperature for deterministic output
                stream=False,
                response_format={"type": "json_object"} # Enforce JSON mode if supported, but prompt handles it too.
            )
            
            response_content = completion.choices[0].message.content.strip()
            
            # Helper to parse JSON even if there's minor noise (though system prompt forbids it)
            # Llama-3 usually respects the system prompt well.
            try:
                data = json.loads(response_content)
                return data
            except json.JSONDecodeError:
                # Fallback: try to find the JSON block if wrapped in markdown
                match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
                else:
                    print(f"Error parsing JSON. Raw output: {response_content}")
                    return {"nodes": [], "relationships": []}

        except Exception as e:
            print(f"Error during extraction: {e}")
            return {"nodes": [], "relationships": []}

if __name__ == "__main__":
    extractor = GraphExtractor()
    test_text = "Professor Sarvesh teaches Advanced Python at Edu Nexus University."
    print(f"Input: {test_text}\n")
    result = extractor.extract(test_text)
    print("Extracted Graph Data:")
    print(json.dumps(result, indent=2))
