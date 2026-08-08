"""The "merge" contract: fold an approved child slice back into its parent."""

from __future__ import annotations

from abc import ABC, abstractmethod

from ..domain.models import AgentRole, ArchitectureSlice, MergeResult


class MergePort(ABC):
    """Abstract port for upward integration of approved subordinate work."""

    @abstractmethod
    async def merge_slice(
        self,
        supervisor: AgentRole,
        subordinate: AgentRole,
        parent_content: str,
        child_slice: ArchitectureSlice,
    ) -> MergeResult:
        """Integrates ``child_slice`` into ``parent_content``.

        Implementations must report conflicts rather than silently discarding
        either side.
        """
