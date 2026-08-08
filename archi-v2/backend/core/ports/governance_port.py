"""Contract for enforcing role boundaries and document schema rules."""

from __future__ import annotations

from abc import ABC, abstractmethod

from ..domain.models import AgentRole, DocumentType, GovernanceVerdict


class GovernancePort(ABC):
    """Abstract port for architecture governance checks."""

    @abstractmethod
    async def validate_boundary(self, agent: AgentRole, content: str) -> GovernanceVerdict:
        """Checks that ``content`` stays inside ``agent``'s bounded context."""

    @abstractmethod
    async def validate_document(
        self, agent: AgentRole, doc_type: DocumentType, content: str
    ) -> GovernanceVerdict:
        """Checks a document write against the universal two-document schema."""
