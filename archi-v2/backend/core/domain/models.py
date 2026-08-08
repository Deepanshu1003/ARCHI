"""Domain models for ARCHI v2.

Pure dataclasses and enums with zero third-party dependencies. Nothing in this
module may import from ``adapters``, ``agents`` or ``api``.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class AgentStatus(str, Enum):
    """Lifecycle states an agent moves through while producing its plan."""

    IDLE = "IDLE"
    DRAFTING = "DRAFTING"
    DELEGATED = "DELEGATED"
    AWAITING_REVIEW = "AWAITING_REVIEW"
    APPROVED = "APPROVED"

    @classmethod
    def coerce(cls, value: "str | AgentStatus | None") -> "AgentStatus":
        """Parses a status from any casing, defaulting to IDLE for empty input.

        Raises ValueError for a non-empty value that names no known status, so
        that malformed persisted state surfaces instead of silently resetting.
        """
        if value is None or value == "":
            return cls.IDLE
        if isinstance(value, cls):
            return value
        return cls(str(value).strip().upper())


class DocumentType(str, Enum):
    """The universal two-document schema every agent owns."""

    PRINCIPLES = "principles"
    PLAN = "plan"

    @classmethod
    def coerce(cls, value: "str | DocumentType") -> "DocumentType":
        if isinstance(value, cls):
            return value
        return cls(str(value).strip().lower())


DOCUMENT_TITLES: Dict[DocumentType, str] = {
    DocumentType.PRINCIPLES: "Principles",
    DocumentType.PLAN: "Development Plan",
}

DOCUMENT_DESCRIPTIONS: Dict[DocumentType, str] = {
    DocumentType.PRINCIPLES: (
        "Non-negotiable rules, inherited context and boundaries this agent must "
        "respect while planning and developing."
    ),
    DocumentType.PLAN: (
        "The agent's current finalized development plan. Regenerating appends a "
        "new version rather than overwriting history."
    ),
}


@dataclass
class DocumentVersion:
    """Immutable snapshot of a document's content at a point in time."""

    version: int
    content: str
    updated_at: float
    author: Optional[str] = None
    source: str = "chat"


@dataclass
class AgentDocument:
    """One of the two document slots owned by an agent.

    Both slots exist from agent creation with empty content; ``is_populated``
    distinguishes an untouched slot from a deliberately emptied one.
    """

    doc_type: DocumentType
    agent_id: str
    title: str
    content: str = ""
    version: int = 0
    updated_at: float = field(default_factory=time.time)
    versions: List[DocumentVersion] = field(default_factory=list)

    @property
    def is_populated(self) -> bool:
        return self.version > 0

    def apply_update(self, content: str, author: Optional[str], source: str) -> DocumentVersion:
        """Writes new content and appends a version entry, returning that entry."""
        self.content = content
        self.version += 1
        self.updated_at = time.time()
        snapshot = DocumentVersion(
            version=self.version,
            content=content,
            updated_at=self.updated_at,
            author=author,
            source=source,
        )
        self.versions.append(snapshot)
        return snapshot


def empty_document_set(agent_id: str) -> Dict[DocumentType, AgentDocument]:
    """Creates the two empty document slots every agent starts with."""
    return {
        doc_type: AgentDocument(
            doc_type=doc_type,
            agent_id=agent_id,
            title=DOCUMENT_TITLES[doc_type],
        )
        for doc_type in DocumentType
    }


@dataclass
class ChatMessage:
    """A single turn in an agent's conversation history."""

    role: str  # "user" | "agent"
    content: str
    timestamp: float = field(default_factory=time.time)


@dataclass
class AgentRole:
    """An agent's position in the hierarchy plus everything it owns.

    Behaviour is derived from tree position, not from ``role_name``: an agent
    with children delegates, an agent with a parent submits upward.
    """

    id: str
    person_name: str
    role_name: str
    responsibilities: str = ""
    parent_id: Optional[str] = None
    children_ids: List[str] = field(default_factory=list)
    status: AgentStatus = AgentStatus.IDLE
    decisions: str = ""
    chat_history: List[ChatMessage] = field(default_factory=list)
    documents: Dict[DocumentType, AgentDocument] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.documents:
            self.documents = empty_document_set(self.id)

    @property
    def is_supervisor(self) -> bool:
        return bool(self.children_ids)

    @property
    def is_subordinate(self) -> bool:
        return self.parent_id is not None

    def document(self, doc_type: DocumentType) -> AgentDocument:
        if doc_type not in self.documents:
            self.documents[doc_type] = AgentDocument(
                doc_type=doc_type,
                agent_id=self.id,
                title=DOCUMENT_TITLES[doc_type],
            )
        return self.documents[doc_type]


@dataclass
class ArchitectureSlice:
    """A domain-specific portion of the master blueprint assigned to one agent."""

    slice_id: str
    agent_id: str
    title: str
    domain_scope: str
    content: str
    version: int = 1
    is_finalized: bool = False
    diff_summary: Optional[str] = None


@dataclass
class MergeResult:
    """Outcome of merging an approved child slice into its parent's content."""

    merged_content: str
    conflicts: List[str] = field(default_factory=list)
    summary: str = ""

    @property
    def has_conflicts(self) -> bool:
        return bool(self.conflicts)


@dataclass
class GovernanceVerdict:
    """Result of a governance check, carrying the reasons behind a rejection."""

    is_valid: bool
    violations: List[str] = field(default_factory=list)

    @classmethod
    def ok(cls) -> "GovernanceVerdict":
        return cls(is_valid=True)

    @classmethod
    def rejected(cls, *violations: str) -> "GovernanceVerdict":
        return cls(is_valid=False, violations=list(violations))


@dataclass
class PendingApproval:
    """A subordinate's submission waiting on its supervisor's review."""

    slice_id: str
    supervisor_id: str
    author_id: str
    title: str
    content: str
    diff_text: str
    version: int = 1
    is_finalized: bool = False
    created_at: float = field(default_factory=time.time)


@dataclass
class ProjectArchitecture:
    """Aggregate root: one project, its agent tree and everything they produced."""

    project_id: str
    name: str
    root_agent_id: str
    description: str = ""
    created_at: float = field(default_factory=time.time)
    agents: Dict[str, AgentRole] = field(default_factory=dict)
    master_blueprint: str = ""
    domain_slices: Dict[str, ArchitectureSlice] = field(default_factory=dict)
    pending_approvals: Dict[str, List[PendingApproval]] = field(default_factory=dict)

    def agent(self, agent_id: str) -> AgentRole:
        if agent_id not in self.agents:
            raise KeyError(f"Agent '{agent_id}' does not exist in project '{self.project_id}'.")
        return self.agents[agent_id]

    def direct_reports(self, agent_id: str) -> List[AgentRole]:
        return [self.agents[cid] for cid in self.agent(agent_id).children_ids if cid in self.agents]

    def supervisor_of(self, agent_id: str) -> Optional[AgentRole]:
        parent_id = self.agent(agent_id).parent_id
        return self.agents.get(parent_id) if parent_id else None
