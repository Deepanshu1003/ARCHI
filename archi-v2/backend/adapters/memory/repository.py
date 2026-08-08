"""In-memory repository with JSON-on-disk durability.

State lives in one long-running process, so the in-memory map is authoritative
and disk is a write-through mirror. Swapping in SQLite later means writing one
new MemoryPort implementation and changing nothing else.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional

from ...config.settings import Settings, get_settings
from ...core.domain.models import ArchitectureSlice, ProjectArchitecture
from ...core.ports.memory_port import MemoryPort
from .serialization import project_from_dict, project_to_dict

logger = logging.getLogger("archi.memory")


class JsonFileRepository(MemoryPort):
    """Holds projects in memory and mirrors them to a single JSON file."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._projects: Dict[str, ProjectArchitecture] = {}
        self._lock = asyncio.Lock()
        self._loaded = False

    @property
    def projects_file(self) -> Path:
        return self.settings.projects_file

    def _load_from_disk(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        if not self.projects_file.exists():
            return
        try:
            raw = json.loads(self.projects_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            logger.error("Could not read %s: %s", self.projects_file, exc)
            return
        for item in raw:
            try:
                project = project_from_dict(item)
            except (KeyError, ValueError) as exc:
                logger.error("Skipping malformed project record: %s", exc)
                continue
            self._projects[project.project_id] = project

    def _flush_to_disk(self) -> None:
        payload = [project_to_dict(project) for project in self._projects.values()]
        self.projects_file.parent.mkdir(parents=True, exist_ok=True)
        # Atomic replace so a crash mid-write cannot truncate the store.
        handle, tmp_path = tempfile.mkstemp(dir=str(self.projects_file.parent), suffix=".tmp")
        try:
            with os.fdopen(handle, "w", encoding="utf-8") as stream:
                json.dump(payload, stream, indent=2)
            os.replace(tmp_path, self.projects_file)
        except OSError as exc:
            logger.error("Could not persist projects to %s: %s", self.projects_file, exc)
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    async def list_projects(self) -> List[ProjectArchitecture]:
        async with self._lock:
            self._load_from_disk()
            return list(self._projects.values())

    async def get_project(self, project_id: str) -> Optional[ProjectArchitecture]:
        async with self._lock:
            self._load_from_disk()
            return self._projects.get(project_id)

    async def save_project(self, project: ProjectArchitecture) -> None:
        async with self._lock:
            self._load_from_disk()
            self._projects[project.project_id] = project
            self._flush_to_disk()

    async def delete_project(self, project_id: str) -> None:
        async with self._lock:
            self._load_from_disk()
            self._projects.pop(project_id, None)
            self._flush_to_disk()

    async def delete_all_projects(self) -> None:
        async with self._lock:
            self._loaded = True
            self._projects.clear()
            self._flush_to_disk()

    async def save_slice(self, project_id: str, slice_data: ArchitectureSlice) -> None:
        async with self._lock:
            self._load_from_disk()
            project = self._projects.get(project_id)
            if project is None:
                raise KeyError(f"Unknown project '{project_id}'.")
            project.domain_slices[slice_data.agent_id] = slice_data
            self._flush_to_disk()

    async def get_slice_by_agent(
        self, project_id: str, agent_id: str
    ) -> Optional[ArchitectureSlice]:
        async with self._lock:
            self._load_from_disk()
            project = self._projects.get(project_id)
            if project is None:
                return None
            return project.domain_slices.get(agent_id)
