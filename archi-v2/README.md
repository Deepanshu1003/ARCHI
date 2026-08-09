# ARCHI — Agentic Role-based Collaborative Hierarchical Infrastructure

ARCHI is an agentic architecture-planning system that models a software organization as a hierarchy of AI agents.

A root architect creates a system blueprint, delegates responsibility to direct reports, each agent refines its assigned slice, and supervisors review and merge submitted work. The final blueprint is assembled from work that was explicitly delegated and reviewed.

The project is designed around **deterministic state transitions, server-side governance, provider fallbacks, and clear separation between domain logic and infrastructure**.

## Architecture at a glance

```text
Browser
   │ HTTP / JSON
   ▼
React + Vite (:5173)
   │
   ▼
FastAPI (:8000)
   │
   ├── Core domain + state machine
   ├── Agent behavior
   ├── Planner / Merger
   └── Adapters
        ├── Gemini
        ├── Offline fallback
        ├── JSON persistence
        ├── Governance
        ├── Documents
        └── Event bus
```

ARCHI v2 uses a **single long-running FastAPI backend**. There is no Node/Express gateway or Python subprocess in the request path.

## Repository layout

```text
.
├── archi-v2/
│   ├── backend/        # Python + FastAPI backend
│   ├── frontend/       # React + TypeScript + Vite frontend
│   ├── docs/           # Technical documentation
│   ├── samples/        # Example project data
│   ├── .env.example    # Environment configuration template
│   └── pytest.ini
└── README.md
```

## Key capabilities

- **Hierarchical agent organization** — capabilities are derived from tree position.
- **Architecture drafting** — agents can generate and refine technical plans.
- **Delegation** — supervisors split a plan into tailored slices for direct reports.
- **Review and approval** — submitted slices are reviewed before being merged.
- **Stable merges** — re-approval replaces an agent's existing section instead of duplicating it.
- **Two server-managed documents per agent** — `principles` and `plan`.
- **Governance enforcement** — scope, authority, content length, and document structure are checked server-side.
- **LLM fallback chain** — Gemini is attempted first, followed by a deterministic offline provider.
- **Explicit degradation** — template output is marked as degraded rather than presented as model output.
- **Durable project state** — in-memory state is mirrored to `backend/data/projects.json` using atomic writes.
- **Import/export** — organization structures can be moved through JSON.

## Quick start

### Requirements

- Python 3.10+
- Node.js 18+
- A Gemini API key is optional.

Without `GEMINI_API_KEY`, ARCHI uses its deterministic offline provider. Offline responses are explicitly marked as degraded.

### Backend

```bash
cd archi-v2

python3 -m venv .venv
source .venv/bin/activate

pip install -r backend/requirements.txt

uvicorn backend.api.main:app --reload --app-dir .
```

Backend:

- API: `http://localhost:8000`
- Interactive API documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### Frontend

Open a second terminal:

```bash
cd archi-v2/frontend

npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Configuration

Copy the example environment file:

```bash
cp archi-v2/.env.example archi-v2/.env
```

The most important settings are:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Enables Gemini |
| `ARCHI_GEMINI_MODELS` | Ordered Gemini model fallback list |
| `ARCHI_GEMINI_TIMEOUT` | Per-model Gemini request timeout |
| `ARCHI_GEMINI_THINKING_LEVEL` | Gemini 3 reasoning level |
| `ARCHI_GEMINI_DISCOVER_MODELS` | Filters configured models against the API's available models |
| `ARCHI_LLM_PROVIDERS` | Provider fallback order |
| `ARCHI_DATA_DIR` | Persistence directory |
| `ARCHI_CORS_ORIGINS` | Allowed browser origins |
| `ARCHI_MAX_UPLOAD_BYTES` | Maximum document upload size |
| `VITE_ARCHI_API_URL` | Backend URL used by the frontend |

The backend resolves configuration once per process. Restart the backend after changing environment variables.

## Tests and checks

```bash
cd archi-v2
pytest

cd frontend
npm run lint
npm run build
```

## Documentation

| Document | Purpose |
|---|---|
| [00 — Overview](archi-v2/docs/00-overview.md) | Architecture and design goals |
| [01 — Running](archi-v2/docs/01-running.md) | Installation, configuration, tests |
| [02 — Using the UI](archi-v2/docs/02-using-the-ui.md) | End-user workflow |
| [03 — Backend Architecture](archi-v2/docs/03-backend-architecture.md) | Backend layers and adapters |
| [04 — Agent Lifecycle](archi-v2/docs/04-agent-lifecycle.md) | State machine and capabilities |
| [05 — Documents & Governance](archi-v2/docs/05-documents-and-governance.md) | Document model and validation |
| [06 — API Reference](archi-v2/docs/06-api-reference.md) | HTTP endpoints and payloads |
| [07 — Frontend](archi-v2/docs/07-frontend.md) | Frontend architecture |

## Current limitations

The following legacy v1 UI workspaces remain visible in the frontend but are not backed by v2 persistence:

- Sprint Planning
- Code Repository
- AI Coding Tools

Their content should not be considered durable application state.

## Project status

ARCHI v2 is a functional local development prototype. It is suitable for experimentation, architecture demonstrations, and further extension.

For production deployment, the persistence layer, authentication/authorization, secret management, observability, rate limiting, and multi-user concurrency model should be strengthened.
