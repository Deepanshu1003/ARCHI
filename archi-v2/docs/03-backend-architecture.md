# 03 — Backend Architecture

ARCHI's backend is organized around dependency direction:

```text
api/
  ↓
agents/
  ↓
core/
  ↑
adapters/
```

The concrete adapters implement ports defined by the core.

## Layers

### `core/`

Contains:

- domain models;
- lifecycle state machine;
- abstract ports.

The core does not depend on FastAPI, Gemini, filesystem storage, or other infrastructure.

This makes the domain rules independently testable.

### `agents/`

Contains application behavior:

- common agent behavior;
- delegation;
- submission;
- planning;
- merging.

Agents depend on core ports rather than concrete infrastructure.

### `adapters/`

Contains implementations for:

- LLM providers;
- persistence;
- event bus;
- governance;
- documents.

### `api/`

The only FastAPI-aware layer.

It provides:

- routers;
- dependency wiring;
- HTTP DTOs;
- error translation;
- health endpoint.

The API uses camelCase on the wire while Python code remains snake_case.

## Domain model

Important domain objects include:

- `AgentRole`
- `AgentDocument`
- `ArchitectureSlice`
- `PendingApproval`
- `ProjectArchitecture`
- `AgentStatus`
- `DocumentType`

Each agent is initialized with the two required document slots.

Persisted statuses are normalized through `AgentStatus.coerce()` rather than silently defaulting unknown values.

## Ports

The backend separates behavior from infrastructure through ports such as:

| Port | Responsibility |
|---|---|
| `AgentPort` | Chat and architecture generation |
| `DelegationPort` | Split a plan into child slices |
| `MergePort` | Merge approved child work |
| `MemoryPort` | Load/store projects and slices |
| `GovernancePort` | Validate bounded output |
| `EventBusPort` | Publish slices, approvals, and diffs |
| `DocumentPort` | Manage the two document slots |

## Planner

The Planner is a real application component.

It sends the parent plan and direct-report roster to the configured LLM and expects tagged sections:

```text
<<<AGENT:frontend-lead>>>
markdown sub-plan

<<<AGENT:backend-lead>>>
markdown sub-plan
```

Only IDs belonging to the known direct reports are accepted.

Missing reports receive deterministic fallback content and the overall result is marked degraded.

## Merger

The Merger avoids duplicate content by assigning each child a stable section marker:

```html
<!-- archi:section agent=frontend-lead -->
```

On re-approval, that section is replaced in place.

If the replacement is materially shorter than the section it replaces, ARCHI reports a conflict while still applying the merge.

## LLM provider chain

The default chain is:

```text
Gemini → offline
```

Gemini models are attempted in configured order. Model discovery can filter the list based on what the API key can actually call.

The Gemini adapter raises provider errors rather than generating fake fallback prose. The fallback chain decides whether to try another provider.

The offline adapter is deterministic and always reports degraded output.

## Persistence

The memory adapter uses:

```text
in-memory dictionary
       ↓
write-through JSON
       ↓
backend/data/projects.json
```

Writes are protected by an `asyncio.Lock` and use a temporary file plus `os.replace()`.

Serialization explicitly preserves:

- agent status;
- documents;
- document version history;
- architecture slices;
- pending approvals.

## Configuration

`config/settings.py` is the single configuration source.

`get_settings()` is cached for the lifetime of the process.

## Extending the backend

### Add a persistence backend

Implement `MemoryPort`, then wire the new adapter through dependency configuration.

### Add an LLM provider

Implement `AgentPort` and add the provider to the configured provider chain.

### Add a merge strategy

Implement `MergePort` without changing the API or domain model.

This is the primary architectural benefit of the port/adapter boundary.
