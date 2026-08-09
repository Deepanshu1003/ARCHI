# 01 — Running ARCHI

## Requirements

- Python 3.10+
- Node.js 18+
- Gemini API key: optional

ARCHI can run without an API key. In that mode the deterministic offline provider is used and its responses are marked as degraded.

## 1. Start the backend

From the repository root:

```bash
cd archi-v2

python3 -m venv .venv
source .venv/bin/activate

pip install -r backend/requirements.txt

uvicorn backend.api.main:app --reload --app-dir .
```

`--app-dir .` is important because the application is imported as the `backend` package from the `archi-v2` directory.

Check the service:

```bash
curl http://localhost:8000/api/health
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

## 2. Start the frontend

In a second terminal:

```bash
cd archi-v2/frontend

npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend uses `VITE_ARCHI_API_URL`. If it is not set, it defaults to `http://localhost:8000`.

## 3. Configuration

Create a local environment file:

```bash
cp archi-v2/.env.example archi-v2/.env
```

### Backend variables

| Variable | Effective code default | Description |
|---|---:|---|
| `GEMINI_API_KEY` | unset | Enables Gemini |
| `ARCHI_GEMINI_MODELS` | configured default list | Ordered model fallback list |
| `ARCHI_GEMINI_MODEL` | unset | Legacy single-model override |
| `ARCHI_GEMINI_TIMEOUT` | `90` seconds | Per-model request timeout |
| `ARCHI_GEMINI_THINKING_LEVEL` | `low` | Gemini 3 reasoning level |
| `ARCHI_GEMINI_DISCOVER_MODELS` | `true` | Filters configured models using the API's model list |
| `ARCHI_LLM_PROVIDERS` | `gemini,offline` | Provider fallback order |
| `ARCHI_DATA_DIR` | `backend/data` | Directory for `projects.json` |
| `ARCHI_CORS_ORIGINS` | localhost + 127.0.0.1 Vite origins | Allowed browser origins |
| `ARCHI_MAX_UPLOAD_BYTES` | `524288` | Maximum upload size |

> The checked-in `.env.example` sets `ARCHI_GEMINI_TIMEOUT=60`. If you do not create a `.env`, the Python settings default is 90 seconds. This distinction is intentional in the documentation so the runtime default is not confused with the example configuration.

### Frontend variable

| Variable | Default | Description |
|---|---|---|
| `VITE_ARCHI_API_URL` | `http://localhost:8000` | Backend API base URL |

The backend reads configuration once per process. Restart uvicorn after changing environment variables.

## Gemini fallback behavior

The configured Gemini models are tried in order.

Model discovery can first remove models that the API key cannot call. A failed model can fall through to the next configured model. Authentication failures stop the Gemini model loop because retrying another model will not fix an invalid key.

For Gemini 3 models, the configured thinking level is sent when supported. If a model rejects the thinking parameter, ARCHI retries that model without the parameter.

If Gemini still cannot answer, the provider chain can fall back to the offline adapter.

## 4. Tests

Backend:

```bash
cd archi-v2
pytest
```

Frontend:

```bash
cd archi-v2/frontend
npm run lint
npm run build
```

## 5. Persistent state

The repository uses:

```text
archi-v2/backend/data/projects.json
```

as a write-through persistence mirror.

The in-memory repository is authoritative during runtime. Mutations are serialized under an async lock and written through a temporary file followed by an atomic replace.

The data directory is gitignored. Removing `projects.json` resets persisted project state.
