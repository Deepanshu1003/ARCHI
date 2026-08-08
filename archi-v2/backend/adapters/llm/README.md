# adapters/llm

`fallback_chain.py` implements `AgentPort` by trying providers in the order from
`ARCHI_LLM_PROVIDERS` and returning the first success. Every failed attempt is
recorded on the reply, so a caller can see *why* it ended up offline.

- `gemini_adapter.py` — stdlib `urllib` call to the Generative Language API. It
  raises `GeminiUnavailableError` instead of returning canned text; deciding
  what to do about a failure is the chain's job, not the provider's.
- `offline_adapter.py` — deterministic, always available, always
  `degraded=True`. This is what makes the app usable without an API key without
  ever pretending template output is model output.
