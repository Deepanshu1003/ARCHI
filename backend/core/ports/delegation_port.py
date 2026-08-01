# backend/core/ports/delegation_port.py
"""
Delegation Port Interface
Port for slicing master blueprints and distributing sub-plans to direct reports.
"""

from abc import ABC, abstractmethod
from typing import List, Dict
from ..domain.models import AgentRole, ArchitectureSlice


class DelegationPort(ABC):
    """Abstract port for architectural delegation and blueprint slicing."""

    @abstractmethod
    async def slice_architecture(
        self, master_blueprint: str, direct_reports: List[AgentRole]
    ) -> Dict[str, ArchitectureSlice]:
        """
        Decomposes a master architecture blueprint into domain-specific ArchitectureSlices
        tailored exclusively to each direct report's responsibilities.
        
        :param master_blueprint: The master architecture specification string.
        :param direct_reports: List of direct report AgentRole objects receiving delegated slices.
        :return: Dictionary mapping agent_id -> ArchitectureSlice.
        """
        pass
