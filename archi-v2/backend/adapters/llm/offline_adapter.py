"""Deterministic offline backend, the last link in the provider chain.

Every reply it produces is marked ``degraded`` so no caller can mistake a
template for model output.
"""

from __future__ import annotations

from typing import Dict, List

from ...core.domain.models import AgentRole
from ...core.ports.agent_port import AgentPort, LLMReply


class OfflineAdapter(AgentPort):
    """Structured placeholder responses for local development and tests."""

    name = "offline"

    def __init__(self, reason: str = "No LLM provider available.") -> None:
        self.reason = reason

    async def chat(
        self, agent: AgentRole, history: List[Dict[str, str]], message: str
    ) -> LLMReply:
        text = (
            f"**Offline response — no model was called.**\n\n"
            f"{agent.person_name} ({agent.role_name}) received: \"{message}\"\n\n"
            f"Scope: {agent.responsibilities or 'not yet specified'}."
        )
        return LLMReply(text=text, provider=self.name, degraded=True, reason=self.reason)

    async def generate_architecture(self, agent: AgentRole, context: str) -> LLMReply:
        text = (
            f"# {agent.role_name} Blueprint (offline template)\n\n"
            f"> Generated without an LLM. Configure a provider for a real blueprint.\n\n"
            f"**Author**: {agent.person_name}\n"
            f"**Scope**: {agent.responsibilities or 'not yet specified'}\n\n"
            f"## Context\n{context or 'No context supplied.'}\n\n"
            "## Sections to complete\n"
            "1. Module boundaries and ownership\n"
            "2. Data models and persistence\n"
            "3. Interfaces and contracts\n"
            "4. Risks and open questions\n"
        )
        return LLMReply(text=text, provider=self.name, degraded=True, reason=self.reason)
