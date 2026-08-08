"""Composition root: the only place that knows how the pieces fit together.

Long-lived collaborators (settings, repository, the LLM chain) are process
singletons. Everything that needs to see the whole project graph is built per
request by :func:`services_for`, bound to that project.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from fastapi import Depends, HTTPException, status

from ..adapters.documents.document_store import DocumentStore
from ..adapters.event_bus.event_bus import InProcessEventBus
from ..adapters.governance.governance_adapter import RuleBasedGovernanceAdapter
from ..adapters.llm.fallback_chain import FallbackChainAdapter
from ..adapters.memory.repository import JsonFileRepository
from ..agents.core.agent_behavior import AgentBehavior
from ..agents.core.delegation_capability import DelegationCapability
from ..agents.core.submission_capability import SubmissionCapability
from ..agents.merger.merger_agent import MergerAgent
from ..agents.planner.planner_agent import PlannerAgent
from ..config.settings import Settings, get_settings
from ..core.domain.models import AgentRole, ProjectArchitecture
from ..core.ports.agent_port import AgentPort
from ..core.ports.memory_port import MemoryPort


@lru_cache(maxsize=1)
def get_repository() -> MemoryPort:
    return JsonFileRepository(get_settings())


@lru_cache(maxsize=1)
def get_intelligence() -> AgentPort:
    return FallbackChainAdapter(settings=get_settings())


@dataclass
class ProjectServices:
    """Everything a request needs, wired against one project."""

    project: ProjectArchitecture
    repository: MemoryPort
    documents: DocumentStore
    behavior: AgentBehavior
    delegation: DelegationCapability
    submission: SubmissionCapability

    def agent(self, agent_id: str) -> AgentRole:
        try:
            return self.project.agent(agent_id)
        except KeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
            ) from exc

    async def save(self) -> None:
        await self.repository.save_project(self.project)


def services_for(
    project: ProjectArchitecture,
    repository: MemoryPort,
    intelligence: AgentPort,
    settings: Settings,
) -> ProjectServices:
    governance = RuleBasedGovernanceAdapter(project=project)
    documents = DocumentStore(governance=governance, settings=settings)
    event_bus = InProcessEventBus()
    return ProjectServices(
        project=project,
        repository=repository,
        documents=documents,
        behavior=AgentBehavior(
            intelligence=intelligence, documents=documents, governance=governance
        ),
        delegation=DelegationCapability(
            planner=PlannerAgent(intelligence=intelligence), event_bus=event_bus
        ),
        submission=SubmissionCapability(
            event_bus=event_bus, merger=MergerAgent(), governance=governance
        ),
    )


async def get_project_services(
    project_id: str,
    repository: MemoryPort = Depends(get_repository),
    intelligence: AgentPort = Depends(get_intelligence),
    settings: Settings = Depends(get_settings),
) -> ProjectServices:
    """Loads a project by path parameter and wires its services."""
    project = await repository.get_project(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown project '{project_id}'."
        )
    return services_for(project, repository, intelligence, settings)
