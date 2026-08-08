"""The fallback chain must never disguise a template as model output."""

from __future__ import annotations

from typing import Dict, List

import pytest

from ...adapters.llm.fallback_chain import FallbackChainAdapter
from ...adapters.llm.gemini_adapter import GeminiUnavailableError
from ...adapters.llm.offline_adapter import OfflineAdapter
from ...core.domain.models import AgentRole
from ...core.ports.agent_port import AgentPort, LLMReply

pytestmark = pytest.mark.asyncio


class ExplodingAdapter(AgentPort):
    name = "exploding"

    async def chat(
        self, agent: AgentRole, history: List[Dict[str, str]], message: str
    ) -> LLMReply:
        raise GeminiUnavailableError("upstream returned 503")

    async def generate_architecture(self, agent: AgentRole, context: str) -> LLMReply:
        raise GeminiUnavailableError("upstream returned 503")


class HealthyAdapter(AgentPort):
    name = "healthy"

    async def chat(
        self, agent: AgentRole, history: List[Dict[str, str]], message: str
    ) -> LLMReply:
        return LLMReply(text="real answer", provider=self.name)

    async def generate_architecture(self, agent: AgentRole, context: str) -> LLMReply:
        return LLMReply(text="real blueprint", provider=self.name)


@pytest.fixture
def agent() -> AgentRole:
    return AgentRole(id="a", person_name="A", role_name="Role")


async def test_first_healthy_provider_wins(agent, settings) -> None:
    chain = FallbackChainAdapter([HealthyAdapter(), OfflineAdapter()], settings)
    reply = await chain.chat(agent, [], "hello")
    assert reply.provider == "healthy"
    assert not reply.degraded


async def test_failure_falls_through_and_records_the_reason(agent, settings) -> None:
    chain = FallbackChainAdapter([ExplodingAdapter(), HealthyAdapter()], settings)
    reply = await chain.generate_architecture(agent, "context")
    assert reply.provider == "healthy"
    assert reply.attempts[0]["error"] == "upstream returned 503"


async def test_offline_only_result_is_marked_degraded(agent, settings) -> None:
    chain = FallbackChainAdapter([ExplodingAdapter(), OfflineAdapter()], settings)
    reply = await chain.chat(agent, [], "hello")
    assert reply.provider == "offline"
    assert reply.degraded
    assert reply.reason


async def test_total_failure_is_reported_not_faked(agent, settings) -> None:
    chain = FallbackChainAdapter([ExplodingAdapter()], settings)
    reply = await chain.chat(agent, [], "hello")
    assert reply.degraded
    assert reply.provider == "none"
