# 01 — Pure Python Clean Architecture Core

## Hexagonal Core (`backend/core/`)

The Python core implements clean hexagonal (Ports and Adapters) architecture. It resides in `backend/core/` and contains two main subdirectories:

### Directory Structure
```
backend/core/
├── domain/
│   ├── models.py           # Core dataclasses and enums
│   └── state_machine.py    # Deterministic AgentStateMachine
└── ports/
    ├── agent_port.py       # AI chat generation port
    ├── delegation_port.py  # Master blueprint slicing port
    ├── memory_port.py      # Persistence and memory port
    ├── governance_port.py  # Schema validation and policy port
    └── event_bus_port.py   # Messaging, diff calculation & review port
```

### Key Core Abstractions

1. **`backend/core/domain/models.py`**
   - Defines `AgentStatus` enum (`IDLE`, `DRAFTING`, `DELEGATED`, `AWAITING_REVIEW`, `APPROVED`).
   - Defines `AgentRole`, `ArchitectureSlice`, `ProjectArchitecture`, and `DiffReview` dataclasses.

2. **`backend/core/domain/state_machine.py`**
   - Enforces valid state transitions: `IDLE` -> `DRAFTING` -> `DELEGATED` -> `AWAITING_REVIEW` -> `APPROVED`.
   - Rejects illegal state skips by raising `ValueError`.

3. **`backend/core/ports/`**
   - Abstract base classes defining system interfaces. Adapters implement concrete behavior (e.g., `InMemoryEventBus`, `FastAPI` router adapter).

### FastAPI HTTP Gateway (`backend_api/main.py`)
The Python core is exposed to external HTTP callers (including Express) via a lightweight FastAPI gateway running on an internal port or endpoint.
