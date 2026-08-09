# 07 — Frontend

The frontend is a React 18 + TypeScript + Vite application.

It communicates with the FastAPI backend over HTTP/JSON and does not contain server-side application logic.

## Source layout

```text
frontend/src/
├── api/
│   ├── types.ts
│   ├── client.ts
│   ├── mappers.ts
│   └── index.ts
├── components/
├── utils/
├── types.ts
└── App.tsx
```

## API layer

`api/client.ts` is the network boundary.

It:

- calls the backend endpoints;
- handles non-2xx responses;
- exposes typed endpoint functions;
- converts unreachable-backend failures into `ApiError`.

A backend failure is surfaced to the UI instead of being replaced with fake architecture content.

## Data flow

The backend is the source of truth.

The application:

1. loads projects from the backend;
2. sends mutations through the API;
3. re-syncs project state after important mutations;
4. renders the server-confirmed state.

There is no durable localStorage shadow copy for project state.

## Mappers

`api/mappers.ts` handles remaining wire/UI representation differences, including timestamp conversion and status normalization.

Field names are already camelCase on both sides.

## API URL

The frontend reads:

```text
VITE_ARCHI_API_URL
```

and defaults to:

```text
http://localhost:8000
```

## Main components

| Component | Responsibility |
|---|---|
| `HomeView` | Project list, creation, import, overview, deletion |
| `SetupView` | Organization hierarchy editor |
| `DashboardView` | Agent workbench, chat, documents, lifecycle actions |
| `DiffModal` | Review diff and approval actions |
| `ProjectOverviewModal` | Project status roll-up |
| `AllAgentsDirectoryView` | Searchable agent directory |

## Dashboard responsibilities

The dashboard brings together:

- agent hierarchy;
- current lifecycle status;
- chat;
- principles;
- plan;
- draft;
- delegation;
- submission;
- approval;
- degraded-output notices.

## Error handling

API errors are surfaced to the application rather than silently ignored.

This is especially important for governance failures and lifecycle errors because the backend is responsible for enforcing those rules.

## Legacy UI workspaces

The frontend still contains several v1-era workspaces:

- `SprintPlanningWorkspace`
- `CodeRepositoryWorkspace`
- `CreateSprintFromArchitectureModal`
- `AgentCodingToolsModal`
- `utils/genesisDocuments.ts`

These are not backed by v2 persistence.

For a public repository, either remove them or explicitly label them as experimental/legacy UI to avoid implying that they are supported v2 features.

## Build and validation

```bash
cd archi-v2/frontend

npm run lint
npm run build
```

For local development:

```bash
npm run dev
```
