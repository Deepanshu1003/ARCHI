# 06 — API reference

Base URL `http://localhost:8000`. Everything is JSON, and every field on the
wire is **camelCase** — the translation happens once, in
`api/schemas/base.py`, not per endpoint. Interactive docs: `/docs`.

Errors: 400 for a rejected transition, governance violation or bad document
write (`detail` carries the reasons); 404 for a missing project or agent; 409
when creating a project id that already exists.

## Health

### `GET /api/health`

```json
{
  "status": "ok",
  "llmProviders": ["gemini", "offline"],
  "geminiModels": ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"],
  "geminiConfigured": false
}
```

## Projects

### `GET /api/projects`
Every project, fully expanded (agents, documents, slices, pending approvals).

### `POST /api/projects` → 201

```json
{
  "name": "Payments platform",
  "description": "",
  "rootAgentId": "alice",
  "agents": [
    { "id": "alice", "personName": "Alice", "roleName": "Head Architect",
      "responsibilities": "Owns the system blueprint", "childrenIds": ["bob"] },
    { "id": "bob", "personName": "Bob", "roleName": "Frontend Lead",
      "responsibilities": "Owns the web client", "parentId": "alice" }
  ]
}
```

`projectId` is optional and generated when omitted. Each agent is created with
its two empty document slots.

### `GET /api/projects/{projectId}`
### `PATCH /api/projects/{projectId}`
Partial update of `name`, `description`, `rootAgentId`, `agents`. Sending
`agents` rebuilds the tree.
### `DELETE /api/projects/{projectId}` → 204
### `DELETE /api/projects` → 204
Deletes everything.

## Architecture

All prefixed `/api/projects/{projectId}/architecture`.

### `POST /draft`
```json
{ "agentId": "alice", "context": "optional extra instruction" }
```
Returns `{ slice, agentStatus, governanceViolations, degradedInfo }`. Agent →
`DRAFTING`.

### `POST /delegate`
```json
{ "agentId": "alice" }
```
Planner divides the agent's plan among its direct reports. Returns
`{ supervisorId, recipients, slices, agentStatuses, degradedInfo }`. 400 if the
agent has no reports or no plan to divide.

### `POST /submit`
```json
{ "agentId": "bob", "content": "optional replacement content" }
```
Runs governance, then creates a pending approval on the supervisor. Returns
`{ approval, agentStatus }`. 400 with the violation list if governance rejects
it, or if the agent is the root and has nobody to submit to.

### `POST /approve`
```json
{ "supervisorId": "alice", "subordinateId": "bob" }
```
Merges the child's section into the supervisor's plan. Returns
`{ supervisorId, subordinateId, mergedContent, conflicts, summary, agentStatuses }`.
`conflicts` is non-empty when a re-approval materially shrinks the section it
replaces — the merge still applies. 400 if the subordinate has no submission
waiting in this supervisor's queue.

### `POST /request-revision`
```json
{ "supervisorId": "alice", "subordinateId": "bob" }
```
Subordinate → `DRAFTING`, pending approval cleared. 400 if there is no
submission waiting in this supervisor's queue.

### `POST /diff`
```json
{ "before": "...", "after": "...", "fromLabel": "current", "toLabel": "proposed" }
```
Returns `{ diff, hasChanges }`. Pure utility — no state changes.

## Chat

### `POST /api/projects/{projectId}/chat`
```json
{ "agentId": "bob", "message": "tighten the caching section" }
```
Returns `{ agentId, reply, documentsWritten, degradedInfo }`. `[DOC_UPDATE]`
tags in the reply are applied server-side and stripped from `reply`;
`documentsWritten` lists the resulting document versions.

## Documents

### `GET /api/projects/{projectId}/agents/{agentId}/documents`
Always returns exactly two documents. Use `isPopulated` to tell an empty slot
from a written one.

### `POST /api/projects/{projectId}/agents/{agentId}/documents/{docType}/upload`
`multipart/form-data` with a `file` field. `docType` is `principles` or `plan`.
`.md`/`.txt` only, up to `ARCHI_MAX_UPLOAD_BYTES`. Returns
`{ agentId, document }` with the new version appended.

```bash
curl -F file=@principles.md \
  http://localhost:8000/api/projects/p1/agents/bob/documents/principles/upload
```

## Shared shapes

**agent** — `id, personName, roleName, responsibilities, parentId, childrenIds,
status, decisions, isSupervisor, isSubordinate, chatHistory[], documents[]`.
`isSupervisor`/`isSubordinate` are derived from the tree, not stored.

**document** — `docType, agentId, title, content, version, updatedAt,
isPopulated, versions[]`.

**slice** — `sliceId, agentId, title, domainScope, content, version,
isFinalized, diffSummary`.

**approval** — `sliceId, supervisorId, authorId, title, content, diffText,
version, isFinalized, createdAt`.

**degradedInfo** — `degraded, reason, provider`. When `degraded` is true the
content came from a deterministic template, not a model.
