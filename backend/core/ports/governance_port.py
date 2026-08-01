# backend/core/ports/governance_port.py
"""
Governance Port Interface
Port for validating domain boundaries, architecture schemas, and structural compliance.
"""

from abc import ABC, abstractmethod
from ..domain.models import AgentRole


class GovernancePort(ABC):
    """Abstract port for architecture governance and validation."""

    @abstractmethod
    async def validate_boundary(self, agent: AgentRole, slice_content: str) -> bool:
        """
        Validates whether an architecture slice content respects the bounded context
        and explicit responsibilities defined for the given agent role.
        
        :param agent: The AgentRole claiming the slice.
        :param slice_content: The markdown architecture specification content.
        :return: True if boundary rules pass, False otherwise.
        """
        pass

    @abstractmethod
    async def validate_schema(self, slice_content: str) -> bool:
        """
        Validates whether the slice content conforms to required architectural documentation schema.
        
        :param slice_content: The markdown architecture specification content.
        :return: True if schema rules pass, False otherwise.
        """
        pass
