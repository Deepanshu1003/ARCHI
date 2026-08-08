"""DTOs for drafting, delegation, submission and approval."""

from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import Field

from .base import CamelModel
from .projects import ApprovalOut, SliceOut


class DegradedInfo(CamelModel):
    """Tells the client when output came from a template instead of a model."""

    degraded: bool = False
    reason: str = ""
    provider: str = ""


class DraftRequest(CamelModel):
    agent_id: str
    context: str = ""


class DraftResponse(CamelModel):
    slice: SliceOut
    agent_status: str
    governance_violations: List[str] = Field(default_factory=list)
    degraded_info: DegradedInfo = Field(default_factory=DegradedInfo)


class DelegateRequest(CamelModel):
    agent_id: str


class DelegateResponse(CamelModel):
    supervisor_id: str
    recipients: List[str]
    slices: Dict[str, SliceOut]
    agent_statuses: Dict[str, str]
    degraded_info: DegradedInfo = Field(default_factory=DegradedInfo)


class SubmitRequest(CamelModel):
    agent_id: str
    content: Optional[str] = None


class SubmitResponse(CamelModel):
    approval: ApprovalOut
    agent_status: str


class ApproveRequest(CamelModel):
    supervisor_id: str
    subordinate_id: str


class ApproveResponse(CamelModel):
    supervisor_id: str
    subordinate_id: str
    merged_content: str
    conflicts: List[str] = Field(default_factory=list)
    summary: str
    agent_statuses: Dict[str, str]


class RevisionRequest(CamelModel):
    supervisor_id: str
    subordinate_id: str


class RevisionResponse(CamelModel):
    subordinate_id: str
    agent_status: str


class DiffRequest(CamelModel):
    before: str
    after: str
    from_label: str = "before"
    to_label: str = "after"


class DiffResponse(CamelModel):
    diff: str
    has_changes: bool
