# 07 — Frontend

React 18 + TypeScript + Vite + Tailwind. No server-side code — the old
`server.ts` Express gateway is gone, and `package.json` has only `dev`,
`build`, `preview`, `clean` and `lint` (`tsc --noEmit`).

## Layout

```
frontend/src/
├── api/            # the only network layer
│   ├── types.ts    # wire contracts, mirroring the backend DTOs
│   ├── client.ts   # fetch wrapper + one function per endpoint
│   ├── mappers.ts  # wire → UI translation
│   └── index.ts
├── components/
├── utils/
├── types.ts
└── App.tsx
```

## The API layer

`client.ts` is the only place the app calls `fetch`. Every non-2xx throws an
`ApiError` carrying the status and a readable message (FastAPI's validation
arrays are flattened into a sentence), and an unreachable backend throws too:

```ts
throw new ApiError(0, `Cannot reach the ARCHI backend at ${API_BASE_URL}`);
```

v1 caught failures and substituted plausible-looking architecture text, so a
broken backend looked like a working one. That is gone — a failure now reaches
`App.tsx` and renders as a red banner with a Retry button.

`saveProject()` is the one composite call: it tries `PATCH` and falls back to
`POST` only on a 404, so the caller does not have to know whether a project
exists yet.

`mappers.ts` handles the two remaining shape differences: timestamps are
seconds on the wire and milliseconds in the UI, and statuses are normalized to
the lowercase union in `types.ts`. Field casing needs no mapping — both sides
are camelCase.

`API_BASE_URL` comes from `VITE_ARCHI_API_URL`, defaulting to
`http://localhost:8000`; the typing lives in `src/vite-env.d.ts`.

## State ownership

The backend is the single source of truth. `App.tsx` loads projects on mount
and writes every mutation through the API; the localStorage shadow copy and
its boot-time reconciliation are deleted. `DashboardView` re-reads the project
from the server after each mutation (`syncFromServer()`) rather than patching
its local copy, so the screen always shows what was actually stored.

## Components

| Component | Role |
|---|---|
| `HomeView` | Project list, create (blank or JSON import), overview, delete. |
| `SetupView` | Org-chart editor: add/remove reports, edit persona/role/responsibilities, import/export JSON, zoom and density. |
| `DashboardView` | The workbench: agent tree, chat terminal, document tabs, draft/delegate/submit/approve actions, degraded-output notices. |
| `DiffModal` | Unified diff of a pending submission, with approve / request-revision. |
| `ProjectOverviewModal` | Roll-up of agents and statuses. |
| `AllAgentsDirectoryView` | Flat searchable agent list. |

## UI-only leftovers

`SprintPlanningWorkspace`, `CodeRepositoryWorkspace`,
`CreateSprintFromArchitectureModal`, `AgentCodingToolsModal` and
`utils/genesisDocuments.ts` are v1 features with no v2 backend. They still
render and are reachable from the dashboard, but nothing they produce is
persisted — it resets on reload. Either back them with endpoints or remove
them; leaving them as-is is the current, deliberate compromise.

Removed in v2: `services/api.ts` (replaced by `api/`), `utils/roleSchemas.ts`
(the two-slot schema is server-side now) and `AddDocumentModal.tsx` (no third
document type exists).
