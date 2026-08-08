# ARCHI v2

Two trees, one process each:

```
archi-v2/
├── backend/   # Pure Python + FastAPI. Owns all state.
└── frontend/  # React + Vite. Talks to FastAPI over HTTP/JSON.
```

v1 ran Node/Express in front of a Python daemon and spawned a fresh interpreter
per request, so in-memory state died between calls. v2 has no Node in the
request path, no subprocesses, and no bridge: one long-running FastAPI process
holds the authoritative state and mirrors it to JSON on disk.

## Run it

```bash
# backend (http://localhost:8000)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY=...        # optional; without it the offline provider answers
uvicorn backend.api.main:app --reload --app-dir ..

# frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Point the UI elsewhere with `VITE_ARCHI_API_URL`; allow its origin with
`ARCHI_CORS_ORIGINS`.

## Tests

```bash
pip install -r backend/requirements.txt
pytest              # from archi-v2/
cd frontend && npm run lint && npm run build
```
