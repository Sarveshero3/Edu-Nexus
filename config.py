import os
from pathlib import Path

# Base Directory
BASE_DIR = Path(__file__).parent

# Data Paths
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
VECTOR_DB_DIR = DATA_DIR / "artifacts"

# Model Configs
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"