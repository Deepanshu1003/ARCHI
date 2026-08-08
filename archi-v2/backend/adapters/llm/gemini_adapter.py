"""Gemini implementation of AgentPort.

Each configured model is tried in order (newest first) and the first one that
answers wins. Failures are raised, not swallowed: the provider chain decides
what to do with them, and the reason reaches the client instead of being
replaced by prose that looks like a real answer.
"""

from __future__ import annotations

import asyncio
import json
import logging
import urllib.error
import urllib.request
from typing import Dict, List, Tuple

from ...config.settings import Settings, get_settings
from ...core.domain.models import AgentRole
from ...core.ports.agent_port import AgentPort, LLMReply

logger = logging.getLogger("archi.llm.gemini")

API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"


# A bad key fails identically on every model, so retrying the rest is wasted
# latency. Anything else (model retired, not enabled for the key, quota,
# transient 5xx) is worth retrying on the next model.
FATAL_STATUS_CODES = (401, 403)
# A rejected key comes back as a 400 rather than a 401.
FATAL_DETAIL_MARKERS = ("API_KEY_INVALID", "API key not valid")


class GeminiUnavailableError(RuntimeError):
    """Raised when Gemini cannot answer: no key, transport error or empty reply."""


class GeminiFatalError(GeminiUnavailableError):
    """A failure that will repeat on every model, so the loop stops early."""


class GeminiAdapter(AgentPort):
    """Calls the Gemini generateContent REST endpoint over the standard library."""

    name = "gemini"

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    @property
    def is_configured(self) -> bool:
        return self.settings.has_gemini_key

    @property
    def models(self) -> List[str]:
        return self.settings.gemini_models

    def _call_model(self, model: str, prompt: str, system_instruction: str) -> str:
        contents: List[Dict[str, object]] = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": system_instruction}]})
            contents.append({"role": "model", "parts": [{"text": "Understood."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        url = f"{API_ROOT}/{model}:generateContent"
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
            logger.warning("Gemini %s HTTP %s: %s", model, exc.code, detail)
            message = f"{model}: HTTP {exc.code}: {detail}"
            fatal = exc.code in FATAL_STATUS_CODES or any(
                marker in detail for marker in FATAL_DETAIL_MARKERS
            )
            if fatal:
                raise GeminiFatalError(message) from exc
            raise GeminiUnavailableError(message) from exc
        except Exception as exc:  # transport, timeout, malformed JSON
            logger.warning("Gemini %s call failed: %s", model, exc)
            raise GeminiUnavailableError(f"{model}: {exc}") from exc

        candidates = payload.get("candidates") or []
        if not candidates:
            raise GeminiUnavailableError(f"{model}: returned no candidates.")
        parts = candidates[0].get("content", {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts).strip()
        if not text:
            raise GeminiUnavailableError(f"{model}: returned an empty response.")
        return text

    async def _request(self, prompt: str, system_instruction: str) -> Tuple[str, str]:
        """Returns (text, model) from the first model that answers."""
        if not self.is_configured:
            raise GeminiUnavailableError("GEMINI_API_KEY is not configured.")
        if not self.models:
            raise GeminiUnavailableError("No Gemini models are configured.")

        failures: List[str] = []
        for model in self.models:
            try:
                # urllib blocks, so keep it off the event loop.
                text = await asyncio.to_thread(
                    self._call_model, model, prompt, system_instruction
                )
            except GeminiFatalError as exc:
                raise GeminiUnavailableError(str(exc)) from exc
            except GeminiUnavailableError as exc:
                failures.append(str(exc))
                continue
            if failures:
                logger.info("Gemini fell back to '%s' after %d failure(s).", model, len(failures))
            return text, model

        raise GeminiUnavailableError("; ".join(failures))

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
        text, model = await self._request(prompt, self._persona(agent))
        return LLMReply(text=text, provider=f"{self.name}:{model}")

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
        text, model = await self._request(prompt, instruction)
        return LLMReply(text=text, provider=f"{self.name}:{model}")
