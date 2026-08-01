# backend/core/domain/state_machine.py
"""
Deterministic State Machine for Agent Status Transitions
Enforces valid state transition invariants across the organizational hierarchy.
"""

from typing import List, Set, Tuple
from .models import AgentRole, AgentStatus


class InvalidStateTransitionError(ValueError):
    """Raised when an invalid state transition is attempted."""
    pass


class AgentStateMachine:
    """
    Deterministic state machine enforcing lifecycle rules for agent roles.
    
    Allowed Transitions Matrix:
    - IDLE -> DELEGATED (when supervisor delegates down)
    - IDLE -> DRAFTING (when receiving initial assignment)
    - DELEGATED -> AWAITING_REVIEW (when direct reports submit back and supervisor reviews)
    - DELEGATED -> APPROVED (when all subordinate work is validated)
    - DRAFTING -> AWAITING_REVIEW (when specialist completes draft and submits up)
    - AWAITING_REVIEW -> DRAFTING (if supervisor requests revision)
    - AWAITING_REVIEW -> APPROVED (when supervisor approves slice)
    - APPROVED -> DRAFTING (if slice is reopened for modifications)
    """

    ALLOWED_TRANSITIONS: Set[Tuple[AgentStatus, AgentStatus]] = {
        (AgentStatus.IDLE, AgentStatus.DELEGATED),
        (AgentStatus.IDLE, AgentStatus.DRAFTING),
        (AgentStatus.IDLE, AgentStatus.AWAITING_REVIEW),
        (AgentStatus.IDLE, AgentStatus.APPROVED),
        (AgentStatus.DRAFTING, AgentStatus.DELEGATED),
        (AgentStatus.DRAFTING, AgentStatus.AWAITING_REVIEW),
        (AgentStatus.DRAFTING, AgentStatus.APPROVED),
        (AgentStatus.DELEGATED, AgentStatus.DRAFTING),
        (AgentStatus.DELEGATED, AgentStatus.AWAITING_REVIEW),
        (AgentStatus.DELEGATED, AgentStatus.APPROVED),
        (AgentStatus.AWAITING_REVIEW, AgentStatus.DRAFTING),
        (AgentStatus.AWAITING_REVIEW, AgentStatus.APPROVED),
        (AgentStatus.APPROVED, AgentStatus.DRAFTING),
    }

    @classmethod
    def can_transition(cls, current: AgentStatus, target: AgentStatus) -> bool:
        """Check if a transition from current to target status is valid."""
        if current == target:
            return True
        return (current, target) in cls.ALLOWED_TRANSITIONS

    @classmethod
    def transition(cls, agent: AgentRole, target: AgentStatus) -> AgentStatus:
        """
        Transition an agent's status to target if valid, otherwise raise InvalidStateTransitionError.
        Returns the updated AgentStatus.
        """
        if not cls.can_transition(agent.status, target):
            raise InvalidStateTransitionError(
                f"Cannot transition agent '{agent.person_name}' ({agent.role_name}) "
                f"from status '{agent.status.value}' to '{target.value}'."
            )
        agent.status = target
        return agent.status

    @classmethod
    def transition_on_delegate(cls, supervisor: AgentRole, direct_reports: List[AgentRole]) -> None:
        """
        Executes transition when a supervisor publishes/delegates master plan to direct reports.
        - Supervisor transitions to DELEGATED.
        - Each direct report receiving a slice transitions to DRAFTING.
        """
        cls.transition(supervisor, AgentStatus.DELEGATED)
        for report in direct_reports:
            cls.transition(report, AgentStatus.DRAFTING)

    @classmethod
    def transition_on_receive_slice(cls, agent: AgentRole) -> None:
        """Executes transition when an agent receives an architecture slice to work on."""
        cls.transition(agent, AgentStatus.DRAFTING)

    @classmethod
    def transition_on_submit_review(cls, agent: AgentRole) -> None:
        """Executes transition when a specialist completes draft and submits up for approval."""
        cls.transition(agent, AgentStatus.AWAITING_REVIEW)

    @classmethod
    def transition_on_approve(cls, supervisor: AgentRole, subordinate: AgentRole) -> None:
        """
        Executes transition when a supervisor validates and approves a subordinate's architecture slice.
        - Subordinate transitions to APPROVED.
        """
        cls.transition(subordinate, AgentStatus.APPROVED)
