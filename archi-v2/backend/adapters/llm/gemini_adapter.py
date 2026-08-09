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
from typing import Dict, List, Set, Tuple

from ...config.settings import Settings, get_settings
from ...core.domain.models import AgentRole
from ...core.ports.agent_port import AgentPort, LLMReply

logger = logging.getLogger("archi.llm.gemini")

API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"

# thinkingLevel only exists on Gemini 3; sending it to a 2.x model is a 400.
THINKING_MODEL_PREFIX = "gemini-3"
VALID_THINKING_LEVELS = ("minimal", "low", "medium", "high")
 
 

# A bad key fails identically on every model, so retrying the rest is wasted
# latency. Anything else (model retired, not enabled for the key, quota,
# transient 5xx) is worth retrying on the next model.
FATAL_STATUS_CODES = (401, 403)
# A rejected key comes back as a 400 rather than a 401.
FATAL_DETAIL_MARKERS = ("API_KEY_INVALID", "API key not valid")

def _rejects_thinking_level(detail: str) -> bool:
    """True when the failure is the model refusing the thinking parameter."""
    return "HTTP 400" in detail and (
        "thinkingLevel" in detail or "thinking_level" in detail or "thinkingConfig" in detail
    )
 
 
class GeminiUnavailableError(RuntimeError):
    """Raised when Gemini cannot answer: no key, transport error or empty reply."""


class GeminiFatalError(GeminiUnavailableError):
    """A failure that will repeat on every model, so the loop stops early."""


class GeminiAdapter(AgentPort):
    """Calls the Gemini generateContent REST endpoint over the standard library."""

    name = "gemini"

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._available: Set[str] | None = None

    @property
    def is_configured(self) -> bool:
        return self.settings.has_gemini_key

    @property
    def models(self) -> List[str]:
        return self.settings.gemini_models

    def _list_available_models(self) -> Set[str]:
        """Model ids this key can actually call ``generateContent`` on.
 
        Asking the API beats trusting a hardcoded list: models get retired for
        new keys (as ``gemini-2.5-flash`` was) and the list differs per key.
        """
        request = urllib.request.Request(
            f"{API_ROOT}?pageSize=200",
            headers={"x-goog-api-key": self.settings.gemini_api_key},
        )
        with urllib.request.urlopen(
            request, timeout=self.settings.gemini_timeout_seconds
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return {
            str(entry.get("name", "")).removeprefix("models/")
            for entry in payload.get("models", [])
            if "generateContent" in (entry.get("supportedGenerationMethods") or [])
        }
 

    async def _reachable_models(self) -> List[str]:
        """Configured models, minus any the key cannot serve.
 
        Discovery is best effort: if the listing call fails we try everything,
        which is the pre-existing behaviour.
        """
        if not self.settings.gemini_discover_models:
            return list(self.models)
        if self._available is None:
            try:
                self._available = await asyncio.to_thread(self._list_available_models)
            except Exception as exc:
                logger.warning("Could not list Gemini models (%s); trying all configured.", exc)
                self._available = set()
        if not self._available:
            return list(self.models)
        reachable = [model for model in self.models if model in self._available]
        skipped = [model for model in self.models if model not in self._available]
        if skipped:
            logger.info("Skipping Gemini models this key cannot call: %s", ", ".join(skipped))
        return reachable or list(self.models)
 
    def _generation_config(self, model: str) -> Dict[str, object]:
        level = self.settings.gemini_thinking_level
        if not model.startswith(THINKING_MODEL_PREFIX) or level not in VALID_THINKING_LEVELS:
            return {}
        return {"thinkingConfig": {"thinkingLevel": level}}

    def _call_model(self, model: str, prompt: str, system_instruction: str) -> str:
        contents: List[Dict[str, object]] = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": system_instruction}]})
            contents.append({"role": "model", "parts": [{"text": "Understood."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        body: Dict[str, object] = {"contents": contents}
        generation_config = self._generation_config(model)
        if generation_config:
            body["generationConfig"] = generation_config

        try:
            return self._post(model, body)
        except GeminiUnavailableError as exc:
            # A model that rejects thinkingLevel is still usable without it;
            # every other failure falls through to the next model untouched.
            if not generation_config or not _rejects_thinking_level(str(exc)):
                raise
            logger.info("Retrying Gemini %s without a thinking level.", model)
            return self._post(model, {"contents": contents})
 
    def _post(self, model: str, body: Dict[str, object]) -> str:
        url = f"{API_ROOT}/{model}:generateContent"
        request = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
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
        for model in await self._reachable_models():
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
