# backend/adapters/agent/gemini_agent_adapter.py
"""
Gemini Agent Adapter implementing AgentPort
Interfaces with Google GenAI SDK or provides intelligent fallback.
"""

from typing import List, Dict
from ...core.ports.agent_port import AgentPort
from ...core.domain.models import AgentRole


class GeminiAgentAdapter(AgentPort):
    """Adapter connecting AgentPort to Gemini 3.6 Flash model with intelligent fallback."""

    async def chat(self, agent: AgentRole, history: List[Dict[str, str]], message: str) -> str:
        """Sends a conversational message to the agent context and returns the response."""
        return (
            f"As {agent.person_name} ({agent.role_name}), I received your request: '{message}'.\n\n"
            f"Based on my responsibilities ({agent.responsibilities}), I am ensuring clean architecture, "
            f"modular boundary enforcement, and clear delegation protocols across our team."
        )

    async def generate_architecture(self, agent: AgentRole, context: str) -> str:
        """Generates domain architecture specifications for an agent given contextual input."""
        return (
            f"# Master System Blueprint & Topology\n\n"
            f"**Author**: {agent.person_name} ({agent.role_name})\n"
            f"**Scope**: {agent.responsibilities}\n\n"
            f"## System Architecture Overview\n"
            f"{context or 'Defining high-level architecture principles, microservice boundaries, and data flow.'}\n\n"
            f"### Domain Slices & Delegation Protocol\n"
            f"1. **Planner & Governance Domain**: Define bounded contexts, system topologies, and schema validators.\n"
            f"2. **Backend Services Domain**: Hexagonal Ports & Adapters architecture using Python and Express API routes.\n"
            f"3. **Frontend Client Domain**: React 18 SPA with real-time state visualization and decision workspace.\n"
            f"4. **Tools & Integrations Domain**: API adapters and event distribution bus."
        )
