# 00 — Overview

ARCHI models a software organization as a hierarchy of agents.

A supervisor creates a plan, delegates responsibility to direct reports, each report refines its assigned slice, and the supervisor reviews and merges the submitted work. The result is a project blueprint assembled through explicit delegation and review.

## Runtime architecture

```text
Browser
   │ HTTP / JSON
   ▼
React + Vite (:5173)
   │
   ▼
FastAPI (:8000)
   │
   ├── In-memory project state
   │        │
   │        └── write-through → backend/data/projects.json
   │
   └── LLM provider chain
            ├── Gemini
            └── deterministic offline fallback
```

There is no Node server in the v2 request path and no per-request Python subprocess.

## Why v2 was rebuilt

The v1 implementation had several architectural problems:

| Area | v1 problem | v2 approach |
|---|---|---|
| Runtime state | A fresh Python process could lose in-memory state between calls | One long-running FastAPI process owns state |
| Status persistence | Case mismatches could reset statuses | `AgentStatus.coerce()` normalizes persisted values |
| State transitions | Invalid approval paths were reachable | Central transition matrix |
| Delegation | String templating without a real model call | Planner agent + provider abstraction |
| Merge | Appending could duplicate approved work | Stable per-agent section replacement |
| Governance | Declared but not enforced | Server-side rule-based adapter |
| Documents | Frontend-only restrictions | Server-side two-slot document store |
| API/Domain boundary | HTTP concerns mixed with behavior | Thin API layer over agent services |

## Core design principles

### 1. Position determines capability

An agent's permissions are derived from the hierarchy:

- an agent with direct reports can delegate;
- an agent with a parent can submit upward;
- the root cannot submit;
- a leaf cannot delegate.

Role titles do not grant authority.

### 2. Domain logic is isolated

The `core` package contains domain models, state transitions, and abstract ports. It does not depend on FastAPI, Gemini, filesystem storage, or other infrastructure.

### 3. Infrastructure is replaceable

Concrete implementations live in adapters. The memory adapter can be replaced with a database implementation, and the LLM adapter can be replaced or extended without changing the domain behavior.

### 4. Degraded output is explicit

When Gemini cannot answer, the offline provider can produce deterministic output. That output is marked `degraded=true` so callers can distinguish it from model-generated content.

### 5. Server state is authoritative

The frontend does not own the durable project state. Mutations go to the backend, and the UI re-syncs from the server after state-changing operations.

## Recommended reading order

1. [01 — Running](01-running.md)
2. [02 — Using the UI](02-using-the-ui.md)
3. [03 — Backend Architecture](03-backend-architecture.md)
4. [04 — Agent Lifecycle](04-agent-lifecycle.md)
5. [05 — Documents & Governance](05-documents-and-governance.md)
6. [06 — API Reference](06-api-reference.md)
7. [07 — Frontend](07-frontend.md)
