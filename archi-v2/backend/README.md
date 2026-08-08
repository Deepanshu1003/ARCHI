# Backend

Dependency direction is inward: `api` → `agents` → `core`. `core` imports
nothing third-party, `adapters` implement `core/ports`, and only `api` knows
FastAPI exists.

```
core/       domain models, state machine, ports (interfaces only)
agents/     behavior: chat/draft, delegation, submission, planner, merger
adapters/   concrete ports: llm, memory, event_bus, governance, documents
api/        FastAPI app, routers, camelCase DTOs
config/     settings.py — the only place env vars are read
tests/      unit (no I/O) and integration (HTTP round-trips)
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | unset | Enables the Gemini provider; absent means offline answers |
| `ARCHI_GEMINI_MODEL` | `gemini-2.5-flash` | Model id |
| `ARCHI_LLM_PROVIDERS` | `gemini,offline` | Fallback chain order |
| `ARCHI_DATA_DIR` | `backend/data` | Where `projects.json` is written |
| `ARCHI_CORS_ORIGINS` | Vite dev origins | Allowed browser origins |
| `ARCHI_MAX_UPLOAD_BYTES` | 512 KiB | Upload ceiling |

## Run

```bash
uvicorn backend.api.main:app --reload --app-dir ..
```
