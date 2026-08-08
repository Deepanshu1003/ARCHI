# 01 — Running it

Requirements: Python 3.10+ and Node 18+. No API key is required — without one
the offline provider answers and its output is marked degraded in the UI.

## 1. Backend — http://localhost:8000

From the repository root:

```bash
cd archi-v2
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.api.main:app --reload --app-dir .
```

`--app-dir .` matters: the app is imported as the `backend` package, so
uvicorn must start from `archi-v2/`, not from `archi-v2/backend/`.

Check it:

```bash
curl http://localhost:8000/api/health
# {"status":"ok","llmProviders":["gemini","offline"],
#  "geminiModels":["gemini-3.6-flash","gemini-3.5-flash","gemini-2.5-flash"],
#  "geminiConfigured":false}
```

Interactive API docs are at http://localhost:8000/docs.

## 2. Frontend — http://localhost:5173

In a second terminal:

```bash
cd archi-v2/frontend
npm install
npm run dev
```

Open http://localhost:5173. The UI reads `VITE_ARCHI_API_URL` and falls back
to `http://localhost:8000`.

## 3. Configuration

Copy `archi-v2/.env.example` to `archi-v2/.env` and set what you need;
everything is optional. The backend loads that file at startup, and a real
exported environment variable overrides whatever the file says.

| Variable | Default | Effect |
|---|---|---|
| `GEMINI_API_KEY` | unset | Enables the Gemini provider. Unset ⇒ offline fallback. |
| `ARCHI_GEMINI_MODELS` | `gemini-3.6-flash,gemini-3.5-flash,gemini-2.5-flash` | Models tried in order; first one that answers wins. |
| `ARCHI_GEMINI_MODEL` | unset | Legacy single-model pin; overrides the default list. |
| `ARCHI_GEMINI_TIMEOUT` | `20` | Per-call timeout, seconds. |
| `ARCHI_LLM_PROVIDERS` | `gemini,offline` | Fallback chain, tried in order. |
| `ARCHI_DATA_DIR` | `backend/data` | Where `projects.json` is written. |
| `ARCHI_CORS_ORIGINS` | localhost:5173 | Allowed browser origins. |
| `ARCHI_MAX_UPLOAD_BYTES` | `524288` | Upload size ceiling. |
| `VITE_ARCHI_API_URL` | `http://localhost:8000` | API base the UI calls. |

The backend reads the environment once per process (`get_settings()` is
cached), so changing a variable means restarting uvicorn.

## 4. Tests and checks

```bash
cd archi-v2 && pytest              # unit (no I/O) + integration (HTTP)
cd archi-v2/frontend
npm run lint                       # tsc --noEmit
npm run build                      # vite build
```

## 5. Where state lives

`archi-v2/backend/data/projects.json`, written through on every mutation via a
temp file plus atomic replace. Deleting it resets the app. The directory is
gitignored.
