# backend/adapters/memory/in_memory_repository.py
"""
In-Memory & File Persistence Repository Implementation for MemoryPort
Provides async persistence for project aggregates and domain architecture slices in Python.
"""

import os
import json
from typing import Dict, Optional, List, Any
from ...core.ports.memory_port import MemoryPort
from ...core.domain.models import ArchitectureSlice, ProjectArchitecture

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")


class InMemoryRepository(MemoryPort):
    """
    In-memory and disk-backed repository implementing MemoryPort interface in Python.
    """

    def __init__(self):
        self.projects: Dict[str, ProjectArchitecture] = {}
        self.slices_by_agent: Dict[str, ArchitectureSlice] = {}
        self._ensure_data_dir()

    def _ensure_data_dir(self):
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(PROJECTS_FILE):
            with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _load_projects_from_disk(self) -> List[Dict[str, Any]]:
        self._ensure_data_dir()
        try:
            with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_projects_to_disk(self, projects: List[Dict[str, Any]]):
        self._ensure_data_dir()
        try:
            with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
                json.dump(projects, f, indent=2)
        except Exception as e:
            print("Error saving projects to disk in Python:", e)

    async def get_all_projects(self) -> List[Dict[str, Any]]:
        return self._load_projects_from_disk()

    async def save_raw_project(self, raw_project: Dict[str, Any]) -> None:
        projects = self._load_projects_from_disk()
        proj_id = raw_project.get("id")
        idx = next((i for i, p in enumerate(projects) if p.get("id") == proj_id), -1)
        if idx >= 0:
            projects[idx] = raw_project
        else:
            projects.append(raw_project)
        self._save_projects_to_disk(projects)

    async def delete_project(self, project_id: str) -> None:
        projects = self._load_projects_from_disk()
        projects = [p for p in projects if p.get("id") != project_id]
        self._save_projects_to_disk(projects)
        if project_id in self.projects:
            del self.projects[project_id]

    async def delete_all_projects(self) -> None:
        self._save_projects_to_disk([])
        self.projects.clear()

    async def save_slice(self, slice_data: ArchitectureSlice) -> None:
        """Persists or updates an architecture slice in memory."""
        self.slices_by_agent[slice_data.agent_id] = slice_data

    async def get_slice_by_agent(self, agent_id: str) -> Optional[ArchitectureSlice]:
        """Retrieves the active architecture slice associated with a specific agent ID."""
        return self.slices_by_agent.get(agent_id)

    async def save_project(self, project: ProjectArchitecture) -> None:
        """Persists or updates the complete ProjectArchitecture aggregate."""
        self.projects[project.project_id] = project

    async def get_project(self, project_id: str) -> Optional[ProjectArchitecture]:
        """Retrieves the ProjectArchitecture aggregate by its project ID."""
        if project_id in self.projects:
            return self.projects[project_id]
        
        # Fallback to loading raw project from disk if available
        all_raw = self._load_projects_from_disk()
        raw = next((p for p in all_raw if p.get("id") == project_id), None)
        if not raw:
            return None
            
        # Reconstruct ProjectArchitecture
        from ...core.domain.models import AgentRole, AgentStatus
        agents_map: Dict[str, AgentRole] = {}
        for aid, a in raw.get("agents", {}).items():
            status_enum = AgentStatus.IDLE
            try:
                status_enum = AgentStatus(a.get("status", "idle").lower())
            except ValueError:
                pass
            agents_map[aid] = AgentRole(
                id=a.get("id", aid),
                person_name=a.get("personName") or a.get("person_name") or "Agent",
                role_name=a.get("roleName") or a.get("role_name") or "Specialist",
                responsibilities=a.get("responsibilities", ""),
                parent_id=a.get("parentId") or a.get("parent_id"),
                children_ids=a.get("childrenIds") or a.get("children_ids") or [],
                status=status_enum
            )
            
        proj = ProjectArchitecture(
            project_id=raw.get("id"),
            name=raw.get("name", "ARCHI Project"),
            root_agent_id=raw.get("rootAgentId") or raw.get("root_agent_id") or "root-1",
            agents=agents_map,
            master_blueprint=raw.get("masterBlueprint", ""),
            domain_slices={}
        )
        self.projects[project_id] = proj
        return proj

