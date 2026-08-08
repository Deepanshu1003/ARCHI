"""Behaviour every agent has, regardless of its label in the tree.

An agent's capabilities come from its position: children mean it can delegate,
a parent means it can submit. ``role_name`` is a description for the LLM, never
a switch in the code.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List, Optional

from ...core.domain.models import (
    AgentDocument,
    AgentRole,
    ArchitectureSlice,
    ChatMessage,
    DocumentType,
    ProjectArchitecture,
)
from ...core.domain.state_machine import AgentStateMachine
from ...core.ports.agent_port import AgentPort
from ...core.ports.document_port import DocumentPort
from ...core.ports.governance_port import GovernancePort

logger = logging.getLogger("archi.agents.behavior")


@dataclass
class ChatOutcome:
    """What one chat turn produced."""

    reply: str
    degraded: bool = False
    reason: str = ""
    provider: str = ""
    documents_written: List[AgentDocument] = field(default_factory=list)


@dataclass
class DraftOutcome:
    """What one drafting run produced."""

    slice_data: ArchitectureSlice
    degraded: bool = False
    reason: str = ""
    provider: str = ""
    governance_violations: List[str] = field(default_factory=list)


class AgentBehavior:
    """Chat and drafting, shared by every agent in the tree."""

    def __init__(
        self,
        intelligence: AgentPort,
        documents: DocumentPort,
        governance: GovernancePort,
    ) -> None:
        self.intelligence = intelligence
        self.documents = documents
        self.governance = governance

    @staticmethod
    def _context_for(project: ProjectArchitecture, agent: AgentRole) -> str:
        """Assembles the standing context an agent should always be aware of."""
        parts: List[str] = []
        principles = agent.document(DocumentType.PRINCIPLES)
        if principles.is_populated:
            parts.append(f"## Your principles\n{principles.content}")

        supervisor = project.supervisor_of(agent.id) if agent.parent_id else None
        if supervisor is not None:
            parent_slice = project.domain_slices.get(supervisor.id)
            if parent_slice is not None:
                parts.append(
                    f"## Plan handed down by {supervisor.person_name}\n{parent_slice.content}"
                )
            elif project.master_blueprint:
                parts.append(f"## Master blueprint\n{project.master_blueprint}")

        if agent.children_ids:
            roster = "\n".join(
                f"- {report.person_name} ({report.role_name}): "
                f"{report.responsibilities or 'scope not specified'}"
                for report in project.direct_reports(agent.id)
            )
            parts.append(f"## Your direct reports\n{roster}")
        return "\n\n".join(parts)

    async def chat(
        self, project: ProjectArchitecture, agent: AgentRole, message: str
    ) -> ChatOutcome:
        """Answers a user message in the agent's persona and applies doc tags."""
        history = [
            {"role": turn.role, "content": turn.content} for turn in agent.chat_history
        ]
        context = self._context_for(project, agent)
        prompt = f"{context}\n\n## Message\n{message}" if context else message

        reply = await self.intelligence.chat(agent, history, prompt)
        cleaned, written = await self.documents.apply_chat_update(project, agent, reply.text)

        agent.chat_history.append(ChatMessage(role="user", content=message))
        agent.chat_history.append(ChatMessage(role="agent", content=cleaned))

        return ChatOutcome(
            reply=cleaned,
            degraded=reply.degraded,
            reason=reply.reason,
            provider=reply.provider,
            documents_written=written,
        )

    async def draft(
        self, project: ProjectArchitecture, agent: AgentRole, context: Optional[str] = None
    ) -> DraftOutcome:
        """Generates the agent's own plan and stores it as its current slice."""
        standing_context = self._context_for(project, agent)
        combined = "\n\n".join(part for part in (standing_context, context or "") if part)

        generated = await self.intelligence.generate_architecture(agent, combined)
        verdict = await self.governance.validate_boundary(agent, generated.text)

        slice_data = ArchitectureSlice(
            slice_id=f"slice-{agent.id}",
            agent_id=agent.id,
            title=f"{agent.role_name} Plan",
            domain_scope=agent.responsibilities,
            content=generated.text,
            version=self._next_version(project, agent.id),
            is_finalized=False,
        )
        project.domain_slices[agent.id] = slice_data
        agent.decisions = generated.text
        AgentStateMachine.on_draft(agent)

        return DraftOutcome(
            slice_data=slice_data,
            degraded=generated.degraded,
            reason=generated.reason,
            provider=generated.provider,
            governance_violations=verdict.violations,
        )

    @staticmethod
    def _next_version(project: ProjectArchitecture, agent_id: str) -> int:
        existing = project.domain_slices.get(agent_id)
        return existing.version + 1 if existing else 1
