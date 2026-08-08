# core/ports

Abstract interfaces, no implementations. Everything above `core` depends on
these rather than on Gemini, the filesystem, or FastAPI.

| Port | Contract |
|---|---|
| `agent_port.py` | Chat / generate architecture, returning `LLMReply` (text + provider + `degraded`) |
| `delegation_port.py` | Divide a parent plan into per-report slices |
| `merge_port.py` | Fold an approved child slice back into the parent plan |
| `memory_port.py` | Load / save / delete projects |
| `governance_port.py` | Validate content against role boundaries and schema |
| `event_bus_port.py` | Publish slices downward, route approvals upward, diff text |
| `document_port.py` | Apply chat doc tags, accept uploads |

Swapping persistence for SQLite means writing one adapter behind
`memory_port.py`; nothing in `core`, `agents` or `api` changes.
