"""Upward submission and review, available only to agents that have a parent."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List

from ...core.domain.models import (
    AgentRole,
    MergeResult,
    PendingApproval,
    ProjectArchitecture,
)
from ...core.domain.state_machine import AgentStateMachine
from ...core.ports.event_bus_port import EventBusPort
from ...core.ports.governance_port import GovernancePort
from ...core.ports.merge_port import MergePort

logger = logging.getLogger("archi.agents.submission")


class NotASubordinateError(ValueError):
    """Raised when a root agent is asked to submit work upward."""


class GovernanceRejectedError(ValueError):
    """Raised when a submission violates the agent's bounded context."""

    def __init__(self, violations: List[str]) -> None:
        super().__init__("; ".join(violations))
        self.violations = violations


@dataclass
class SubmissionOutcome:
    """The approval request created by a submission."""

    approval: PendingApproval
    governance_violations: List[str] = field(default_factory=list)


@dataclass
class ApprovalOutcome:
    """The result of a supervisor approving a subordinate's work."""

    merge: MergeResult
    subordinate_id: str
    supervisor_id: str


class SubmissionCapability:
    """Submits work up to a supervisor and applies the supervisor's decision."""

    def __init__(
        self, event_bus: EventBusPort, merger: MergePort, governance: GovernancePort
    ) -> None:
        self.event_bus = event_bus
        self.merger = merger
        self.governance = governance

    async def submit(
        self, project: ProjectArchitecture, agent: AgentRole, content: str | None = None
    ) -> SubmissionOutcome:
        if not agent.is_subordinate:
            raise NotASubordinateError(
                f"{agent.person_name} is the root agent and has nobody to submit to."
            )

        slice_data = project.domain_slices.get(agent.id)
        if slice_data is None and content is None:
            raise ValueError(f"{agent.person_name} has nothing to submit.")
        if content is not None:
            if slice_data is None:
                raise ValueError(
                    f"{agent.person_name} must be delegated a plan before submitting."
                )
            slice_data.content = content
            slice_data.version += 1

        assert slice_data is not None  # narrowed by the checks above
        verdict = await self.governance.validate_boundary(agent, slice_data.content)
        if not verdict.is_valid:
            raise GovernanceRejectedError(verdict.violations)

        approval = await self.event_bus.publish_upward_for_approval(
            project, slice_data, agent.parent_id or ""
        )
        AgentStateMachine.on_submit(agent)
        agent.decisions = slice_data.content
        return SubmissionOutcome(approval=approval, governance_violations=[])

    async def approve(
        self, project: ProjectArchitecture, supervisor: AgentRole, subordinate: AgentRole
    ) -> ApprovalOutcome:
        """Approves a submission and merges it into the supervisor's plan."""
        child_slice = project.domain_slices.get(subordinate.id)
        if child_slice is None:
            raise ValueError(f"{subordinate.person_name} has no submitted work to approve.")
        if not await self._is_pending(project, supervisor, subordinate):
            raise ValueError(
                f"{subordinate.person_name} has no submission awaiting "
                f"{supervisor.person_name}'s review."
            )

        parent_slice = project.domain_slices.get(supervisor.id)
        parent_content = parent_slice.content if parent_slice else project.master_blueprint

        merge = await self.merger.merge_slice(
            supervisor=supervisor,
            subordinate=subordinate,
            parent_content=parent_content,
            child_slice=child_slice,
        )

        AgentStateMachine.on_approve(subordinate)
        child_slice.is_finalized = True

        if parent_slice is not None:
            parent_slice.content = merge.merged_content
            parent_slice.version += 1
        if supervisor.id == project.root_agent_id:
            project.master_blueprint = merge.merged_content
        supervisor.decisions = merge.merged_content

        await self.event_bus.clear_pending(project, supervisor.id, subordinate.id)
        return ApprovalOutcome(
            merge=merge, subordinate_id=subordinate.id, supervisor_id=supervisor.id
        )

    async def _is_pending(
        self, project: ProjectArchitecture, supervisor: AgentRole, subordinate: AgentRole
    ) -> bool:
        queue = await self.event_bus.pending_for_supervisor(project, supervisor.id)
        return any(item.author_id == subordinate.id for item in queue)

    async def request_revision(
        self, project: ProjectArchitecture, supervisor: AgentRole, subordinate: AgentRole
    ) -> None:
        """Sends a submission back down for rework."""
        if not await self._is_pending(project, supervisor, subordinate):
            raise ValueError(
                f"{subordinate.person_name} has no submission awaiting "
                f"{supervisor.person_name}'s review."
            )
        AgentStateMachine.on_request_revision(subordinate)
        await self.event_bus.clear_pending(project, supervisor.id, subordinate.id)
