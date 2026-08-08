# api/routers

| Route | Purpose |
|---|---|
| `GET/POST /api/projects` | List, create |
| `GET/PATCH/DELETE /api/projects/{id}` | Read, update roster, delete |
| `POST /api/projects/{id}/architecture/draft` | Agent drafts its own slice |
| `POST .../architecture/delegate` | Planner divides the plan downward |
| `POST .../architecture/submit` | Subordinate submits upward for review |
| `POST .../architecture/approve` | Merger folds the slice into the parent |
| `POST .../architecture/request-revision` | Send work back for another pass |
| `POST .../architecture/diff` | Unified diff between two texts |
| `POST /api/projects/{id}/chat` | Chat with an agent; doc tags applied here |
| `GET /api/projects/{id}/agents/{aid}/documents` | The agent's two slots |
| `POST .../documents/{docType}/upload` | Upload `.md`/`.txt` into a slot |

Invalid lifecycle transitions surface as `409`, governance rejections as `422`.
