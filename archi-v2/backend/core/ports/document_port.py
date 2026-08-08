"""Contract for populating the two document slots every agent owns."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Tuple

from ..domain.models import AgentDocument, AgentRole, DocumentType, ProjectArchitecture


class DocumentPort(ABC):
    """Abstract port for agent document reads and writes.

    Both writes are server-side so the two-document schema cannot be bypassed
    by calling the API directly.
    """

    @abstractmethod
    async def list_documents(self, agent: AgentRole) -> List[AgentDocument]:
        """Returns both document slots, populated or not."""

    @abstractmethod
    async def apply_chat_update(
        self, project: ProjectArchitecture, agent: AgentRole, reply_text: str
    ) -> Tuple[str, List[AgentDocument]]:
        """Extracts ``[DOC_UPDATE: ...]`` blocks from an agent reply.

        Returns the reply with those blocks stripped, plus the documents written.
        """

    @abstractmethod
    async def apply_upload(
        self,
        project: ProjectArchitecture,
        agent: AgentRole,
        doc_type: DocumentType,
        filename: str,
        content: str,
    ) -> AgentDocument:
        """Writes an uploaded file into one of the two slots as a new version."""
