# backend/adapters/agent/gemini_agent_adapter.py
"""
Gemini Agent Adapter implementing AgentPort
Interfaces with Google GenAI SDK or urllib REST fallback.
"""

import os
import json
import urllib.request
from typing import List, Dict
from ...core.ports.agent_port import AgentPort
from ...core.domain.models import AgentRole


class GeminiAgentAdapter(AgentPort):
    """Adapter connecting AgentPort to Gemini 2.5/3.6 Flash model with intelligent fallback."""

    def _call_gemini_api(self, prompt: str, system_instruction: str = "") -> str:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key or api_key in ("MY_GEMINI_API_KEY", "dummy"):
            return ""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        contents = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": system_instruction}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I am ready."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        data = json.dumps({"contents": contents}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                candidates = res_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except Exception as e:
            pass
        return ""

    async def chat(self, agent: AgentRole, history: List[Dict[str, str]], message: str) -> str:
        """Sends a conversational message to the agent context and returns the response."""
        sys_prompt = (
            f"You are {agent.person_name}, acting as the {agent.role_name} for a software project.\n"
            f"Responsibilities: {agent.responsibilities}.\n"
            f"Respond concisely, professionally, and focus on system architecture."
        )
        ai_reply = self._call_gemini_api(prompt=message, system_instruction=sys_prompt)
        if ai_reply:
            return ai_reply

        return (
            f"As {agent.person_name} ({agent.role_name}), I received your request: '{message}'.\n\n"
            f"Based on my responsibilities ({agent.responsibilities}), I am ensuring clean architecture, "
            f"modular boundary enforcement, and clear delegation protocols across our team."
        )

    async def generate_architecture(self, agent: AgentRole, context: str) -> str:
        """Generates domain architecture specifications for an agent given contextual input."""
        sys_prompt = (
            f"You are {agent.person_name}, the {agent.role_name}.\n"
            f"Scope: {agent.responsibilities}.\n"
            f"Generate a detailed, well-structured Markdown technical architecture blueprint."
        )
        prompt = f"Context: {context or 'Define overall architecture principles, microservice boundaries, data models, and API interfaces.'}"
        ai_spec = self._call_gemini_api(prompt=prompt, system_instruction=sys_prompt)
        if ai_spec:
            return ai_spec

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

