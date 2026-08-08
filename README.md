# ARCHI — Agentic Role-based Collaborative Hierarchical Infrastructure

ARCHI models a software organization as a tree of AI agents. A root architect
drafts a plan, divides it among its direct reports, each report refines its
slice and submits it back up, and the supervisor reviews the diff and merges
it. The result is one blueprint assembled from work that was actually
delegated, with a deterministic state machine and server-enforced boundaries
behind it.

## Repository layout

```
.
├── archi-v2/
│   ├── backend/    # Pure Python + FastAPI. One process, owns all state.
│   ├── frontend/   # React + Vite. Calls FastAPI directly over HTTP/JSON.
│   └── docs/       # Technical documentation
└── README.md
```

Everything lives under `archi-v2/`. The v1 tree — a Node/Express gateway
(`server.ts`) in front of a Python daemon, plus a duplicate `src/python_core/`
implementation — has been removed.

## Quick start

Python 3.10+ and Node 18+. No API key required; without one the deterministic
offline provider answers and its output is marked degraded.

```bash
# backend — http://localhost:8000
cd archi-v2
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.api.main:app --reload --app-dir .

# frontend — http://localhost:5173 (second terminal)
cd archi-v2/frontend
npm install && npm run dev
```

Full setup, configuration and the UI walkthrough:
[archi-v2/docs/01-running.md](archi-v2/docs/01-running.md) and
[archi-v2/docs/02-using-the-ui.md](archi-v2/docs/02-using-the-ui.md).

## What it does

- **Hierarchy you define.** Build the org chart in the UI, import it as JSON,
  or export it. Capability comes from tree position, not job title: an agent
  with reports can delegate, an agent with a parent can submit upward.
- **Planner.** Divides a supervisor's plan into one tailored sub-plan per
  direct report, parsing only ids it already knows.
- **Merger.** Merges an approved child slice into the parent under a stable
  section marker, replacing it in place on re-approval and flagging conflicts.
- **Two documents per agent.** `principles` and `plan`, created empty with the
  agent, populated by `[DOC_UPDATE: ...]` chat tags or `.md`/`.txt` uploads,
  versioned on every write, enforced server-side.
- **Governance that runs.** Length, authority claims, foreign-scope decisions
  and plan structure are checked before a submission is accepted, and every
  violation is reported.
- **Honest degradation.** Gemini first, deterministic offline templates
  second. Template output is always flagged, never passed off as a model's.
- **Durable state.** In-memory as the source of truth, mirrored to
  `backend/data/projects.json` via atomic write-through. Statuses survive a
  restart.

## Documentation

| | |
|---|---|
| [00 — Overview](archi-v2/docs/00-overview.md) | What runs, and why it was rebuilt |
| [01 — Running it](archi-v2/docs/01-running.md) | Setup, configuration, tests |
| [02 — Using the UI](archi-v2/docs/02-using-the-ui.md) | Screen-by-screen walkthrough |
| [03 — Backend architecture](archi-v2/docs/03-backend-architecture.md) | Layers, ports, adapters |
| [04 — Agent lifecycle](archi-v2/docs/04-agent-lifecycle.md) | The state machine |
| [05 — Documents & governance](archi-v2/docs/05-documents-and-governance.md) | The two slots and the rules |
| [06 — API reference](archi-v2/docs/06-api-reference.md) | Every endpoint |
| [07 — Frontend](archi-v2/docs/07-frontend.md) | Components and the API client |

## Tests

```bash
cd archi-v2 && pytest                          # 43 tests
cd archi-v2/frontend && npm run lint && npm run build
```
