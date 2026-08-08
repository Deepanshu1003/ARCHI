"""Conversion between domain aggregates and their on-disk JSON form.

The stored form is snake_case, matching the domain. camelCase exists only at
the HTTP boundary (``backend.api.schemas``).
"""

from __future__ import annotations

from typing import Any, Dict, List

from ...core.domain.models import (
    AgentDocument,
    AgentRole,
    AgentStatus,
    ArchitectureSlice,
    ChatMessage,
    DocumentType,
    DocumentVersion,
    PendingApproval,
    ProjectArchitecture,
    empty_document_set,
)


def document_to_dict(document: AgentDocument) -> Dict[str, Any]:
    return {
        "doc_type": document.doc_type.value,
        "agent_id": document.agent_id,
        "title": document.title,
        "content": document.content,
        "version": document.version,
        "updated_at": document.updated_at,
        "versions": [
            {
                "version": version.version,
                "content": version.content,
                "updated_at": version.updated_at,
                "author": version.author,
                "source": version.source,
            }
            for version in document.versions
        ],
    }


def document_from_dict(raw: Dict[str, Any], agent_id: str) -> AgentDocument:
    doc_type = DocumentType.coerce(raw.get("doc_type", DocumentType.PLAN.value))
    return AgentDocument(
        doc_type=doc_type,
        agent_id=raw.get("agent_id") or agent_id,
        title=raw.get("title") or doc_type.value.title(),
        content=raw.get("content", ""),
        version=int(raw.get("version", 0)),
        updated_at=float(raw.get("updated_at", 0.0)),
        versions=[
            DocumentVersion(
                version=int(item.get("version", 0)),
                content=item.get("content", ""),
                updated_at=float(item.get("updated_at", 0.0)),
                author=item.get("author"),
                source=item.get("source", "chat"),
            )
            for item in raw.get("versions", [])
        ],
    )


def agent_to_dict(agent: AgentRole) -> Dict[str, Any]:
    return {
        "id": agent.id,
        "person_name": agent.person_name,
        "role_name": agent.role_name,
        "responsibilities": agent.responsibilities,
        "parent_id": agent.parent_id,
        "children_ids": list(agent.children_ids),
        "status": agent.status.value,
        "decisions": agent.decisions,
        "chat_history": [
            {"role": m.role, "content": m.content, "timestamp": m.timestamp}
            for m in agent.chat_history
        ],
        "documents": [document_to_dict(doc) for doc in agent.documents.values()],
    }


def agent_from_dict(raw: Dict[str, Any]) -> AgentRole:
    agent_id = raw["id"]
    documents = {
        document.doc_type: document
        for document in (
            document_from_dict(item, agent_id) for item in raw.get("documents", [])
        )
    }
    for doc_type, blank in empty_document_set(agent_id).items():
        documents.setdefault(doc_type, blank)

    return AgentRole(
        id=agent_id,
        person_name=raw.get("person_name", "Agent"),
        role_name=raw.get("role_name", "Specialist"),
        responsibilities=raw.get("responsibilities", ""),
        parent_id=raw.get("parent_id"),
        children_ids=list(raw.get("children_ids", [])),
        status=AgentStatus.coerce(raw.get("status")),
        decisions=raw.get("decisions", ""),
        chat_history=[
            ChatMessage(
                role=item.get("role", "user"),
                content=item.get("content", ""),
                timestamp=float(item.get("timestamp", 0.0)),
            )
            for item in raw.get("chat_history", [])
        ],
        documents=documents,
    )


def slice_to_dict(slice_data: ArchitectureSlice) -> Dict[str, Any]:
    return {
        "slice_id": slice_data.slice_id,
        "agent_id": slice_data.agent_id,
        "title": slice_data.title,
        "domain_scope": slice_data.domain_scope,
        "content": slice_data.content,
        "version": slice_data.version,
        "is_finalized": slice_data.is_finalized,
        "diff_summary": slice_data.diff_summary,
    }


def slice_from_dict(raw: Dict[str, Any]) -> ArchitectureSlice:
    return ArchitectureSlice(
        slice_id=raw["slice_id"],
        agent_id=raw["agent_id"],
        title=raw.get("title", ""),
        domain_scope=raw.get("domain_scope", ""),
        content=raw.get("content", ""),
        version=int(raw.get("version", 1)),
        is_finalized=bool(raw.get("is_finalized", False)),
        diff_summary=raw.get("diff_summary"),
    )


def approval_to_dict(approval: PendingApproval) -> Dict[str, Any]:
    return {
        "slice_id": approval.slice_id,
        "supervisor_id": approval.supervisor_id,
        "author_id": approval.author_id,
        "title": approval.title,
        "content": approval.content,
        "diff_text": approval.diff_text,
        "version": approval.version,
        "is_finalized": approval.is_finalized,
        "created_at": approval.created_at,
    }


def approval_from_dict(raw: Dict[str, Any]) -> PendingApproval:
    return PendingApproval(
        slice_id=raw["slice_id"],
        supervisor_id=raw["supervisor_id"],
        author_id=raw["author_id"],
        title=raw.get("title", ""),
        content=raw.get("content", ""),
        diff_text=raw.get("diff_text", ""),
        version=int(raw.get("version", 1)),
        is_finalized=bool(raw.get("is_finalized", False)),
        created_at=float(raw.get("created_at", 0.0)),
    )


def project_to_dict(project: ProjectArchitecture) -> Dict[str, Any]:
    return {
        "project_id": project.project_id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at,
        "root_agent_id": project.root_agent_id,
        "master_blueprint": project.master_blueprint,
        "published_spec": project.published_spec,
        "published_at": project.published_at,
        "agents": {aid: agent_to_dict(agent) for aid, agent in project.agents.items()},
        "domain_slices": {
            aid: slice_to_dict(item) for aid, item in project.domain_slices.items()
        },
        "pending_approvals": {
            sid: [approval_to_dict(item) for item in items]
            for sid, items in project.pending_approvals.items()
        },
    }


def project_from_dict(raw: Dict[str, Any]) -> ProjectArchitecture:
    agents = {aid: agent_from_dict(item) for aid, item in raw.get("agents", {}).items()}
    approvals: Dict[str, List[PendingApproval]] = {
        sid: [approval_from_dict(item) for item in items]
        for sid, items in raw.get("pending_approvals", {}).items()
    }
    return ProjectArchitecture(
        project_id=raw["project_id"],
        name=raw.get("name", "ARCHI Project"),
        description=raw.get("description", ""),
        created_at=float(raw.get("created_at", 0.0)),
        root_agent_id=raw.get("root_agent_id", ""),
        agents=agents,
        master_blueprint=raw.get("master_blueprint", ""),
        published_spec=raw.get("published_spec", ""),
        published_at=raw.get("published_at"),
        domain_slices={
            aid: slice_from_dict(item) for aid, item in raw.get("domain_slices", {}).items()
        },
        pending_approvals=approvals,
    )
