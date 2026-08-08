"""Server-side writer for the two document slots.

Both write paths — chat-generated and uploaded — go through here, so the
two-document schema holds even when the API is called directly.
"""

from __future__ import annotations

import logging
import re
from typing import List, Tuple

from ...config.settings import Settings, get_settings
from ...core.domain.models import (
    AgentDocument,
    AgentRole,
    DocumentType,
    ProjectArchitecture,
)
from ...core.ports.document_port import DocumentPort, DocumentRejectedError
from ...core.ports.governance_port import GovernancePort

logger = logging.getLogger("archi.documents")

# Block form:  [DOC_UPDATE: plan] ...markdown... [/DOC_UPDATE]
BLOCK_PATTERN = re.compile(
    r"\[DOC_UPDATE:\s*(?P<doc_type>principles|plan)\s*\]"
    r"(?P<content>.*?)"
    r"\[/DOC_UPDATE\]",
    re.IGNORECASE | re.DOTALL,
)
# Inline form: [DOC_UPDATE: plan | ...markdown... ]
INLINE_PATTERN = re.compile(
    r"\[DOC_UPDATE:\s*(?P<doc_type>principles|plan)\s*\|(?P<content>[^\]]*)\]",
    re.IGNORECASE,
)


__all__ = ["DocumentStore", "DocumentRejectedError"]


class DocumentStore(DocumentPort):
    """Applies chat-tagged and uploaded content to an agent's document slots."""

    def __init__(
        self, governance: GovernancePort, settings: Settings | None = None
    ) -> None:
        self.governance = governance
        self.settings = settings or get_settings()

    async def list_documents(self, agent: AgentRole) -> List[AgentDocument]:
        return [agent.document(doc_type) for doc_type in DocumentType]

    async def _write(
        self,
        agent: AgentRole,
        doc_type: DocumentType,
        content: str,
        source: str,
    ) -> AgentDocument:
        verdict = await self.governance.validate_document(agent, doc_type, content)
        if not verdict.is_valid:
            raise DocumentRejectedError(verdict.violations)
        document = agent.document(doc_type)
        document.apply_update(content=content, author=agent.id, source=source)
        return document

    async def record(
        self,
        agent: AgentRole,
        doc_type: DocumentType,
        content: str,
        source: str,
    ) -> AgentDocument:
        return await self._write(agent, doc_type, content, source)

    async def apply_chat_update(
        self, project: ProjectArchitecture, agent: AgentRole, reply_text: str
    ) -> Tuple[str, List[AgentDocument]]:
        written: List[AgentDocument] = []
        remaining = reply_text

        for pattern in (BLOCK_PATTERN, INLINE_PATTERN):
            for match in pattern.finditer(remaining):
                doc_type = DocumentType.coerce(match.group("doc_type"))
                content = match.group("content").strip()
                if not content:
                    continue
                try:
                    written.append(await self._write(agent, doc_type, content, "chat"))
                except DocumentRejectedError as exc:
                    # A malformed generated document must not fail the whole chat
                    # turn; the tag is dropped and the reason is logged.
                    logger.info(
                        "Rejected chat-generated %s doc for agent '%s': %s",
                        doc_type.value,
                        agent.id,
                        exc,
                    )
            remaining = pattern.sub("", remaining)

        return remaining.strip(), written

    async def apply_upload(
        self,
        project: ProjectArchitecture,
        agent: AgentRole,
        doc_type: DocumentType,
        filename: str,
        content: str,
    ) -> AgentDocument:
        suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if suffix not in self.settings.allowed_upload_extensions:
            raise DocumentRejectedError(
                [
                    f"Unsupported file type '{suffix or filename}'. Allowed: "
                    + ", ".join(self.settings.allowed_upload_extensions)
                ]
            )
        if len(content.encode("utf-8")) > self.settings.max_upload_bytes:
            raise DocumentRejectedError(
                [f"File exceeds the {self.settings.max_upload_bytes} byte limit."]
            )
        return await self._write(agent, doc_type, content, f"upload:{filename}")
