# 🚀 ARCHI — Agentic Role-based Collaborative Hierarchical Infrastructure

An enterprise-grade full-stack AI organizational architecture management platform that empowers developers, team leads, and system architects to structure, edit, delegate, and collaborate with a multi-layered team of specialized AI agents.

---

## 📌 300-Character Project Summary

> **ARCHI is a full-stack multi-agent platform for collaborative software architecture. Powered by React, FastAPI, Gemini AI, and Python Clean Architecture, it enforces top-down direct-report delegation, bottom-up textual diff reviews, and deterministic state transitions across custom workforce hierarchies.**

---

## 🌟 Key Features & Core Capabilities

1. **Flexible Team Management & Three Configuration Modes**:
   - **Interactive Visual Tree Editor**: Manually update each member's Role Title, Persona Name, Domain Responsibilities, and parent-child hierarchy links.
   - **Upload JSON File**: Instantly load a `.json` configuration file to populate your complete agent hierarchy.
   - **Paste & Edit Raw JSON Modal**: Directly paste or tweak JSON code with live syntax validation and instant application.
   - **Export JSON & Copy Clipboard**: Export team structures as downloadable `.json` files or copy formatted JSON snippets.

2. **Hierarchical AI Workforce Architecture**:
   - **Head Architect (Alice)**: Oversees system-wide architectural strategy and master blueprint.
   - **Frontend & UI/UX Lead (Bob)**: Directs client architecture and component design.
     - **React & State Specialist (Frank)**: Component implementation & client state.
     - **Tailwind & Styling Specialist (Grace)**: Visual layouts & responsive grids.
   - **Backend Services Lead (Carol)**: Manages API endpoints, microservices, and business logic.
     - **Express Controller Specialist (Heidi)**: REST controllers & validation.
     - **Database Storage Specialist (Ivan)**: ORM schemas & SQL storage.
   - **Platform & DevOps Lead (Dave)**: CI/CD, container runtime, and Kubernetes.
     - **Cloud Runtime Specialist (Judy)**: Docker & Cloud Run container configurations.
   - **Architecture Governance Lead (Eve)**: Bounded context enforcement & security.
     - **Security & Compliance Specialist (Karl)**: OAuth, RBAC, and encryption.

3. **Strict Direct-Report Delegation Engine**:
   - Supervisors formulate master plans and delegate domain-tailored sub-plans **strictly to their direct reports**.
   - Sub-plans are automatically generated using **Gemini 3.6 Flash** (`gemini-3.6-flash`) with built-in high-demand fallback engines.

4. **Pure Python Clean Architecture Domain Core (`/backend/core/`)**:
   - Built according to **Hexagonal Architecture (Ports & Adapters Pattern)** with zero external framework dependencies.
   - Deterministic `AgentStateMachine` with formal lifecycle states (`IDLE`, `DRAFTING`, `DELEGATED`, `AWAITING_REVIEW`, `APPROVED`).
   - Abstract Ports for AI (`AgentPort`), Delegation (`DelegationPort`), Memory (`MemoryPort`), Governance (`GovernancePort`), and Events (`EventBusPort`).

5. **FastAPI Web Adapter & Event Bus Approval Engine**:
   - Production-ready FastAPI web adapter (`/backend/adapters/web/fastapi_adapter.py`) with Pydantic request models and CORS middleware.
   - Event Bus Approval Engine (`/backend/adapters/event_bus/in_memory_event_bus.py`) generating unified line-by-line textual diffs (`difflib.unified_diff`) for supervisor review.

6. **Sprint Planning Workspace & Real-World Deadline Tracking**:
   - Converts master blueprints and domain slices into structured Sprints with Epics and Subtasks.
   - Replaces abstract story points with concrete **Deadline Days** (1, 2, 3, 5, 7, 10, 14, 21 Days).
   - Head Architect 1-click auto-generation of sprint tasks across all direct report leads.

