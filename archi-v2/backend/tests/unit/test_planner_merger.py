"""Planner divides, Merger merges — both against ports, never against Gemini."""

from __future__ import annotations

import pytest

from ...agents.merger.merger_agent import MergerAgent
from ...agents.planner.planner_agent import PlannerAgent
from ...core.domain.models import ArchitectureSlice
from ..conftest import ScriptedAgentAdapter

pytestmark = pytest.mark.asyncio

PARENT_PLAN = "# System Plan\n- API layer\n- Web client\n"


def slice_for(agent_id: str, content: str) -> ArchitectureSlice:
    return ArchitectureSlice(
        slice_id=f"slice-{agent_id}",
        agent_id=agent_id,
        title="Sub-Plan",
        domain_scope="scope",
        content=content,
        version=1,
    )


async def test_planner_splits_model_output_per_direct_report(project) -> None:
    reports = project.direct_reports("agent-root")
    adapter = ScriptedAgentAdapter(
        [
            "<<<AGENT:agent-api>>>\n# Backend\n- Build the API\n"
            "<<<AGENT:agent-ui>>>\n# Frontend\n- Build the client\n"
        ]
    )
    result = await PlannerAgent(adapter).slice_architecture(
        project.agent("agent-root"), PARENT_PLAN, reports
    )

    assert set(result.slices) == {"agent-api", "agent-ui"}
    assert "Build the API" in result.slices["agent-api"].content
    assert not result.degraded


async def test_planner_falls_back_and_flags_missing_sections(project) -> None:
    reports = project.direct_reports("agent-root")
    adapter = ScriptedAgentAdapter(["<<<AGENT:agent-api>>>\n# Backend only\n"])
    result = await PlannerAgent(adapter).slice_architecture(
        project.agent("agent-root"), PARENT_PLAN, reports
    )

    assert result.degraded
    assert result.reason
    assert "template" in result.slices["agent-ui"].content.lower()


async def test_planner_ignores_sections_for_unknown_agents(project) -> None:
    reports = [project.agent("agent-api")]
    adapter = ScriptedAgentAdapter(["<<<AGENT:agent-nobody>>>\n# Not a report\n"])
    result = await PlannerAgent(adapter).slice_architecture(
        project.agent("agent-root"), PARENT_PLAN, reports
    )
    assert set(result.slices) == {"agent-api"}


async def test_merger_appends_a_new_subordinate_section(project) -> None:
    result = await MergerAgent().merge_slice(
        supervisor=project.agent("agent-root"),
        subordinate=project.agent("agent-api"),
        parent_content=PARENT_PLAN,
        child_slice=slice_for("agent-api", "# Backend\n- Build the API\n"),
    )
    assert PARENT_PLAN.strip() in result.merged_content
    assert "Build the API" in result.merged_content
    assert result.conflicts == []


async def test_merger_replaces_rather_than_duplicating_on_resubmission(project) -> None:
    merger = MergerAgent()
    supervisor = project.agent("agent-root")
    subordinate = project.agent("agent-api")

    first = await merger.merge_slice(
        supervisor, subordinate, PARENT_PLAN, slice_for("agent-api", "# Backend\n- v1\n")
    )
    second = await merger.merge_slice(
        supervisor,
        subordinate,
        first.merged_content,
        slice_for("agent-api", "# Backend\n- v2 with more detail here\n"),
    )

    assert second.merged_content.count("archi:section agent=agent-api") == 1
    assert "- v1" not in second.merged_content
    assert "- v2" in second.merged_content


async def test_merger_flags_a_section_the_child_would_gut(project) -> None:
    parent = "# System Plan\n\n## Api Layer\n" + "- detailed requirement\n" * 20
    result = await MergerAgent().merge_slice(
        supervisor=project.agent("agent-root"),
        subordinate=project.agent("agent-api"),
        parent_content=parent,
        child_slice=slice_for("agent-api", "## Api Layer\n- do it\n"),
    )
    assert result.conflicts
    assert "api layer" in result.conflicts[0].lower()
