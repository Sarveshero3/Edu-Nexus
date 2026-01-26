import json
import logging
from typing import Dict, Any

# Import local modules
# Assuming running from root as python src/graph_engine/builder.py
# Adjust imports if necessary based on execution context
try:
    from src.graph_engine.extractor import GraphExtractor
    from src.graph_engine.neo4j_ops import Neo4jConnector
except ImportError:
    # Fallback for running script directly from subfolder
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
    from src.graph_engine.extractor import GraphExtractor
    from src.graph_engine.neo4j_ops import Neo4jConnector

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("GraphBuilder")

class GraphBuilder:
    def __init__(self):
        self.extractor = GraphExtractor()
        self.connector = Neo4jConnector()
        
    def process_text(self, text: str):
        """
        Extracts entities from text and pushes them to Neo4j.
        """
        if not text or not text.strip():
            logger.warning("Empty text provided.")
            return

        logger.info(f"Processing text: {text}")
        
        # 1. Extract
        try:
            data = self.extractor.extract(text)
            if not data:
                logger.warning("No data returned by extractor.")
                return
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            return

        nodes = data.get("nodes", [])
        relationships = data.get("relationships", [])
        
        if not nodes and not relationships:
            logger.info("No entities or relationships found in text.")
            return

        logger.info(f"Extracted {len(nodes)} nodes and {len(relationships)} relationships.")
        
        # 2. Node Creation
        nodes_created = 0
        for node in nodes:
            try:
                # Construct MERGE query for Node
                # MERGE (n:Label {name: 'ID'})
                node_id = node.get("id")
                label = node.get("label", "Entity")
                properties = node.get("properties", {})
                
                # Sanitize label (basic)
                label = "".join(c for c in label if c.isalnum() or c == "_")
                
                if not node_id:
                    continue

                # Prepare properties
                # We use name as primary key as requested
                query_props = {"name": node_id}
                query_props.update(properties)
                
                # We construct the MERGE query dynamically. 
                # Note: Passing parameters is safer.
                query = f"MERGE (n:{label} {{name: $name}}) SET n += $props"
                
                # Separate name from other props for SET if needed, but SET n += $props works well to add others
                # Actually, $props should contain everything we want to set.
                
                self.connector.run_cypher(query, {"name": node_id, "props": query_props})
                nodes_created += 1
            except Exception as e:
                logger.error(f"Failed to create node {node}: {e}")

        # 3. Relationship Creation
        rels_created = 0
        for rel in relationships:
            try:
                # MATCH (a {name: 'Source'}), (b {name: 'Target'}) MERGE (a)-[:TYPE]->(b)
                source = rel.get("source")
                target = rel.get("target")
                rel_type = rel.get("type", "RELATED_TO")
                properties = rel.get("properties", {})
                
                if not source or not target:
                    continue
                
                # Sanitize rel_type
                rel_type = "".join(c for c in rel_type if c.isalnum() or c == "_").upper()
                
                query = (
                    f"MATCH (a {{name: $source}}), (b {{name: $target}}) "
                    f"MERGE (a)-[r:{rel_type}]->(b) "
                    f"SET r += $props"
                )
                
                self.connector.run_cypher(query, {"source": source, "target": target, "props": properties})
                rels_created += 1
            except Exception as e:
                logger.error(f"Failed to create relationship {rel}: {e}")

        summary = f"Created {nodes_created} Nodes, {rels_created} Edges"
        logger.info(summary)
        print(summary)


if __name__ == "__main__":
    builder = GraphBuilder()
    
    # Check if Neo4j is connected
    if not builder.connector.verify_connectivity():
        print("❌ Neoj4 not connected. Please check env vars.")
    else:
        test_text = "Professor Sarvesh teaches Advanced Python at Edu Nexus University."
        print(f"\n--- Testing GraphBuilder with: '{test_text}' ---")
        builder.process_text(test_text)
