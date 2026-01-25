import os
import logging
from typing import Any, Dict, List, Optional
from neo4j import GraphDatabase, Driver
from neo4j.exceptions import ServiceUnavailable
from dotenv import load_dotenv
load_dotenv() 
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("Neo4jConnector")

class Neo4jConnector:
    _instance = None
    _driver: Optional[Driver] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Neo4jConnector, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, '_initialized') and self._initialized:
            return
            
        self._uri = os.getenv("NEO4J_URI")
        self._username = os.getenv("NEO4J_USERNAME")
        self._password = os.getenv("NEO4J_PASSWORD")
        
        self.connect()
        self._initialized = True

    def connect(self):
        """Initializes the Neo4j driver."""
        try:
            if not all([self._uri, self._username, self._password]):
                logger.warning("Missing Neo4j environment variables (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD)")
                return

            self._driver = GraphDatabase.driver(
                self._uri, 
                auth=(self._username, self._password)
            )
            logger.info("Neo4j driver initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Neo4j driver: {e}")
            self._driver = None

    def verify_connectivity(self) -> bool:
        """Checks if the Neo4j database is reachable."""
        if not self._driver:
            logger.warning("Driver not initialized.")
            return False
            
        try:
            self._driver.verify_connectivity()
            logger.info("Neo4j connectivity verified.")
            return True
        except ServiceUnavailable as e:
            logger.error(f"Neo4j Service Unavailable: {e}")
            return False
        except Exception as e:
            logger.error(f"Connectivity check failed: {e}")
            return False

    def run_cypher(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Executes a Cypher query safely."""
        if not self._driver:
            logger.error("Driver not authorized or initialized.")
            return []

        if params is None:
            params = {}

        results = []
        try:
            with self._driver.session() as session:
                result = session.run(query, params)
                results = [record.data() for record in result]
            return results
        except ServiceUnavailable as e:
            logger.error(f"Service unavailable during query: {e}")
            raise
        except Exception as e:
            logger.error(f"Query execution error: {e}")
            raise

    def close(self):
        """Closes the driver connection."""
        if self._driver:
            self._driver.close()
            logger.info("Neo4j driver closed.")

if __name__ == "__main__":
    connector = Neo4jConnector()
    print("Verifying connection...")
    if connector.verify_connectivity():
        print("✅ Connection Success")
    else:
        print("❌ Connection Failed")
    connector.close()
