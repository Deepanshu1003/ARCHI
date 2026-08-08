"""Persistence contract for projects and architecture slices."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional

from ..domain.models import ArchitectureSlice, ProjectArchitecture


class MemoryPort(ABC):
    """Abstract persistence port. Implementations own their storage medium."""

    @abstractmethod
    async def list_projects(self) -> List[ProjectArchitecture]:
        """Returns every stored project."""

    @abstractmethod
    async def get_project(self, project_id: str) -> Optional[ProjectArchitecture]:
        """Returns one project, or None when it does not exist."""

    @abstractmethod
    async def save_project(self, project: ProjectArchitecture) -> None:
        """Creates or replaces a project aggregate."""

    @abstractmethod
    async def delete_project(self, project_id: str) -> None:
        """Removes a project. Deleting a missing project is not an error."""

    @abstractmethod
    async def delete_all_projects(self) -> None:
        """Removes every project."""

    @abstractmethod
    async def save_slice(self, project_id: str, slice_data: ArchitectureSlice) -> None:
        """Stores a slice against its owning agent within a project."""

    @abstractmethod
    async def get_slice_by_agent(
        self, project_id: str, agent_id: str
    ) -> Optional[ArchitectureSlice]:
        """Returns the slice owned by an agent, or None."""
