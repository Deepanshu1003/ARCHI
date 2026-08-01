# 00 — System Overview & Architecture Rationale

## ARCHI: Agentic Role-based Collaborative Hierarchical Infrastructure

ARCHI is a multi-agent software engineering simulation platform designed to model, execute, and govern complex software engineering, architectural delegation, sprint planning, and code release workflows.

### The Two-Runtime Architecture & Ports

ARCHI enforces a strict separation between domain business logic and host environment integration via a two-runtime model communicating over HTTP REST:

1. **Node.js Express Host Server (`server.ts`)**
   - **Port**: `3000` (external container ingress).
   - **Responsibilities**: HTTP routing, static asset serving, disk persistence synchronization (`/data/projects.json`), and integration with Gemini (`@google/genai` SDK `gemini-3.6-flash`).
2. **Pure Python Domain Core Daemon (`backend/server.py`)**
   - **Port**: `3002` (internal background daemon spawned by Node on startup).
   - **Responsibilities**: Pure Python 3.11+ hexagonal core execution, state machine validation, diff calculation (`difflib.unified_diff`), and memory repository management.

```mermaid
graph TD
    Client[React 18 Workspace] -->|HTTP REST / Port 3000| Express[Node.js Express Server]
    Express -->|Google GenAI SDK| Gemini[Gemini 3.6 Flash API]
    Express -->|HTTP REST Boundary / Port 3002| PythonDaemon[Python Persistent Core Server]
    PythonDaemon -->|Domain Logic| StateMachine[Agent State Machine]
    PythonDaemon -->|Disk Persistence| ProjectsJSON[/data/projects.json]
```

### Persistence Architecture
- All user-created projects, agent hierarchy nodes, memory documents, genesis documents, and sprint milestones are durably persisted to disk at `/data/projects.json`.
- When the application restarts or reloads, projects are automatically reloaded from disk without loss of user effort.

### Why Runtimes Are Connected Only Through Ports
- **Decoupling**: The Python domain core never imports Node/Express modules or hardcodes Gemini dependencies.
- **Testability**: Pure Python ports allow running fast unit and integration tests without network access or API key dependencies.
- **Resilience**: If an external LLM service experiences high demand, fallback generators attached to ports fulfill requests seamlessly.

