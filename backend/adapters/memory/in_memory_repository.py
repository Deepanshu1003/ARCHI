# backend/adapters/memory/in_memory_repository.py
"""
In-Memory Repository Implementation for MemoryPort
Provides async persistence for project aggregates and domain architecture slices.
"""

from typing import Dict, Optional
from ...core.ports.memory_port import MemoryPort
from ...core.domain.models import ArchitectureSlice, ProjectArchitecture


class InMemoryRepository(MemoryPort):
    """
    In-memory data repository implementing MemoryPort interface.
    """

    def __init__(self):
        self.projects: Dict[str, ProjectArchitecture] = {}
        self.slices_by_agent: Dict[str, ArchitectureSlice] = {}

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
        return self.projects.get(project_id)
