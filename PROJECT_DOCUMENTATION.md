# 🚀 ARCHI — Complete Technical Specification & Architectural Documentation

> **Agentic Role-based Collaborative Hierarchical Infrastructure**
> *Master System Manual, Multi-Agent Collaboration Protocol, Pure Python Clean Core, Sub-Agent AI Coding Suite & Unified Git Repository Engine*

---

## 📋 Table of Contents
1. [Executive Summary & Architectural Vision](#1-executive-summary--architectural-vision)
2. [Full-Stack System Topology & Technology Stack](#2-full-stack-system-topology--technology-stack)
3. [Organizational Hierarchy & Workforce Management](#3-organizational-hierarchy--workforce-management)
4. [Team Setup & JSON Configuration Specification](#4-team-setup--json-configuration-specification)
5. [Agent Memory Bank & Multi-Document Lifecycle](#5-agent-memory-bank--multi-document-lifecycle)
6. [Sprint Planning Workspace & Deadline Tracking](#6-sprint-planning-workspace--deadline-tracking)
7. [Sub-Agent AI Coding Tools & Assistant Suite](#7-sub-agent-ai-coding-tools--assistant-suite)
8. [Unified Code Repository & AI Git Merge Agent](#8-unified-code-repository--ai-git-merge-agent)
9. [Pure Python Clean Architecture Core (`backend/core/`)](#9-pure-python-clean-architecture-core-backendcore)
10. [Event Bus, Diff Engine & Supervisor Approvals](#10-event-bus-diff-engine--supervisor-approvals)
11. [Express API Server & Gemini Fallback Infrastructure](#11-express-api-server--gemini-fallback-infrastructure)
12. [Complete Data Schemas & TypeScript Interfaces](#12-complete-data-schemas--typescript-interfaces)
13. [REST API Reference & Request/Response Contracts](#13-rest-api-reference--requestresponse-contracts)
14. [Automated Integration Testing & Operating Guide](#14-automated-integration-testing--operating-guide)

---

## 1. Executive Summary & Architectural Vision

**ARCHI** (**A**gentic **R**ole-based **C**ollaborative **H**ierarchical **I**nfrastructure) is an enterprise-grade multi-agent software platform designed to model, simulate, govern, and execute complex software engineering, architectural delegation, sprint planning, sub-agent code generation, and unified release workflows.

Standard single-agent AI tools or flat multi-agent systems suffer from context dilution, uncoordinated outputs, and lack of accountability. ARCHI solves this by enforcing:

1. **Strict Organizational Hierarchy**: Agents are structured into supervisor and subordinate relationships. Supervisors formulate top-level strategy and delegate sub-tasks **strictly to direct reports**.
2. **Bottom-Up Textual Diff Review**: Subordinates complete domain implementations and submit them upward. Supervisors inspect line-by-line textual diffs (`difflib.unified_diff`) before merging.
3. **Isolated Memory Banks & Multi-Document Lifecycle**: Every agent maintains custom document stores (Architecture, Component Design, Procedural Log, Episodic Memory, Sprint Backlog) synchronized via LLM memory tags (`[DOC_CREATE]`, `[DOC_UPDATE]`, `[DOC_DELETE]`).
4. **Agile Sprint Planning with Real-World Deadlines**: Architectural blueprints translate into Epics and Subtasks evaluated using calendar **Deadline Days** (1, 2, 3, 5, 7, 10, 14, 21 Days) for clear timeline visibility.
5. **Sub-Agent AI Coding Suite**: Individual agents are equipped with specialized sub-agents: **Code Copilot Boilerplate Generator**, **Unit Test Runner Agent**, **Refactor Assistant**, and **Feature Branch PR Submitter**.
6. **Unified Code Repository & AI Git Merge Agent**: Central code repository hosting main branch code files, feature branch pull requests, side-by-side code diffs, and **Morgan (AI Git Merge Agent)** for automated release merges.
7. **Pure Python Hexagonal Clean Architecture Core**: Pure Python domain logic (`backend/core/`) operating with zero external third-party dependencies, guaranteeing deterministic state transitions (`IDLE` -> `DRAFTING` -> `DELEGATED` -> `AWAITING_REVIEW` -> `APPROVED`).

---

## 2. Full-Stack System Topology & Technology Stack

ARCHI operates as a hybrid full-stack system combining a responsive React 18 single-page app, an Express.js Node.js server proxy, a pure Python Clean Architecture core, and a FastAPI web adapter.

```
+-----------------------------------------------------------------------------------+
|                            ARCHI Frontend Workspace (React 18 + Vite)             |
|  - Setup Tree Editor (Visual Cards, Upload JSON, Paste Raw JSON)                  |
|  - Agent Memory Bank (Architecture, Component Design, Procedural, Episodic)       |
|  - Sprint Planning Workspace (Epics, Subtasks, Deadline Days)                     |
|  - AI Sub-Agent Coding Tools (Copilot, Test Runner, Refactor, PR Submitter)       |
|  - Unified Code Repository (Main Branch Explorer, PR Diffs, AI Git Merge Agent)   |
+-----------------------------------------------------------------------------------+
                                          |
                                HTTP REST / JSON Requests
                                          v
+-----------------------------------------------------------------------------------+
|                        Node.js Express API Server (server.ts)                     |
|  - Environment Port 3000 Binding                                                  |
|  - Project Disk Persistence (/data/projects.json)                                 |
|  - Gemini 3.6 Flash Multi-Agent Chat & Delegation Proxy                           |
|  - High-Demand Resilient Structured Fallback Generator                             |
+-----------------------------------------------------------------------------------+
                       /                                     \
                      v                                       v
+-----------------------------------+               +-------------------------------+
| Google GenAI SDK                  |               | Pure Python Domain Core       |
| (gemini-3.6-flash Model)          |               | (backend/core/ & python_core) |
+-----------------------------------+               | - Clean Architecture Ports    |
                                                    | - Deterministic State Machine |
                                                    | - FastAPI & Event Bus         |
                                                    +-------------------------------+
```

### Technology Stack Specifications
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React Icons, Motion animations.
- **Backend API**: Node.js, Express, ESBuild CommonJS target (`dist/server.cjs`).
- **Python Core**: Pure Python 3.11+, zero external dependencies, standard library (`dataclasses`, `enum`, `difflib`, `uuid`).
- **AI Model**: Google GenAI SDK (`@google/genai`) using alias `gemini-3.6-flash`.

---

## 3. Organizational Hierarchy & Workforce Management

ARCHI structures teams into supervisory levels to mirror real-world software engineering organizations:

### Standard 11-Agent Hierarchy Matrix
```
                            [ Alice: Head Architect ] (Root)
                                        |
      +---------------------+-----------+-----------+---------------------+
      |                     |                       |                     |
[ Bob: Frontend Lead ] [ Carol: Backend Lead ] [ Dave: DevOps Lead ] [ Eve: Governance Lead ]
      |                     |                       |                     |
  +---+---+             +---+---+                   |                     |
  |       |             |       |                   |                     |
[Frank] [Grace]       [Heidi] [Ivan]              [Judy]                [Karl]
 React   Tailwind     Express   DB                 Docker                Security
Spec.   Spec.        Spec.     Spec.              Spec.                 Spec.
```

### Agent Roles & Responsibilities Breakdown
1. **Alice (Head Architect)**: Root supervisor; defines overall system topology, governance, and master blueprints.
2. **Bob (Frontend & UI/UX Lead)**: Directs client architecture, component libraries, and visual design systems.
   - **Frank (React & State Specialist)**: Manages interactive React components, state hooks, and client state flow.
   - **Grace (Tailwind & Styling Specialist)**: Implements utility CSS styling, responsive layouts, and design tokens.
3. **Carol (Backend Services Lead)**: Oversees API routes, microservices, business logic, and backend controllers.
   - **Heidi (Express Controller Specialist)**: Writes Express REST API controllers, route handlers, and payload validation.
   - **Ivan (Database Storage Specialist)**: Designs database schemas, SQL queries, ORM mappings, and data persistence.
4. **Dave (Platform & DevOps Lead)**: Manages infrastructure, containerization, deployment pipelines, and environments.
   - **Judy (Cloud Runtime Specialist)**: Configures Docker containers, Cloud Run deployments, and runtime settings.
5. **Eve (Architecture Governance Lead)**: Enforces architectural boundaries, compliance, security, and quality gates.
   - **Karl (Security & Compliance Specialist)**: Handles authentication, OAuth, authorization policies, and data privacy.

---

## 4. Team Setup & JSON Configuration Specification

ARCHI provides four flexible modes in `SetupView.tsx` to configure, customize, and export agent workforces:

### A. Team Setup Modes
1. **Interactive Visual Tree Editor**: Modify Role Title, Persona Name, Domain Responsibilities, and parent-child links directly on visual cards.
2. **Upload JSON Configuration**: Upload a `.json` file conforming to the ARCHI JSON schema to instantiate team structures.
3. **Paste / Edit Raw JSON Modal**: Edit raw JSON directly in a monospaced code editor with instant syntax validation.
4. **Export JSON & Copy Clipboard**: Download formatted `<project-name>-team-config.json` files or copy JSON to clipboard.

### B. JSON Schema Specification
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
      "decisions": "",
      "chatHistory": [],
      "childrenIds": ["lead-fe", "lead-be", "lead-devops", "lead-gov"]
    },
    "lead-fe": {
      "id": "lead-fe",
      "parentId": "root-1",
      "roleName": "Frontend & UI/UX Lead",
      "personName": "Bob",
      "responsibilities": "Client architecture, component libraries, and visual design.",
      "status": "idle",
      "decisions": "",
      "chatHistory": [],
      "childrenIds": ["spec-react", "spec-tailwind"]
    }
  }
}
```

---

## 5. Agent Memory Bank & Multi-Document Lifecycle

Each agent maintains an isolated **Memory Bank** featuring multiple document categories:

| Document ID | Category | Purpose |
| :--- | :--- | :--- |
| `arch` | System Architecture | Technical specifications, domain models & interface ports. |
| `design` | Component Design | Component APIs, UI/UX layouts & payload contracts. |
| `procedural` | Procedural Log | Step-by-step execution history & technical decisions. |
| `episodic` | Episodic Memory | Retrospective notes, lessons learned & domain context. |
| `sprint` | Sprint Backlog | Sprint epics, subtask breakdown & deadline estimates. |

### Document Management & LLM Tags
- **Markdown Preview & Editing**: Real-time rendering with syntax highlighting and raw markdown editing.
- **Document CRUD**: Create custom documents, update contents, or delete obsolete files.
- **Export & Download**: 1-click copy markdown to clipboard or download `.md` file locally.
- **LLM Memory Tags**: Chat responses automatically parse special tags to update the agent's memory bank dynamically:
  - `[DOC_CREATE: Title] Content...` -> Creates a new custom document.
  - `[DOC_UPDATE: Title] Content...` -> Updates an existing document matching the title.
  - `[DOC_DELETE: Title]` -> Removes the specified document from memory.

---

## 6. Sprint Planning Workspace & Deadline Tracking

The **Sprint Planning Workspace** translates architectural specifications into actionable Agile execution cycles.

### Key Capabilities
- **Create Sprint from Architecture**: Automatically converts master blueprints or domain slices into structured Sprints.
- **1-Click Head Architect Task Generation**: Head Architect can auto-generate domain epics across all direct report leads simultaneously.
- **Hierarchical Epics & Subtasks**: Tasks are assigned to Domain Leads (e.g., Frontend Lead) who delegate subtasks to Specialists (e.g., React Specialist).
- **Deadline Days Effort Metric**: Replaces abstract story points with concrete **Deadline Days** (1, 2, 3, 5, 7, 10, 14, 21 Days).
- **Real-Time Progress & Velocity**: Dynamically calculates completed vs total deadline days and percentage progress.
- **Subtask Review & Execution Diffs**: Subtasks include execution diff previews for supervisor review and status transitions (`TODO` -> `IN_PROGRESS` -> `AWAITING_REVIEW` -> `DONE`).

---

## 7. Sub-Agent AI Coding Tools & Assistant Suite

Every agent workspace includes an **AI Coding Tools & Sub-Agents** modal (`AgentCodingToolsModal`) providing four specialized AI assistants:

```
+-----------------------------------------------------------------------------------+
|                         AI Coding Tools & Sub-Agents                              |
+-----------------------------------------------------------------------------------+
|  [ Sparkles Code Copilot ]   - Generates production TypeScript/React/Express code  |
|  [ Terminal Test Runner ]    - Generates Vitest & Jest unit test suites            |
|  [ Refresh Refactor Agent ]  - Optimizes code for type safety & zero side-effects   |
|  [ Git PR Submitter ]        - Publishes code as Feature Branch Pull Request       |
+-----------------------------------------------------------------------------------+
```

1. **Code Copilot (Boilerplate Generator)**:
   - Analyzes agent role and responsibilities.
   - Auto-generates full TypeScript React widgets, Express router controllers, or domain contracts.
2. **Test Runner Agent (Unit Test Suite Generator)**:
   - Auto-generates Vitest and Jest unit test suites.
   - Tests component state handlers, API mock routes, and domain invariants.
3. **Refactor Assistant**:
   - Refactors existing document code for strict type safety, zero side-effects, and clean architecture boundaries.
4. **Feature Branch PR Submitter**:
   - Publishes generated code as a feature branch PR (e.g., `feature/bob-frontend-ui`) to the central project repository.

---

## 8. Unified Code Repository & AI Git Merge Agent

The **Code Repository Workspace** (`CodeRepositoryWorkspace`) acts as the project's central revision control center.

### Core Features
- **Main Branch Explorer**: File explorer listing active project codebase files (`src/App.tsx`, `src/backend/server.ts`, `src/database/schema.sql`, etc.) with last update timestamps and author metadata.
- **Pull Requests Explorer**: Displays open and merged feature branch pull requests created by agents.
- **Side-by-Side Code Diff Viewer**: Compares feature branch additions line-by-line against `main`.
- **Git Merge Agent (Morgan)**: Dedicated AI Release & Git Integration Lead agent (`Morgan`).
- **1-Click Branch Merge**: Merges individual pull requests or executes bulk automated merges across all open PRs with live execution logs.
- **New Code File Creator**: Allows developers to add new files directly into the main repository.

---

## 9. Pure Python Clean Architecture Core (`backend/core/`)

The Python domain core contains zero external third-party framework dependencies, implementing clean hexagonal architecture:

```
backend/core/
├── domain/
│   ├── models.py           # AgentRole, ArchitectureSlice, ProjectArchitecture, AgentStatus
│   └── state_machine.py    # AgentStateMachine deterministic transition rules
└── ports/
    ├── agent_port.py       # AI chat & text generation interface
    ├── delegation_port.py  # Master blueprint slicing interface
    ├── memory_port.py      # Architecture slice & project persistence
    ├── governance_port.py  # Boundary & schema validation
    └── event_bus_port.py   # Downward delegation & upward diff publishing
```

### Agent Lifecycle State Machine (`AgentStatus`)
- `IDLE`: Initial unassigned state.
- `DRAFTING`: Actively drafting or refining domain slice.
- `DELEGATED`: Master plan locked; sub-plans delegated downward to direct reports.
- `AWAITING_REVIEW`: Slice published upward, awaiting supervisor approval.
- `APPROVED`: Approved and merged into parent architecture blueprint.

---

## 10. Event Bus, Diff Engine & Supervisor Approvals

The `InMemoryEventBus` (`backend/adapters/event_bus/in_memory_event_bus.py`) governs inter-agent messaging and diff reviews:

- **Unified Textual Diff (`difflib.unified_diff`)**:
  Computes line-by-line unified diffs comparing subordinate sub-plans against supervisor plans:
  ```python
  diff = difflib.unified_diff(
      parent_content.splitlines(keepends=True),
      author_slice.content.splitlines(keepends=True),
      fromfile=f"Supervisor ({supervisor_id}) Plan",
      tofile=f"Author ({author_slice.agent_id}) Sub-Plan",
  )
  slice_data.diff_summary = "".join(diff)
  ```
- **Supervisor Review & Approval**: Supervisors inspect diffs in a side-by-side modal and click **Approve & Merge** to incorporate changes into the aggregate architecture.

---

## 11. Express API Server & Gemini Fallback Infrastructure

The Express backend (`server.ts`) acts as the proxy server and data coordinator:

- **Disk Persistence**: Saves project configurations to `/data/projects.json`.
- **Gemini AI Proxy**: Invokes Google GenAI SDK (`gemini-3.6-flash`) with structured prompts.
- **High-Demand Fallback Generator**: If Gemini API keys are missing or 503 high-demand errors occur, the backend generates deterministic, high-quality domain sub-plans to ensure uninterrupted workspace operation.

---

## 12. Complete Data Schemas & TypeScript Interfaces

```typescript
export interface AgentDoc {
  id: string;
  title: string;
  filename: string;
  content: string;
  category: 'architecture' | 'component_design' | 'procedural_log' | 'episodic_memory' | 'sprint_planning' | 'custom';
  updatedAt: number;
}

export interface AgentNode {
  id: string;
  parentId: string | null;
  roleName: string;
  personName: string;
  responsibilities: string;
  status: 'idle' | 'drafting' | 'delegated' | 'awaiting_review' | 'approved';
  childrenIds: string[];
  decisions?: string;
  documents?: AgentDoc[];
  chatHistory?: ChatMessage[];
}

export interface SprintTask {
  taskId: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  deadlineDays: number;
  status: 'TODO' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'DONE';
  executionDiff?: string;
  subTasks: {
    subTaskId: string;
    title: string;
    assignedTo: string;
    assignedBy: string;
    deadlineDays: number;
    status: 'TODO' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'DONE';
    executionDiff?: string;
  }[];
}

export interface CodeFile {
  filePath: string;
  language: string;
  content: string;
  lastUpdatedBy: string;
  updatedAt: number;
}

export interface PullRequest {
  id: string;
  title: string;
  authorId: string;
  branchName: string;
  targetBranch: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED' | 'CONFLICT';
  codeFiles: CodeFile[];
  summary: string;
  createdAt: number;
  mergedAt?: number;
  mergedBy?: string;
}

export interface CodeRepository {
  mainBranch: CodeFile[];
  pullRequests: PullRequest[];
  gitMergeAgent: {
    id: string;
    personName: string;
    roleName: string;
    status: 'idle' | 'analyzing' | 'merging';
  };
}

export interface Project {
  id: string;
  name: string;
  rootAgentId: string;
  agents: Record<string, AgentNode>;
  pendingApprovals?: PendingApproval[];
  sprintTasks?: SprintTask[];
  codeRepository?: CodeRepository;
  createdAt?: number;
  updatedAt?: number;
}
```

---

## 13. REST API Reference & Request/Response Contracts

| Endpoint | Method | Payload / Description |
| :--- | :--- | :--- |
| `/api/projects` | `GET` | Fetches list of all saved projects from disk (`/data/projects.json`). |
| `/api/projects` | `POST` | Saves or updates a project configuration payload. |
| `/api/projects/:id` | `DELETE` | Deletes specified project by ID. |
| `/api/chat` | `POST` | Interacts with multi-agent Gemini AI (`agent`, `project`, `message`). |
| `/api/delegate` | `POST` | Executes top-down delegation strictly to direct report agents. |

---

## 14. Automated Integration Testing & Operating Guide

### Running Test Suite & Linter
```bash
# Run Pure Python Clean Core Integration Test
PYTHONPATH=. python3 backend/test_adapters.py

# Run Code Linter & Type Checker
npm run lint

# Build Applet Bundle
npm run build
```

### Step-by-Step Operating Instructions
1. **Launch App**: Run `npm run dev` and navigate to `http://localhost:3000`.
2. **Setup Team**: Create a new project or click "Edit Team" to modify agents, upload JSON, or paste raw JSON.
3. **Draft Architecture**: Select Head Architect (Alice) and generate the master architecture blueprint.
4. **Delegate Downward**: Click "Finalize & Delegate to Direct Reports" to slice tasks downward to Leads.
5. **Use AI Coding Tools**: Open "AI Coding Tools" on any agent node to generate boilerplate code, unit test suites, refactors, or submit pull requests.
6. **Sprint Planning**: Navigate to "Sprint Workspace" to create Sprints with deadline days and assign subtasks.
7. **Merge Code Branches**: Open "Code Repo & Merges" tab to view main files, side-by-side PR diffs, and invoke **Morgan (AI Git Merge Agent)** to merge feature branches into `main`.

---
