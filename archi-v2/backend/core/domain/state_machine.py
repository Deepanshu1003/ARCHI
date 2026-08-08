"""Deterministic agent lifecycle state machine."""

from __future__ import annotations

from typing import List, Set, Tuple

from .models import AgentRole, AgentStatus


class InvalidStateTransitionError(ValueError):
    """Raised when a transition is not permitted by the lifecycle matrix."""


class AgentStateMachine:
    """Enforces the agent lifecycle.

    Permitted transitions:
        IDLE            -> DRAFTING          (agent receives an assignment)
        IDLE            -> DELEGATED         (supervisor hands work to its reports)
        DRAFTING        -> DELEGATED         (supervisor splits its draft downward)
        DRAFTING        -> AWAITING_REVIEW   (draft submitted upward)
        DELEGATED       -> AWAITING_REVIEW   (all reports submitted back)
        AWAITING_REVIEW -> DRAFTING          (supervisor requests a revision)
        AWAITING_REVIEW -> APPROVED          (supervisor approves)
        APPROVED        -> DRAFTING          (work reopened)

    Notably absent: IDLE -> APPROVED and DELEGATED -> APPROVED. Work cannot be
    approved unless it was actually submitted for review.
    """

    ALLOWED_TRANSITIONS: Set[Tuple[AgentStatus, AgentStatus]] = {
        (AgentStatus.IDLE, AgentStatus.DRAFTING),
        (AgentStatus.IDLE, AgentStatus.DELEGATED),
        (AgentStatus.DRAFTING, AgentStatus.DELEGATED),
        (AgentStatus.DRAFTING, AgentStatus.AWAITING_REVIEW),
        (AgentStatus.DELEGATED, AgentStatus.AWAITING_REVIEW),
        (AgentStatus.AWAITING_REVIEW, AgentStatus.DRAFTING),
        (AgentStatus.AWAITING_REVIEW, AgentStatus.APPROVED),
        (AgentStatus.APPROVED, AgentStatus.DRAFTING),
    }

    @classmethod
    def can_transition(cls, current: AgentStatus, target: AgentStatus) -> bool:
        if current == target:
            return True
        return (current, target) in cls.ALLOWED_TRANSITIONS

    @classmethod
    def transition(cls, agent: AgentRole, target: AgentStatus) -> AgentStatus:
        if not cls.can_transition(agent.status, target):
            raise InvalidStateTransitionError(
                f"Cannot transition agent '{agent.person_name}' ({agent.role_name}) "
                f"from '{agent.status.value}' to '{target.value}'."
            )
        agent.status = target
        return agent.status

    @classmethod
    def on_delegate(cls, supervisor: AgentRole, direct_reports: List[AgentRole]) -> None:
        """Supervisor publishes downward: it becomes DELEGATED, reports DRAFTING."""
        cls.transition(supervisor, AgentStatus.DELEGATED)
        for report in direct_reports:
            cls.transition(report, AgentStatus.DRAFTING)

    @classmethod
    def on_submit(cls, agent: AgentRole) -> None:
        """Agent submits its work upward for review."""
        cls.transition(agent, AgentStatus.AWAITING_REVIEW)

    @classmethod
    def on_approve(cls, subordinate: AgentRole) -> None:
        """Supervisor approves a subordinate's submission."""
        cls.transition(subordinate, AgentStatus.APPROVED)

    @classmethod
    def on_request_revision(cls, subordinate: AgentRole) -> None:
        """Supervisor sends a submission back for rework."""
        cls.transition(subordinate, AgentStatus.DRAFTING)
