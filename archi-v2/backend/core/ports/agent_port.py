"""Port for talking to an agent intelligence backend (an LLM, or an offline stub)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List

from ..domain.models import AgentRole


@dataclass
class LLMReply:
    """A reply from an intelligence backend.

    ``degraded`` is True when no real model produced the text, so callers (and
    ultimately the UI) can tell a genuine answer from a canned one.
    """

    text: str
    provider: str
    degraded: bool = False
    reason: str = ""
    attempts: List[Dict[str, str]] = field(default_factory=list)


class AgentPort(ABC):
    """Abstract intelligence backend used by every agent."""

    @abstractmethod
    async def chat(
        self, agent: AgentRole, history: List[Dict[str, str]], message: str
    ) -> LLMReply:
        """Answers ``message`` in the persona of ``agent``."""

    @abstractmethod
    async def generate_architecture(self, agent: AgentRole, context: str) -> LLMReply:
        """Produces a markdown architecture specification for ``agent``."""
