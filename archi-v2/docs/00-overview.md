# 00 — Overview

ARCHI models a software organization as a tree of agents. A root architect
drafts a plan, divides it among direct reports, each report refines its slice
and submits it back up, and the supervisor reviews the diff and merges it.
The result is one blueprint assembled from work that was actually delegated.

## What runs

Two processes, nothing between them:

```
Browser ──HTTP/JSON──► FastAPI (:8000) ──► in-memory state ──► data/projects.json
   ▲                        │
   └── React + Vite (:5173) └── LLM chain: Gemini ─► offline fallback
```

The backend is pure Python. There is no Node in the request path, no
subprocess, and no bridge process.

## Why it was rebuilt

v1 put a Node/Express gateway in front of a Python daemon and spawned a fresh
interpreter per request, so in-memory state never survived a call. Rewriting
it around one long-running FastAPI process removed that class of bug outright,
and three others with it:

| v1 | v2 |
|---|---|
| Statuses persisted as `"IDLE"`, compared against `"idle"` — every agent silently reset to idle on reload | `AgentStatus.coerce()` accepts either case and rejects unknown values |
| `IDLE → APPROVED` and `DELEGATED → APPROVED` were both reachable | The transition matrix rejects them; approval must pass through review |
| Delegation was string templating — no model was ever called | `PlannerAgent` prompts the model and marks template output as degraded |
| Approval appended the child's text, duplicating it on re-approval | `MergerAgent` replaces the child's section in place |
| Governance was a port with no implementation | `GovernanceAdapter` enforces boundaries server-side |
| Document rules lived in frontend validation, bypassable via the API | `DocumentStore` enforces them behind the endpoint |

## Reading order

1. [01 — Running it](01-running.md) — setup and run commands.
2. [02 — Using the UI](02-using-the-ui.md) — the walkthrough.
3. [03 — Backend architecture](03-backend-architecture.md) — layers and ports.
4. [04 — Agent lifecycle](04-agent-lifecycle.md) — the state machine.
5. [05 — Documents and governance](05-documents-and-governance.md) — the two slots.
6. [06 — API reference](06-api-reference.md) — every endpoint.
7. [07 — Frontend](07-frontend.md) — components and the API client.
