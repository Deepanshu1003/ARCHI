"""Domain models and the agent lifecycle state machine."""

from .models import (
    AgentDocument,
    AgentRole,
    AgentStatus,
    ArchitectureSlice,
    ChatMessage,
    DocumentType,
    DocumentVersion,
    GovernanceVerdict,
    MergeResult,
    PendingApproval,
    ProjectArchitecture,
    empty_document_set,
)
from .state_machine import AgentStateMachine, InvalidStateTransitionError

__all__ = [
    "AgentDocument",
    "AgentRole",
    "AgentStatus",
    "AgentStateMachine",
    "ArchitectureSlice",
    "ChatMessage",
    "DocumentType",
    "DocumentVersion",
    "GovernanceVerdict",
    "InvalidStateTransitionError",
    "MergeResult",
    "PendingApproval",
    "ProjectArchitecture",
    "empty_document_set",
]
