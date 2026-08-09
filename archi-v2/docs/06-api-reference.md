# 06 — API Reference

Base URL:

```text
http://localhost:8000
```

Interactive documentation:

```text
http://localhost:8000/docs
```

All API payloads use **camelCase** on the wire.

## Error conventions

| Status | Typical meaning |
|---|---|
| `400` | Invalid transition, governance rejection, invalid document operation |
| `404` | Project or agent not found |
| `409` | Resource conflict or premature publication |

## Health

### `GET /api/health`

Returns service and LLM configuration information.

Example shape:

```json
{
  "status": "ok",
  "llmProviders": ["gemini", "offline"],
  "geminiModels": [],
  "geminiConfigured": false,
  "geminiThinkingLevel": "low",
  "geminiTimeoutSeconds": 90.0
}
```

The actual `geminiModels` list reflects runtime configuration.

## Projects

### `GET /api/projects`

Returns all projects with their current agents, documents, slices, and pending approvals.

### `POST /api/projects`

Creates a project.

Typical request:

```json
{
  "name": "Payments platform",
  "description": "",
  "rootAgentId": "alice",
  "agents": [
    {
      "id": "alice",
      "personName": "Alice",
      "roleName": "Head Architect",
      "responsibilities": "Owns the system blueprint",
      "childrenIds": ["bob"]
    },
    {
      "id": "bob",
      "personName": "Bob",
      "roleName": "Frontend Lead",
      "responsibilities": "Owns the web client",
      "parentId": "alice"
    }
  ]
}
```

`projectId` may be generated when omitted.

### `GET /api/projects/{projectId}`

Returns one project.

### `PATCH /api/projects/{projectId}`

Partially updates project metadata or the organization structure.

Providing `agents` rebuilds the hierarchy.

### `DELETE /api/projects/{projectId}`

Deletes one project.

### `DELETE /api/projects`

Deletes all projects.

## Architecture operations

All architecture routes are under:

```text
/api/projects/{projectId}/architecture
```

### `POST /draft`

Request:

```json
{
  "agentId": "alice",
  "context": "optional additional instruction"
}
```

Creates or updates the agent's draft and moves the agent to `DRAFTING`.

### `POST /delegate`

Request:

```json
{
  "agentId": "alice"
}
```

Splits the supervisor's plan among direct reports.

### `POST /submit`

Request:

```json
{
  "agentId": "bob",
  "content": "optional replacement content"
}
```

Validates the subordinate's work and creates a pending approval.

### `POST /approve`

Request:

```json
{
  "supervisorId": "alice",
  "subordinateId": "bob"
}
```

Merges the subordinate's approved section into the supervisor's plan.

### `POST /request-revision`

Request:

```json
{
  "supervisorId": "alice",
  "subordinateId": "bob"
}
```

Clears the pending approval and returns the subordinate to drafting.

### `POST /diff`

Request:

```json
{
  "before": "...",
  "after": "...",
  "fromLabel": "current",
  "toLabel": "proposed"
}
```

Returns a unified diff. This endpoint does not mutate project state.

## Chat

### `POST /api/projects/{projectId}/chat`

Request:

```json
{
  "agentId": "bob",
  "message": "Tighten the caching section."
}
```

Returns the agent reply, document updates, and degradation information.

`[DOC_UPDATE]` tags are applied server-side and removed from the visible reply.

## Documents

### `GET /api/projects/{projectId}/agents/{agentId}/documents`

Returns exactly the two supported document slots.

Use `isPopulated` to distinguish an empty slot from a written document.

### `POST /api/projects/{projectId}/agents/{agentId}/documents/{docType}/upload`

Multipart upload with a `file` field.

Supported `docType` values:

```text
principles
plan
```

Supported file types:

```text
.md
.txt
```

Example:

```bash
curl -F file=@principles.md \
  http://localhost:8000/api/projects/p1/agents/bob/documents/principles/upload
```

## Shared shapes

### Agent

Common fields include:

```text
id
personName
roleName
responsibilities
parentId
childrenIds
status
decisions
isSupervisor
isSubordinate
chatHistory
documents
```

`isSupervisor` and `isSubordinate` are derived from the hierarchy.

### Document

```text
docType
agentId
title
content
version
updatedAt
isPopulated
versions
```

### Slice

```text
sliceId
agentId
title
domainScope
content
version
isFinalized
diffSummary
```

### Approval

```text
sliceId
supervisorId
authorId
title
content
diffText
version
isFinalized
createdAt
```

### Degraded information

```text
degraded
reason
provider
```

When `degraded` is true, the content should be treated as deterministic fallback output rather than model output.
