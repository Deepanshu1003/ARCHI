"""Gemini implementation of AgentPort.

Failures are raised, not swallowed: the fallback chain decides what to do with
them, and the reason reaches the client instead of being replaced by prose that
looks like a real answer.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from typing import Dict, List

from ...config.settings import Settings, get_settings
from ...core.domain.models import AgentRole
from ...core.ports.agent_port import AgentPort, LLMReply

logger = logging.getLogger("archi.llm.gemini")

API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiUnavailableError(RuntimeError):
    """Raised when Gemini cannot answer: no key, transport error or empty reply."""


class GeminiAdapter(AgentPort):
    """Calls the Gemini generateContent REST endpoint over the standard library."""

    name = "gemini"

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    @property
    def is_configured(self) -> bool:
        return self.settings.has_gemini_key

    def _request(self, prompt: str, system_instruction: str) -> str:
        if not self.is_configured:
            raise GeminiUnavailableError("GEMINI_API_KEY is not configured.")

        contents: List[Dict[str, object]] = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": system_instruction}]})
            contents.append({"role": "model", "parts": [{"text": "Understood."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        url = f"{API_ROOT}/{self.settings.gemini_model}:generateContent"
        request = urllib.request.Request(
            url,
            data=json.dumps({"contents": contents}).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": self.settings.gemini_api_key,
            },
        )

        try:
            with urllib.request.urlopen(
                request, timeout=self.settings.gemini_timeout_seconds
            ) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:400]
            logger.warning("Gemini HTTP %s: %s", exc.code, detail)
            raise GeminiUnavailableError(f"Gemini returned HTTP {exc.code}: {detail}") from exc
        except Exception as exc:  # transport, timeout, malformed JSON
            logger.warning("Gemini call failed: %s", exc)
            raise GeminiUnavailableError(f"Gemini call failed: {exc}") from exc

        candidates = payload.get("candidates") or []
        if not candidates:
            raise GeminiUnavailableError("Gemini returned no candidates.")
        parts = candidates[0].get("content", {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts).strip()
        if not text:
            raise GeminiUnavailableError("Gemini returned an empty response.")
        return text

    @staticmethod
    def _persona(agent: AgentRole) -> str:
        return (
            f"You are {agent.person_name}, the {agent.role_name} on a software project.\n"
            f"Responsibilities: {agent.responsibilities or 'not yet specified'}.\n"
            "Stay strictly inside those responsibilities and answer as a systems architect."
        )

    async def chat(
        self, agent: AgentRole, history: List[Dict[str, str]], message: str
    ) -> LLMReply:
        transcript = "\n".join(
            f"{turn.get('role', 'user')}: {turn.get('content', '')}" for turn in history[-12:]
        )
        prompt = f"{transcript}\n\nuser: {message}" if transcript else message
        return LLMReply(text=self._request(prompt, self._persona(agent)), provider=self.name)

    async def generate_architecture(self, agent: AgentRole, context: str) -> LLMReply:
        instruction = (
            f"{self._persona(agent)}\n"
            "Produce a detailed markdown technical blueprint with clear section headings."
        )
        prompt = (
            f"Context:\n{context}"
            if context
            else "Define architecture principles, module boundaries, data models and interfaces."
        )
        return LLMReply(text=self._request(prompt, instruction), provider=self.name)
