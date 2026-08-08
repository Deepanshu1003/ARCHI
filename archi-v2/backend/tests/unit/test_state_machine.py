"""The lifecycle rules v1 got wrong."""

from __future__ import annotations

import pytest

from ...core.domain.models import AgentRole, AgentStatus
from ...core.domain.state_machine import AgentStateMachine, InvalidStateTransitionError


def make_agent(status: AgentStatus = AgentStatus.IDLE) -> AgentRole:
    return AgentRole(id="a", person_name="A", role_name="Role", status=status)


def test_idle_cannot_jump_straight_to_approved() -> None:
    agent = make_agent()
    with pytest.raises(InvalidStateTransitionError):
        AgentStateMachine.transition(agent, AgentStatus.APPROVED)
    assert agent.status is AgentStatus.IDLE


def test_delegated_cannot_be_approved_without_review() -> None:
    agent = make_agent(AgentStatus.DELEGATED)
    with pytest.raises(InvalidStateTransitionError):
        AgentStateMachine.transition(agent, AgentStatus.APPROVED)


def test_full_happy_path() -> None:
    agent = make_agent()
    AgentStateMachine.transition(agent, AgentStatus.DRAFTING)
    AgentStateMachine.transition(agent, AgentStatus.AWAITING_REVIEW)
    AgentStateMachine.transition(agent, AgentStatus.APPROVED)
    assert agent.status is AgentStatus.APPROVED


def test_transition_to_same_state_is_a_no_op() -> None:
    agent = make_agent(AgentStatus.DRAFTING)
    AgentStateMachine.transition(agent, AgentStatus.DRAFTING)
    assert agent.status is AgentStatus.DRAFTING


def test_delegating_moves_supervisor_and_reports() -> None:
    supervisor = make_agent()
    supervisor.children_ids = ["b"]
    report = AgentRole(id="b", person_name="B", role_name="Report", parent_id="a")
    AgentStateMachine.on_delegate(supervisor, [report])
    assert supervisor.status is AgentStatus.DELEGATED
    assert report.status is AgentStatus.DRAFTING


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("drafting", AgentStatus.DRAFTING),
        ("AWAITING_REVIEW", AgentStatus.AWAITING_REVIEW),
        (None, AgentStatus.IDLE),
        ("", AgentStatus.IDLE),
    ],
)
def test_status_coercion_accepts_any_casing(raw, expected) -> None:
    assert AgentStatus.coerce(raw) is expected


def test_status_coercion_rejects_unknown_values() -> None:
    """v1 silently reset unknown statuses to IDLE; that hid the reload bug."""
    with pytest.raises(ValueError):
        AgentStatus.coerce("not-a-status")
