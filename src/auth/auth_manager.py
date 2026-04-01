"""
Auth Manager — Single-User Local Authentication
=================================================
Manages a single local user account with bcrypt password hashing
and file-based session tokens stored in ``data/auth/``.

Public API used by ``server.py``:
    - check_user_exists()   → bool
    - get_username()        → str | None
    - register(username, password) → session_token
    - login(username, password)    → session_token
    - logout(token)                → bool
    - validate_session(token)      → dict | None
    - delete_account()             → bool  (WIPES ALL DATA)
"""

from __future__ import annotations

import json
import logging
import secrets
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

import bcrypt

from config import (
    DATA_DIR, RAW_DIR, PROCESSED_DIR,
    QDRANT_DIR, BM25_DIR, GRAPHS_DIR,
)

logger = logging.getLogger("AuthManager")

# ── Auth file paths ───────────────────────────────────────────────────
AUTH_DIR = DATA_DIR / "auth"
USER_FILE = AUTH_DIR / "user.json"
SESSION_FILE = AUTH_DIR / "session.json"


class AuthManager:
    """Single-user local authentication manager."""

    SESSION_MAX_AGE = timedelta(hours=24)

    def __init__(self) -> None:
        AUTH_DIR.mkdir(parents=True, exist_ok=True)

    # ── Helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _read_json(path: Path) -> Optional[dict]:
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return None

    @staticmethod
    def _write_json(path: Path, data: dict) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    @staticmethod
    def _generate_token() -> str:
        return secrets.token_hex(32)

    # ── Public API ────────────────────────────────────────────────────

    def check_user_exists(self) -> bool:
        """Return True if a user account has been registered."""
        return USER_FILE.exists()

    def get_username(self) -> Optional[str]:
        """Return the registered username, or None."""
        data = self._read_json(USER_FILE)
        return data.get("username") if data else None

    def register(self, username: str, password: str) -> str:
        """
        Register a new single user. If one already exists, raises ValueError.
        Returns a session token.
        """
        if self.check_user_exists():
            raise ValueError("An account already exists on this machine.")

        username = username.strip()
        if not username or len(username) < 2:
            raise ValueError("Username must be at least 2 characters.")
        if not password or len(password) < 4:
            raise ValueError("Password must be at least 4 characters.")

        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))

        self._write_json(USER_FILE, {
            "username": username,
            "password_hash": hashed.decode("utf-8"),
        })

        token = self._generate_token()
        self._write_json(SESSION_FILE, {
            "token": token,
            "username": username,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        logger.info(f"User '{username}' registered successfully.")
        return token

    def login(self, username: str, password: str) -> str:
        """
        Validate credentials and return a new session token.
        Raises ValueError on bad credentials.
        """
        user_data = self._read_json(USER_FILE)
        if not user_data:
            raise ValueError("No account exists. Please sign up first.")

        stored_username = user_data.get("username", "")
        stored_hash = user_data.get("password_hash", "")

        if username.strip().lower() != stored_username.lower():
            raise ValueError("Invalid username or password.")

        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            raise ValueError("Invalid username or password.")

        token = self._generate_token()
        self._write_json(SESSION_FILE, {
            "token": token,
            "username": stored_username,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        logger.info(f"User '{stored_username}' logged in.")
        return token

    def logout(self, token: str) -> bool:
        """Invalidate the current session."""
        session = self._read_json(SESSION_FILE)
        if session and session.get("token") == token:
            SESSION_FILE.unlink(missing_ok=True)
            logger.info("Session invalidated.")
            return True
        return False

    def validate_session(self, token: str) -> Optional[dict]:
        """
        Validate a session token.
        Returns {"username": str} if valid, None otherwise.
        Sessions older than SESSION_MAX_AGE are auto-expired.
        """
        if not token:
            return None
        session = self._read_json(SESSION_FILE)
        if not session or session.get("token") != token:
            return None

        # Check session age — expire after 24 hours
        created_str = session.get("created_at")
        if created_str:
            try:
                created = datetime.fromisoformat(created_str)
                if datetime.now(timezone.utc) - created > self.SESSION_MAX_AGE:
                    logger.info("Session expired (>24h), invalidating.")
                    SESSION_FILE.unlink(missing_ok=True)
                    return None
            except (ValueError, TypeError):
                # Malformed timestamp — treat as expired
                SESSION_FILE.unlink(missing_ok=True)
                return None
        else:
            # Legacy session without timestamp — force re-login
            SESSION_FILE.unlink(missing_ok=True)
            return None

        return {"username": session.get("username", "")}

    def delete_account(self) -> bool:
        """
        DELETE EVERYTHING — wipes the user account and all data directories.
        This is the nuclear option for single-user cleanup.
        """
        dirs_to_wipe = [
            AUTH_DIR,
            RAW_DIR,
            PROCESSED_DIR,
            QDRANT_DIR,
            BM25_DIR,
            GRAPHS_DIR,
        ]

        for d in dirs_to_wipe:
            if d.exists():
                shutil.rmtree(d, ignore_errors=True)
                d.mkdir(parents=True, exist_ok=True)
                logger.info(f"Wiped: {d}")

        logger.warning("Account deleted and all data wiped.")
        return True

    def get_status(self) -> dict:
        """
        Return the current auth status (for the frontend to decide flow).
        """
        user_exists = self.check_user_exists()
        session = self._read_json(SESSION_FILE)
        token_valid = session is not None and "token" in session

        return {
            "registered": user_exists,
            "username": self.get_username() if user_exists else None,
            "logged_in": token_valid,
        }
