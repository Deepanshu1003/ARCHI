"""Shared fixtures. Nothing here touches a network or a real LLM."""

from __future__ import annotations

from typing import Dict, List

import pytest

from ..config.settings import Settings, get_settings
from ..core.domain.models import AgentRole, ProjectArchitecture
from ..core.ports.agent_port import AgentPort, LLMReply


class ScriptedAgentAdapter(AgentPort):
    """An AgentPort that returns queued replies and records what it was asked."""

    name = "scripted"

    def __init__(self, replies: List[str] | None = None) -> None:
        self.replies = list(replies or [])
        self.prompts: List[str] = []

    def _next(self) -> str:
        return self.replies.pop(0) if self.replies else "scripted reply"

    async def chat(
        self, agent: AgentRole, history: List[Dict[str, str]], message: str
    ) -> LLMReply:
        self.prompts.append(message)
        return LLMReply(text=self._next(), provider=self.name)

    async def generate_architecture(self, agent: AgentRole, context: str) -> LLMReply:
        self.prompts.append(context)
        return LLMReply(text=self._next(), provider=self.name)


@pytest.fixture
def settings(tmp_path) -> Settings:
    base = get_settings()
    return Settings(
        gemini_api_key="",
        gemini_model=base.gemini_model,
        llm_provider_chain=["offline"],
        data_dir=tmp_path / "data",
        cors_origins=["http://localhost:5173"],
    )


@pytest.fixture
def project() -> ProjectArchitecture:
    """A three-agent tree: one root with two direct reports."""
    root = AgentRole(
        id="agent-root",
        person_name="Ada",
        role_name="Chief Architect",
        responsibilities="Overall system architecture",
        children_ids=["agent-api", "agent-ui"],
    )
    api = AgentRole(
        id="agent-api",
        person_name="Grace",
        role_name="Backend Lead",
        responsibilities="Backend services and data",
        parent_id="agent-root",
    )
    ui = AgentRole(
        id="agent-ui",
        person_name="Linus",
        role_name="Frontend Lead",
        responsibilities="Web client",
        parent_id="agent-root",
    )
    return ProjectArchitecture(
        project_id="project-test",
        name="Test Project",
        description="Fixture project",
        root_agent_id=root.id,
        agents={agent.id: agent for agent in (root, api, ui)},
    )
