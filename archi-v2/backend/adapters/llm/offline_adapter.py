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

    @staticmethod
    def _quote(text: str) -> str:
        """Blockquotes inherited context so it reads as quoted, not authored."""
        return "\n".join(f"> {line}" for line in text.splitlines())

    async def chat(
        self, agent: AgentRole, history: List[Dict[str, str]], message: str
    ) -> LLMReply:
        # The prompt carries the agent's standing context; echoing it back would
        # dump the whole roster into the chat transcript.
        text = (
            f"**Offline response — no model was called.**\n\n"
            f"{agent.person_name} ({agent.role_name}) cannot answer without an LLM "
            "provider. Set `GEMINI_API_KEY` and restart the backend, or write the "
            "plan directly in the Raw Editor."
        )
        return LLMReply(text=text, provider=self.name, degraded=True, reason=self.reason)

    async def generate_architecture(self, agent: AgentRole, context: str) -> LLMReply:
        text = (
            f"# {agent.role_name} Blueprint (offline template)\n\n"
            f"> Generated without an LLM. Configure a provider for a real blueprint.\n\n"
            f"**Author**: {agent.person_name}\n"
            f"**Scope**: {agent.responsibilities or 'not yet specified'}\n\n"
            f"## Inherited context\n{self._quote(context) if context else '> None supplied.'}\n\n"
            "## Sections to complete\n"
            "1. Module boundaries and ownership\n"
            "2. Data models and persistence\n"
            "3. Interfaces and contracts\n"
            "4. Risks and open questions\n"
        )
        return LLMReply(text=text, provider=self.name, degraded=True, reason=self.reason)
