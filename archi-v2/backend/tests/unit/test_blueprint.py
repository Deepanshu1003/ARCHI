"""The project-wide build plan assembled from the agent tree."""

from __future__ import annotations

from ...core.domain.blueprint import build_blueprint
from ...core.domain.models import AgentStatus, DocumentType


def test_sections_follow_the_tree_root_first(project) -> None:
    blueprint = build_blueprint(project)

    assert [s.agent_id for s in blueprint.sections] == ["agent-root", "agent-api", "agent-ui"]
    assert [s.depth for s in blueprint.sections] == [0, 1, 1]


def test_a_project_without_plans_is_not_final(project) -> None:
    blueprint = build_blueprint(project)

    assert blueprint.is_final is False
    assert "Ada" in blueprint.pending_agents
    assert "DRAFT" in blueprint.markdown


def test_plan_slot_wins_over_the_working_copy(project) -> None:
    agent = project.agent("agent-api")
    agent.decisions = "working copy"
    agent.document(DocumentType.PLAN).apply_update(
        "# Published\n- item\n", author=agent.id, source="draft"
    )

    section = next(s for s in build_blueprint(project).sections if s.agent_id == "agent-api")

    assert section.plan == "# Published\n- item"
    assert section.plan_version == 1


def test_project_is_final_once_reports_are_approved_and_root_has_a_plan(project) -> None:
    for agent_id in ("agent-api", "agent-ui"):
        project.agent(agent_id).status = AgentStatus.APPROVED
    project.agent("agent-root").decisions = "# Merged blueprint\n- everything\n"

    blueprint = build_blueprint(project)

    assert blueprint.is_final is True
    assert blueprint.pending_agents == []
    assert "FINAL" in blueprint.markdown


def test_root_without_a_plan_is_never_final(project) -> None:
    for agent_id in ("agent-api", "agent-ui"):
        project.agent(agent_id).status = AgentStatus.APPROVED

    blueprint = build_blueprint(project)

    assert blueprint.is_final is False
    assert blueprint.pending_agents == ["Ada"]


def test_markdown_carries_every_agent_and_its_status(project) -> None:
    project.agent("agent-api").status = AgentStatus.AWAITING_REVIEW

    markdown = build_blueprint(project).markdown

    assert "Ada — Chief Architect" in markdown
    assert "Awaiting supervisor review" in markdown
    assert "_No plan written yet._" in markdown
