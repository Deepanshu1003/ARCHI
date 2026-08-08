# api

The only layer that imports FastAPI. Routers translate DTOs to domain calls and
back; the decision logic lives in `agents/`.

`main.py` wires CORS from settings, mounts the routers and exposes
`GET /api/health`. `deps.py` builds the repository, LLM chain and agent services
once per process and hands them to routers via `Depends`.
