# ARCHI v2

```
archi-v2/
├── backend/   # Pure Python + FastAPI. Owns all state.
├── frontend/  # React + Vite. Talks to FastAPI over HTTP/JSON.
└── docs/      # Technical documentation
```

v1 ran Node/Express in front of a Python daemon and spawned a fresh
interpreter per request, so in-memory state died between calls. v2 has no Node
in the request path, no subprocesses, and no bridge: one long-running FastAPI
process holds the authoritative state and mirrors it to JSON on disk.

## Run it

```bash
# backend — http://localhost:8000
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.api.main:app --reload --app-dir .

# frontend — http://localhost:5173
cd frontend && npm install && npm run dev
```

`GEMINI_API_KEY` is optional; without it the offline provider answers and its
output is flagged as degraded. Copy `.env.example` for the rest of the knobs.

## Tests

```bash
pytest                                    # from archi-v2/
cd frontend && npm run lint && npm run build
```

## Docs

[00 overview](docs/00-overview.md) ·
[01 running](docs/01-running.md) ·
[02 using the UI](docs/02-using-the-ui.md) ·
[03 backend](docs/03-backend-architecture.md) ·
[04 lifecycle](docs/04-agent-lifecycle.md) ·
[05 documents & governance](docs/05-documents-and-governance.md) ·
[06 API](docs/06-api-reference.md) ·
[07 frontend](docs/07-frontend.md)
