"""Single source of environment configuration for the backend."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import List, Tuple

BACKEND_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_ROOT.parent
DEFAULT_DATA_DIR = BACKEND_ROOT / "data"
ENV_FILE = PROJECT_ROOT / ".env"

# Extensions accepted for document uploads. A PDF-extraction adapter can be
# added later without callers changing.
DEFAULT_UPLOAD_EXTENSIONS: Tuple[str, ...] = (".md", ".txt")

# Gemini models tried in order: best free-tier model first, then progressively
# cheaper/faster ones that are still on the free tier, so a slow or unavailable
# model degrades to a lighter one instead of dropping straight to offline.
# ``gemini-2.5-flash`` is deliberately absent: it is retired for new API keys.
DEFAULT_GEMINI_MODELS: Tuple[str, ...] = (
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
)
 
# Gemini 3 thinks before answering, which is what made 20s timeouts look like
# an outage. 'low' keeps blueprints coherent without the long reasoning pause.
DEFAULT_THINKING_LEVEL = "low"
 
 
def _split_csv(raw: str) -> List[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


def load_env_file(path: Path = ENV_FILE) -> None:
    """Loads ``archi-v2/.env`` into the process environment, if present.

    Real environment variables always win, so an exported key overrides the
    file. Only ``KEY=value`` lines are read; anything else is ignored.
    """
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


@dataclass(frozen=True)
class Settings:
    """Resolved configuration. Build via ``get_settings()``."""

    gemini_api_key: str = ""
    gemini_models: List[str] = field(default_factory=lambda: list(DEFAULT_GEMINI_MODELS))
    gemini_timeout_seconds: float = 90.0
    gemini_thinking_level: str = DEFAULT_THINKING_LEVEL
    gemini_discover_models: bool = True
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
    def gemini_model(self) -> str:
        """The model tried first."""
        return self.gemini_models[0] if self.gemini_models else DEFAULT_GEMINI_MODELS[0]

    @property
    def projects_file(self) -> Path:
        return self.data_dir / "projects.json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Reads configuration from the environment exactly once per process."""
    load_env_file()
    data_dir = os.environ.get("ARCHI_DATA_DIR", "").strip()
    origins = os.environ.get("ARCHI_CORS_ORIGINS", "").strip()
    chain = os.environ.get("ARCHI_LLM_PROVIDERS", "").strip()
    # ARCHI_GEMINI_MODELS is the ordered fallback list; the older singular
    # ARCHI_GEMINI_MODEL still works and simply pins one model.
    models = _split_csv(os.environ.get("ARCHI_GEMINI_MODELS", "").strip())
    single = os.environ.get("ARCHI_GEMINI_MODEL", "").strip()
    if not models and single:
        models = [single]
    return Settings(
        gemini_api_key=os.environ.get("GEMINI_API_KEY", "").strip(),
        gemini_models=models or list(DEFAULT_GEMINI_MODELS),
        gemini_timeout_seconds=float(os.environ.get("ARCHI_GEMINI_TIMEOUT", "90")),
        gemini_thinking_level=os.environ.get(
            "ARCHI_GEMINI_THINKING_LEVEL", DEFAULT_THINKING_LEVEL
        ).strip(),
        gemini_discover_models=os.environ.get(
            "ARCHI_GEMINI_DISCOVER_MODELS", "1"
        ).strip()
        not in {"0", "false", "False", "no"},
        llm_provider_chain=_split_csv(chain) or ["gemini", "offline"],
        data_dir=Path(data_dir) if data_dir else DEFAULT_DATA_DIR,
        cors_origins=_split_csv(origins) or ["http://localhost:5173", "http://127.0.0.1:5173"],
        max_upload_bytes=int(os.environ.get("ARCHI_MAX_UPLOAD_BYTES", str(512 * 1024))),
    )
