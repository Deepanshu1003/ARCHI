"""DTOs for projects, agents, documents, slices and approvals."""

from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import Field

from ...core.domain.models import (
    AgentDocument,
    AgentRole,
    ArchitectureSlice,
    PendingApproval,
    ProjectArchitecture,
)
from .base import CamelModel


class DocumentVersionOut(CamelModel):
    version: int
    content: str
    updated_at: float
    author: Optional[str] = None
    source: str


class DocumentOut(CamelModel):
    doc_type: str
    agent_id: str
    title: str
    content: str
    version: int
    updated_at: float
    is_populated: bool
    versions: List[DocumentVersionOut] = Field(default_factory=list)

    @classmethod
    def from_domain(cls, document: AgentDocument) -> "DocumentOut":
        return cls(
            doc_type=document.doc_type.value,
            agent_id=document.agent_id,
            title=document.title,
            content=document.content,
            version=document.version,
            updated_at=document.updated_at,
            is_populated=document.is_populated,
            versions=[
                DocumentVersionOut(
                    version=item.version,
                    content=item.content,
                    updated_at=item.updated_at,
                    author=item.author,
                    source=item.source,
                )
                for item in document.versions
            ],
        )


class ChatMessageOut(CamelModel):
    role: str
    content: str
    timestamp: float


class AgentOut(CamelModel):
    id: str
    person_name: str
    role_name: str
    responsibilities: str
    parent_id: Optional[str] = None
    children_ids: List[str] = Field(default_factory=list)
    status: str
    decisions: str
    is_supervisor: bool
    is_subordinate: bool
    chat_history: List[ChatMessageOut] = Field(default_factory=list)
    documents: List[DocumentOut] = Field(default_factory=list)

    @classmethod
    def from_domain(cls, agent: AgentRole) -> "AgentOut":
        return cls(
            id=agent.id,
            person_name=agent.person_name,
            role_name=agent.role_name,
            responsibilities=agent.responsibilities,
            parent_id=agent.parent_id,
            children_ids=list(agent.children_ids),
            status=agent.status.value,
            decisions=agent.decisions,
            is_supervisor=agent.is_supervisor,
            is_subordinate=agent.is_subordinate,
            chat_history=[
                ChatMessageOut(role=m.role, content=m.content, timestamp=m.timestamp)
                for m in agent.chat_history
            ],
            documents=[DocumentOut.from_domain(doc) for doc in agent.documents.values()],
        )


class SliceOut(CamelModel):
    slice_id: str
    agent_id: str
    title: str
    domain_scope: str
    content: str
    version: int
    is_finalized: bool
    diff_summary: Optional[str] = None

    @classmethod
    def from_domain(cls, slice_data: ArchitectureSlice) -> "SliceOut":
        return cls(
            slice_id=slice_data.slice_id,
            agent_id=slice_data.agent_id,
            title=slice_data.title,
            domain_scope=slice_data.domain_scope,
            content=slice_data.content,
            version=slice_data.version,
            is_finalized=slice_data.is_finalized,
            diff_summary=slice_data.diff_summary,
        )


class ApprovalOut(CamelModel):
    slice_id: str
    supervisor_id: str
    author_id: str
    title: str
    content: str
    diff_text: str
    version: int
    is_finalized: bool
    created_at: float

    @classmethod
    def from_domain(cls, approval: PendingApproval) -> "ApprovalOut":
        return cls(
            slice_id=approval.slice_id,
            supervisor_id=approval.supervisor_id,
            author_id=approval.author_id,
            title=approval.title,
            content=approval.content,
            diff_text=approval.diff_text,
            version=approval.version,
            is_finalized=approval.is_finalized,
            created_at=approval.created_at,
        )


class ProjectOut(CamelModel):
    project_id: str
    name: str
    description: str
    created_at: float
    root_agent_id: str
    master_blueprint: str
    agents: Dict[str, AgentOut]
    domain_slices: Dict[str, SliceOut]
    pending_approvals: Dict[str, List[ApprovalOut]]

    @classmethod
    def from_domain(cls, project: ProjectArchitecture) -> "ProjectOut":
        return cls(
            project_id=project.project_id,
            name=project.name,
            description=project.description,
            created_at=project.created_at,
            root_agent_id=project.root_agent_id,
            master_blueprint=project.master_blueprint,
            agents={aid: AgentOut.from_domain(a) for aid, a in project.agents.items()},
            domain_slices={
                aid: SliceOut.from_domain(s) for aid, s in project.domain_slices.items()
            },
            pending_approvals={
                sid: [ApprovalOut.from_domain(item) for item in items]
                for sid, items in project.pending_approvals.items()
            },
        )


class AgentIn(CamelModel):
    id: str
    person_name: str
    role_name: str
    responsibilities: str = ""
    parent_id: Optional[str] = None
    children_ids: List[str] = Field(default_factory=list)
    status: Optional[str] = None


class CreateProjectRequest(CamelModel):
    project_id: Optional[str] = None
    name: str
    description: str = ""
    root_agent_id: str
    agents: List[AgentIn]


class UpdateProjectRequest(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None
    root_agent_id: Optional[str] = None
    agents: Optional[List[AgentIn]] = None
