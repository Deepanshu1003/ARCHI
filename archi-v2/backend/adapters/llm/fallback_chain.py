"""Provider chain implementing AgentPort.

Tries each configured provider in order and returns the first success. Adding a
provider is one new adapter plus one entry in ``ARCHI_LLM_PROVIDERS``.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Sequence

from ...config.settings import Settings, get_settings
from ...core.domain.models import AgentRole
from ...core.ports.agent_port import AgentPort, LLMReply
from .gemini_adapter import GeminiAdapter
from .offline_adapter import OfflineAdapter

logger = logging.getLogger("archi.llm.chain")


class FallbackChainAdapter(AgentPort):
    """Delegates to an ordered list of providers, recording every attempt."""

    name = "chain"

    def __init__(
        self, providers: Sequence[AgentPort] | None = None, settings: Settings | None = None
    ) -> None:
        self.settings = settings or get_settings()
        self.providers: List[AgentPort] = list(providers) if providers else self._build_default()

    def _build_default(self) -> List[AgentPort]:
        registry = {
            "gemini": lambda: GeminiAdapter(self.settings),
            "offline": lambda: OfflineAdapter(
                reason=(
                    "GEMINI_API_KEY is not configured."
                    if not self.settings.has_gemini_key
                    else "All configured providers failed."
                )
            ),
        }
        providers: List[AgentPort] = []
        for key in self.settings.llm_provider_chain:
            factory = registry.get(key)
            if factory is None:
                logger.warning("Unknown LLM provider '%s' in chain; skipping.", key)
                continue
            providers.append(factory())
        if not providers:
            providers.append(OfflineAdapter(reason="No providers configured."))
        return providers

    async def _run(self, method: str, *args) -> LLMReply:
        attempts: List[Dict[str, str]] = []
        for provider in self.providers:
            provider_name = getattr(provider, "name", provider.__class__.__name__)
            try:
                reply: LLMReply = await getattr(provider, method)(*args)
            except Exception as exc:
                logger.warning("Provider '%s' failed on %s: %s", provider_name, method, exc)
                attempts.append({"provider": provider_name, "error": str(exc)})
                continue
            reply.attempts = attempts + [{"provider": provider_name, "error": ""}]
            if reply.degraded and not reply.reason and attempts:
                reply.reason = attempts[-1]["error"]
            return reply

        reason = attempts[-1]["error"] if attempts else "No providers configured."
        return LLMReply(
            text="No intelligence provider was able to respond.",
            provider="none",
            degraded=True,
            reason=reason,
            attempts=attempts,
        )

    async def chat(
        self, agent: AgentRole, history: List[Dict[str, str]], message: str
    ) -> LLMReply:
        return await self._run("chat", agent, history, message)

    async def generate_architecture(self, agent: AgentRole, context: str) -> LLMReply:
        return await self._run("generate_architecture", agent, context)
