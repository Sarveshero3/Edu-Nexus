import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

# Mock dependencies that might be missing
sys.modules["bcrypt"] = MagicMock()
sys.modules["config"] = MagicMock()
# Mock the config directory variables
mock_config = sys.modules["config"]
mock_config.DATA_DIR = Path("data")
mock_config.RAW_DIR = Path("data/raw")
mock_config.PROCESSED_DIR = Path("data/processed")
mock_config.QDRANT_DIR = Path("data/artifacts/qdrant")
mock_config.BM25_DIR = Path("data/artifacts/bm25")
mock_config.GRAPHS_DIR = Path("data/artifacts/graphs")

from src.auth.auth_manager import AuthManager

def test_read_json_not_exists(tmp_path):
    path = tmp_path / "nonexistent.json"
    assert AuthManager._read_json(path) is None

def test_read_json_valid(tmp_path):
    path = tmp_path / "valid.json"
    data = {"username": "testuser", "password_hash": "hash"}
    path.write_text(json.dumps(data), encoding="utf-8")
    assert AuthManager._read_json(path) == data

def test_read_json_invalid(tmp_path):
    path = tmp_path / "invalid.json"
    path.write_text("not a json", encoding="utf-8")
    assert AuthManager._read_json(path) is None

def test_read_json_os_error(tmp_path):
    path = tmp_path / "error.json"
    path.write_text("{}", encoding="utf-8")
    with patch.object(Path, "read_text", side_effect=OSError("Disk error")):
        assert AuthManager._read_json(path) is None
