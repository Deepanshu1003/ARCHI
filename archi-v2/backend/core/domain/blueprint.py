"""Read-only assembly of the whole project into one reviewable blueprint.

Every agent owns two document slots — ``principles`` (the rules it must work
within) and ``plan`` (what it will build). Those are per-agent views; this
module walks the tree once and produces the project-wide answer to "what is the
build plan, and is it final yet?" without mutating anything.

A subordinate's section is final once its supervisor approved it. The root has
no supervisor, so it counts as final once every descendant is approved and it
holds a plan of its own — the merged result of everything below it.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Dict, List

from .models import AgentStatus, DocumentType, ProjectArchitecture

STATUS_LABELS: Dict[AgentStatus, str] = {
    AgentStatus.IDLE: "Not started",
    AgentStatus.DRAFTING: "Drafting",
    AgentStatus.DELEGATED: "Delegated to reports",
    AgentStatus.AWAITING_REVIEW: "Awaiting supervisor review",
    AgentStatus.APPROVED: "Approved",
}


@dataclass
class BlueprintSection:
    """One agent's contribution to the blueprint."""

    agent_id: str
    person_name: str
    role_name: str
    responsibilities: str
    parent_id: str | None
    depth: int
    status: AgentStatus
    status_label: str
    plan: str
    principles: str
    plan_version: int
    updated_at: float
    is_final: bool

    @property
    def has_plan(self) -> bool:
        return bool(self.plan.strip())


@dataclass
class Blueprint:
    """The whole project as one document plus the per-agent breakdown."""

    project_id: str
    name: str
    root_agent_id: str
    generated_at: float
    sections: List[BlueprintSection]
    status_counts: Dict[str, int] = field(default_factory=dict)

    @property
    def is_final(self) -> bool:
        return bool(self.sections) and all(section.is_final for section in self.sections)

    @property
    def pending_agents(self) -> List[str]:
        return [s.person_name for s in self.sections if not s.is_final]

    @property
    def markdown(self) -> str:
        """The blueprint as a single markdown document, ready to copy or export."""
        state = "FINAL" if self.is_final else "DRAFT — not yet approved end to end"
        lines = [f"# {self.name} — Build Plan", "", f"**Status:** {state}", ""]
        if not self.is_final and self.pending_agents:
            lines += [f"**Still pending:** {', '.join(self.pending_agents)}", ""]
        for section in self.sections:
            heading = "#" * min(section.depth + 2, 6)
            lines += [
                f"{heading} {section.person_name} — {section.role_name}",
                "",
                f"*Status:* {section.status_label}  ",
                f"*Responsibilities:* {section.responsibilities or 'Not specified.'}",
                "",
            ]
            if section.principles.strip():
                lines += ["**Principles**", "", section.principles.strip(), ""]
            lines += [
                "**Plan**",
                "",
                section.plan.strip() or "_No plan written yet._",
                "",
            ]
        return "\n".join(lines).rstrip() + "\n"


def _walk(project: ProjectArchitecture, agent_id: str, depth: int) -> List[BlueprintSection]:
    agent = project.agent(agent_id)
    plan_doc = agent.document(DocumentType.PLAN)
    principles_doc = agent.document(DocumentType.PRINCIPLES)
    # `decisions` is the working copy the lifecycle endpoints write; the plan
    # slot is the published one. Prefer whichever actually has content.
    plan = plan_doc.content.strip() or agent.decisions.strip()
    section = BlueprintSection(
        agent_id=agent.id,
        person_name=agent.person_name,
        role_name=agent.role_name,
        responsibilities=agent.responsibilities,
        parent_id=agent.parent_id,
        depth=depth,
        status=agent.status,
        status_label=STATUS_LABELS[agent.status],
        plan=plan,
        principles=principles_doc.content,
        plan_version=plan_doc.version,
        updated_at=plan_doc.updated_at,
        # The root is settled separately: nobody can approve it.
        is_final=agent.status is AgentStatus.APPROVED,
    )
    sections = [section]
    for child_id in agent.children_ids:
        if child_id in project.agents:
            sections.extend(_walk(project, child_id, depth + 1))
    return sections


def build_blueprint(project: ProjectArchitecture) -> Blueprint:
    """Assembles the project blueprint in tree order, root first."""
    sections = (
        _walk(project, project.root_agent_id, 0)
        if project.root_agent_id in project.agents
        else []
    )
    if sections:
        root = sections[0]
        root.is_final = root.has_plan and all(s.is_final for s in sections[1:])

    counts: Dict[str, int] = {status.value: 0 for status in AgentStatus}
    for section in sections:
        counts[section.status.value] += 1
    return Blueprint(
        project_id=project.project_id,
        name=project.name,
        root_agent_id=project.root_agent_id,
        generated_at=time.time(),
        sections=sections,
        status_counts=counts,
    )
