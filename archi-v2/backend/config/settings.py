"""Single source of environment configuration for the backend."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import List, Tuple

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = BACKEND_ROOT / "data"

# Extensions accepted for document uploads. A PDF-extraction adapter can be
# added later without callers changing.
DEFAULT_UPLOAD_EXTENSIONS: Tuple[str, ...] = (".md", ".txt")


def _split_csv(raw: str) -> List[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    """Resolved configuration. Build via ``get_settings()``."""

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: float = 20.0
    llm_provider_chain: List[str] = field(default_factory=lambda: ["gemini", "offline"])
    data_dir: Path = DEFAULT_DATA_DIR
    cors_origins: List[str] = field(default_factory=lambda: ["http://localhost:5173"])
    max_upload_bytes: int = 512 * 1024
    allowed_upload_extensions: Tuple[str, ...] = DEFAULT_UPLOAD_EXTENSIONS

    @property
    def has_gemini_key(self) -> bool:
        placeholder = {"", "MY_GEMINI_API_KEY", "dummy", "changeme"}
        return self.gemini_api_key not in placeholder

    @property
    def projects_file(self) -> Path:
        return self.data_dir / "projects.json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Reads configuration from the environment exactly once per process."""
    data_dir = os.environ.get("ARCHI_DATA_DIR", "").strip()
    origins = os.environ.get("ARCHI_CORS_ORIGINS", "").strip()
    chain = os.environ.get("ARCHI_LLM_PROVIDERS", "").strip()
    return Settings(
        gemini_api_key=os.environ.get("GEMINI_API_KEY", "").strip(),
        gemini_model=os.environ.get("ARCHI_GEMINI_MODEL", "gemini-2.5-flash").strip(),
        gemini_timeout_seconds=float(os.environ.get("ARCHI_GEMINI_TIMEOUT", "20")),
        llm_provider_chain=_split_csv(chain) or ["gemini", "offline"],
        data_dir=Path(data_dir) if data_dir else DEFAULT_DATA_DIR,
        cors_origins=_split_csv(origins) or ["http://localhost:5173", "http://127.0.0.1:5173"],
        max_upload_bytes=int(os.environ.get("ARCHI_MAX_UPLOAD_BYTES", str(512 * 1024))),
    )
