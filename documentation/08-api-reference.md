# 08 — REST API Reference & Request Contracts

## Express & FastAPI Endpoint Specification

### 1. Projects REST API (`server.ts`)

#### GET `/api/projects`
- **Description**: Returns all saved projects from disk (`/data/projects.json`).
- **Response**: `Project[]` array.

#### POST `/api/projects`
- **Description**: Saves or updates a project configuration.
- **Body**: `{ project: Project }`
- **Response**: `{ status: "ok", project: Project }`

#### DELETE `/api/projects/:id`
- **Description**: Deletes project by ID.
- **Response**: `{ status: "deleted", id: string }`

### 2. Multi-Agent AI API (`server.ts`)

#### POST `/api/chat`
- **Description**: Sends user prompt to specified agent context via Gemini 3.6 Flash.
- **Body**: `{ projectId: string, agentId: string, message: string }`
- **Response**: `{ reply: string, agent: AgentNode }`

#### POST `/api/delegate`
- **Description**: Performs top-down delegation from supervisor to direct reports.
- **Body**: `{ projectId: string, supervisorId: string, blueprintContent: string }`
- **Response**: `{ updatedProject: Project, summary: string }`

### 3. Python FastAPI Core Gateway (`backend_api/main.py`)

#### GET `/api/python/health`
- **Response**: `{ status: "ok", runtime: "Python 3.11+" }`

#### POST `/api/python/diff`
- **Body**: `{ parentContent: string, authorContent: string }`
- **Response**: `{ diffSummary: string }`
