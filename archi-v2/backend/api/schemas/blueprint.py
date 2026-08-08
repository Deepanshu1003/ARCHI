"""DTOs for the project-wide build plan."""

from __future__ import annotations

from typing import Dict, List, Optional

from ...core.domain.blueprint import Blueprint, BlueprintSection
from .base import CamelModel


class BlueprintSectionOut(CamelModel):
    agent_id: str
    person_name: str
    role_name: str
    responsibilities: str
    parent_id: Optional[str]
    depth: int
    status: str
    status_label: str
    plan: str
    principles: str
    plan_version: int
    updated_at: float
    is_final: bool
    has_plan: bool

    @classmethod
    def from_domain(cls, section: BlueprintSection) -> "BlueprintSectionOut":
        return cls(
            agent_id=section.agent_id,
            person_name=section.person_name,
            role_name=section.role_name,
            responsibilities=section.responsibilities,
            parent_id=section.parent_id,
            depth=section.depth,
            status=section.status.value,
            status_label=section.status_label,
            plan=section.plan,
            principles=section.principles,
            plan_version=section.plan_version,
            updated_at=section.updated_at,
            is_final=section.is_final,
            has_plan=section.has_plan,
        )


class BlueprintOut(CamelModel):
    project_id: str
    name: str
    root_agent_id: str
    generated_at: float
    is_final: bool
    pending_agents: List[str]
    status_counts: Dict[str, int]
    sections: List[BlueprintSectionOut]
    markdown: str
    published_spec: str = ""
    is_published: bool = False

    @classmethod
    def from_domain(cls, blueprint: Blueprint, published_spec: str = "") -> "BlueprintOut":
        return cls(
            project_id=blueprint.project_id,
            name=blueprint.name,
            root_agent_id=blueprint.root_agent_id,
            generated_at=blueprint.generated_at,
            is_final=blueprint.is_final,
            pending_agents=blueprint.pending_agents,
            status_counts=blueprint.status_counts,
            sections=[
                BlueprintSectionOut.from_domain(section) for section in blueprint.sections
            ],
            markdown=blueprint.markdown,
            published_spec=published_spec,
            is_published=bool(published_spec.strip()),
        )