7. **Sub-Agent AI Coding Tools & Assistant Suite**:
   - Individual agents feature a dedicated coding tools modal (`AgentCodingToolsModal`).
   - **Code Copilot Boilerplate Generator**: Auto-generates TypeScript/React components or Express router controllers.
   - **Unit Test Runner Agent**: Auto-generates Vitest/Jest unit test suites verifying component and API state.
   - **Refactor Assistant**: Optimizes existing code for strict type safety and zero side-effects.
   - **Feature Branch PR Submitter**: Publishes code as feature branches directly to the central code repository.

8. **Unified Code Repository & AI Git Merge Agent**:
   - Central code repository workspace (`CodeRepositoryWorkspace`) displaying main branch code files and open PRs.
   - Side-by-side PR code diff viewer comparing feature branch changes against target `main`.
   - **Morgan (AI Git Merge Agent)**: Release & Git integration lead agent handling automated branch merges with real-time logs.

---

## 📋 JSON Configuration Specification

ARCHI uses a standardized JSON schema to represent team member personas, roles, and parent-child delegation links.

### Sample JSON Format (`archi-team-config.json`)

```json
{
  "name": "ARCHI Enterprise Cloud Architecture",
  "rootAgentId": "root-1",
  "agents": {
    "root-1": {
      "id": "root-1",
      "parentId": null,
      "roleName": "Head Architect",
      "personName": "Alice",
      "responsibilities": "Overall system topology, governance, and master blueprint.",
      "status": "idle",
      "childrenIds": ["lead-fe", "lead-be"]
    },
    "lead-fe": {
      "id": "lead-fe",
      "parentId": "root-1",
      "roleName": "Frontend & UI/UX Lead",
      "personName": "Bob",
      "responsibilities": "Client architecture, component libraries, and visual design.",
      "status": "idle",
      "childrenIds": ["spec-react"]
    },
    "spec-react": {
      "id": "spec-react",
      "parentId": "lead-fe",
      "roleName": "React & State Specialist",
      "personName": "Frank",
      "responsibilities": "Client state management and interactive UI components.",
      "status": "idle",
      "childrenIds": []
    },
    "lead-be": {
      "id": "lead-be",
      "parentId": "root-1",
      "roleName": "Backend Services Lead",
      "personName": "Carol",
      "responsibilities": "API routes, microservice boundaries, and business logic.",
      "status": "idle",
      "childrenIds": []
    }
  }
}
```

---

## 📁 Repository Directory Structure & Detailed File Map

```
.
├── archi-v2/
│   ├── backend/                    # Pure Python + FastAPI. Owns all state.
│   │   ├── core/                   # Domain models, state machine, ports (no third-party deps)
│   │   ├── agents/                 # Behavior: chat/draft, delegation, submission, planner, merger
│   │   ├── adapters/               # llm (gemini/offline/chain), memory, event_bus, governance, documents
│   │   ├── api/                    # FastAPI app, routers, camelCase DTOs
│   │   ├── config/settings.py      # The one place env vars are read
│   │   └── tests/                  # unit (no I/O) + integration (HTTP round-trips)
│   └── frontend/                   # React + Vite, calls FastAPI directly
│       └── src/api/                # Typed client: types.ts, client.ts, mappers.ts
│
├── documentation/                  # Long-form technical documentation
├── PROJECT_DOCUMENTATION.md        # Comprehensive Technical Specification & Master Manual
└── README.md                       # Project overview (this file)
```

---

## 📖 Complete Documentation

For detailed technical specifications, API schemas, domain models, state machine matrices, and step-by-step operating guides, refer to:
👉 **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)**

---

## 🚀 Quick Start & Execution

1. **Backend** (`http://localhost:8000`):
   ```bash
   cd archi-v2/backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   export GEMINI_API_KEY=...   # optional; without it the offline provider answers
   uvicorn backend.api.main:app --reload --app-dir ..
   ```

2. **Frontend** (`http://localhost:5173`):
   ```bash
   cd archi-v2/frontend
   npm install
   npm run dev
   ```

3. **Tests**:
   ```bash
   cd archi-v2 && pytest
   cd frontend && npm run lint && npm run build
   ```
