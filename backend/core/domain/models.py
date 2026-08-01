# backend/core/domain/models.py
"""
Domain Models for Multi-Agent Architecture & Design Platform
Strict Clean Architecture Domain Layer (Zero External Dependencies)
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict


class AgentStatus(str, Enum):
    """Lifecycle states for agents within the architecture orchestration pipeline."""
    IDLE = "IDLE"
    DRAFTING = "DRAFTING"
    DELEGATED = "DELEGATED"
    AWAITING_REVIEW = "AWAITING_REVIEW"
    APPROVED = "APPROVED"


@dataclass
class RequiredDocumentType:
    """Requirement specification for a document type within a role schema."""
    doc_type: str
    display_name: str
    description: str
    required: bool = True


@dataclass
class RoleDocumentSchema:
    """Role-driven schema defining required memory document types for an agent role."""
    role_id: str
    required_document_types: List[RequiredDocumentType] = field(default_factory=list)


@dataclass
class DocumentVersion:
    """Historical snapshot version of an agent memory document."""
    version: int
    content: str
    updated_at: float
    author: Optional[str] = None


@dataclass
class AgentDocument:
    """Role-schema validated memory document in an agent's memory bank."""
    id: str
    title: str
    filename: str
    category: str
    content: str
    updated_at: float
    doc_type: Optional[str] = None
    version: int = 1
    versions: List[DocumentVersion] = field(default_factory=list)
    is_archived: bool = False
    is_quarantined: bool = False
    quarantine_reason: Optional[str] = None


@dataclass
class AgentRole:
    """Represents an agent role within the organizational hierarchy."""
    id: str
    person_name: str
    role_name: str
    responsibilities: str
    parent_id: Optional[str] = None
    children_ids: List[str] = field(default_factory=list)
    status: AgentStatus = AgentStatus.IDLE
    documents: List[AgentDocument] = field(default_factory=list)
    role_schema: Optional[RoleDocumentSchema] = None


@dataclass
class ArchitectureSlice:
    """Represents a domain-specific slice of the overall system architecture."""
    slice_id: str
    agent_id: str
    title: str
    domain_scope: str
    content: str  # Markdown specification
    version: int = 1
    is_finalized: bool = False
    diff_summary: Optional[str] = None


@dataclass
class ProjectArchitecture:
    """Aggregate root representing the overall architecture project."""
    project_id: str
    name: str
    root_agent_id: str
    agents: Dict[str, AgentRole] = field(default_factory=dict)
    master_blueprint: str = ""
    domain_slices: Dict[str, ArchitectureSlice] = field(default_factory=dict)
