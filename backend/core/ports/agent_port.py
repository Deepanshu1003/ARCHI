# backend/core/ports/agent_port.py
"""
Agent Port Interface
Primary port for agent LLM interactions and architecture generation.
"""

from abc import ABC, abstractmethod
from typing import List, Dict
from ..domain.models import AgentRole


class AgentPort(ABC):
    """Abstract port for communicating with an agent intelligence backend."""

    @abstractmethod
    async def chat(self, agent: AgentRole, history: List[Dict[str, str]], message: str) -> str:
        """
        Sends a conversational message to the agent context and returns the response.
        
        :param agent: The AgentRole defining persona and responsibilities.
        :param history: List of conversation messages [{'role': 'user'|'agent', 'content': str}].
        :param message: The incoming user or system prompt.
        :return: Generated string response from the agent.
        """
        pass

    @abstractmethod
    async def generate_architecture(self, agent: AgentRole, context: str) -> str:
        """
        Generates domain architecture specifications for an agent given contextual input.
        
        :param agent: The AgentRole performing the architecture generation.
        :param context: System design specifications, guidelines, or constraints.
        :return: Markdown string representing the architecture specification.
        """
        pass
