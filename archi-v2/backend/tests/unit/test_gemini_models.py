"""Model-level fallback inside the Gemini adapter. No network is touched."""

from __future__ import annotations

from typing import Dict, List, Tuple

import pytest

from ...adapters.llm.gemini_adapter import (
    GeminiAdapter,
    GeminiFatalError,
    GeminiUnavailableError,
)
from ...config.settings import Settings
from ...core.domain.models import AgentRole


@pytest.fixture
def agent() -> AgentRole:
    return AgentRole(
        id="agent-api",
        person_name="Grace",
        role_name="Backend Lead",
        responsibilities="Backend services",
    )


def scripted(outcomes: Dict[str, object]) -> Tuple[GeminiAdapter, List[str]]:
    """An adapter whose model calls are replayed from `outcomes`, in key order."""
    seen: List[str] = []

    def call(model: str, prompt: str, system_instruction: str) -> str:
        seen.append(model)
        result = outcomes[model]
        if isinstance(result, Exception):
            raise result
        return str(result)

    adapter = GeminiAdapter(
        Settings(
            gemini_api_key="test-key",
            gemini_models=list(outcomes),
            gemini_discover_models=False,
        )
    )
    adapter._call_model = call
    return adapter, seen


async def test_first_working_model_wins(agent):
    adapter, seen = scripted({"new": "answer from new", "old": "unreached"})

    reply = await adapter.generate_architecture(agent, "context")

    assert reply.text == "answer from new"
    assert reply.provider == "gemini:new"
    assert seen == ["new"]


async def test_retired_model_falls_through_to_the_next(agent):
    adapter, seen = scripted(
        {
            "new": GeminiUnavailableError("new: HTTP 404: no longer available"),
            "old": "answer from old",
        }
    )

    reply = await adapter.chat(agent, [], "hello")

    assert reply.text == "answer from old"
    assert reply.provider == "gemini:old"
    assert seen == ["new", "old"]


async def test_bad_key_stops_after_the_first_model(agent):
    adapter, seen = scripted(
        {
            "new": GeminiFatalError("new: HTTP 403: API key not valid"),
            "old": "unreached",
        }
    )

    with pytest.raises(GeminiUnavailableError, match="403"):
        await adapter.chat(agent, [], "hello")
    assert seen == ["new"]


async def test_every_model_failing_reports_all_reasons(agent):
    adapter, seen = scripted(
        {
            "new": GeminiUnavailableError("new: HTTP 404"),
            "old": GeminiUnavailableError("old: HTTP 429"),
        }
    )

    with pytest.raises(GeminiUnavailableError) as exc:
        await adapter.chat(agent, [], "hello")

    assert "new: HTTP 404" in str(exc.value)
    assert "old: HTTP 429" in str(exc.value)
    assert seen == ["new", "old"]

async def test_models_the_key_cannot_serve_are_never_called(agent):
    adapter, seen = scripted({"retired": "unreached", "live": "answer from live"})
    adapter.settings = Settings(
        gemini_api_key="test-key", gemini_models=["retired", "live"]
    )
    adapter._available = {"live"}
 
    reply = await adapter.chat(agent, [], "hello")
 
    assert reply.provider == "gemini:live"
    assert seen == ["live"]

async def test_discovery_failure_falls_back_to_trying_every_model(agent):
    adapter, seen = scripted({"new": "answer from new"})
    adapter.settings = Settings(gemini_api_key="test-key", gemini_models=["new"])
    adapter._available = set()  # what a failed listing leaves behind
 
    reply = await adapter.chat(agent, [], "hello")
 
    assert reply.provider == "gemini:new"
    assert seen == ["new"]
 
 
def test_thinking_level_is_sent_only_to_gemini_3_models():
    adapter = GeminiAdapter(
        Settings(gemini_api_key="test-key", gemini_thinking_level="low")
    )
 
    assert adapter._generation_config("gemini-3.6-flash") == {
        "thinkingConfig": {"thinkingLevel": "low"}
    }
    assert adapter._generation_config("gemini-2.5-flash-lite") == {}
 
 

async def test_missing_key_never_calls_a_model(agent):
    adapter, seen = scripted({"new": "unreached"})
    adapter.settings = Settings(
        gemini_api_key="", gemini_models=["new"], gemini_discover_models=False
    )
    with pytest.raises(GeminiUnavailableError, match="GEMINI_API_KEY"):
        await adapter.chat(agent, [], "hello")
    assert seen == []
