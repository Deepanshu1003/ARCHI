# 01 — Pure Python Clean Architecture Core

## Hexagonal Core (`backend/core/`)

The Python core implements clean hexagonal (Ports and Adapters) architecture in `backend/core/`.

### Directory Structure & Schemas
```
backend/core/
├── domain/
│   ├── models.py           # Core dataclasses: AgentRole, ArchitectureSlice, ProjectArchitecture
│   └── state_machine.py    # Deterministic AgentStateMachine
└── ports/
    ├── agent_port.py       # AI chat generation port
    ├── delegation_port.py  # Master blueprint slicing port
    ├── memory_port.py      # Persistence and memory port
    ├── governance_port.py  # Schema validation and policy port
    └── event_bus_port.py   # Messaging, diff calculation & review port
```

### Core Domain Models & Data Schemas

1. **`AgentRole`**
   - Fields: `id`, `person_name`, `role_name`, `responsibilities`, `parent_id`, `children_ids`, `status` (`IDLE`, `DRAFTING`, `DELEGATED`, `AWAITING_REVIEW`, `APPROVED`), `documents`, `chat_history`.
2. **`ProjectArchitecture`**
   - Fields: `project_id`, `name`, `root_agent_id`, `agents` (dict of ID -> `AgentRole`), `master_blueprint`, `domain_slices`, `genesis_documents`.
3. **`ArchitectureSlice`**
   - Fields: `agent_id`, `title`, `content`, `version`, `diff_summary`.
4. **`RoleDocumentSchema` & `RequiredDocumentType`**
   - Defines mandatory documentation requirements per agent role category (`architecture`, `design_principles`, `procedural`, `episodic`, `sprint_planning`).

### Persistence Tables & Storage Format
- **Storage File**: `/data/projects.json` (JSON array of project aggregates).
- **In-Memory Cache**: Maintained by `InMemoryRepository` (`backend/adapters/memory/in_memory_repository.py`) with synchronous disk flushing on every mutation.

