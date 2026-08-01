# backend/core/ports/memory_port.py
"""
Memory Port Interface
Persistence port for architecture slices, agent states, and project aggregates.
"""

from abc import ABC, abstractmethod
from typing import Optional
from ..domain.models import ArchitectureSlice, ProjectArchitecture


class MemoryPort(ABC):
    """Abstract port for data persistence and retrieval."""

    @abstractmethod
    async def save_slice(self, slice_data: ArchitectureSlice) -> None:
        """Persists or updates an architecture slice."""
        pass

    @abstractmethod
    async def get_slice_by_agent(self, agent_id: str) -> Optional[ArchitectureSlice]:
        """Retrieves the active architecture slice associated with a specific agent ID."""
        pass

    @abstractmethod
    async def save_project(self, project: ProjectArchitecture) -> None:
        """Persists or updates the complete ProjectArchitecture aggregate."""
        pass

    @abstractmethod
    async def get_project(self, project_id: str) -> Optional[ProjectArchitecture]:
        """Retrieves the ProjectArchitecture aggregate by its project ID."""
        pass
