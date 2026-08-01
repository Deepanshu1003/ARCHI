# backend/core/ports/event_bus_port.py
"""
Event Bus Port Interface
Port for event publication across downward delegation channels and upward review requests.
"""

from abc import ABC, abstractmethod
from typing import List
from ..domain.models import ArchitectureSlice


class EventBusPort(ABC):
    """Abstract port for messaging and architecture event distribution."""

    @abstractmethod
    async def publish_downward(
        self, slice_data: ArchitectureSlice, target_agent_ids: List[str]
    ) -> None:
        """
        Publishes a delegated architecture slice downward to target direct report agents.
        
        :param slice_data: The ArchitectureSlice being published.
        :param target_agent_ids: List of agent IDs intended to receive the event.
        """
        pass

    @abstractmethod
    async def publish_upward_for_approval(
        self, slice_data: ArchitectureSlice, supervisor_id: str
    ) -> None:
        """
        Publishes a completed architecture slice upward to a supervisor for review and approval.
        
        :param slice_data: The ArchitectureSlice submitted for review.
        :param supervisor_id: The target supervisor's agent ID.
        """
        pass
