"""Contract for downward delegation events and upward approval routing."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict, List

from ..domain.models import ArchitectureSlice, PendingApproval, ProjectArchitecture


class EventBusPort(ABC):
    """Abstract port for routing work down the tree and reviews back up."""

    @abstractmethod
    async def publish_downward(
        self,
        project: ProjectArchitecture,
        supervisor_id: str,
        slices: Dict[str, ArchitectureSlice],
    ) -> None:
        """Delivers one slice to each targeted direct report."""

    @abstractmethod
    async def publish_upward_for_approval(
        self,
        project: ProjectArchitecture,
        slice_data: ArchitectureSlice,
        supervisor_id: str,
    ) -> PendingApproval:
        """Queues a submission for its supervisor, attaching a textual diff."""

    @abstractmethod
    async def pending_for_supervisor(
        self, project: ProjectArchitecture, supervisor_id: str
    ) -> List[PendingApproval]:
        """Lists the submissions awaiting a given supervisor."""

    @abstractmethod
    async def clear_pending(
        self, project: ProjectArchitecture, supervisor_id: str, author_id: str
    ) -> None:
        """Drops a submission once it has been resolved."""
