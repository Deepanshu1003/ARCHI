# 03 — Backend architecture

Four layers, each depending only on the one below it:

```
api/       FastAPI routers + camelCase DTOs   ← the only FastAPI-aware layer
agents/    behavior: chat, delegate, submit, plan, merge
adapters/  concrete: gemini, offline, json store, event bus, governance, documents
core/      domain models + state machine + abstract ports  ← zero third-party deps
```

`core/` imports nothing outside the standard library, so the domain rules can
be unit-tested with no I/O, no key and no server. `agents/` depends on the
ports in `core/ports/`, never on a concrete adapter, which is why the LLM,
storage and merge strategy can all be swapped without touching behavior.

## core/domain

`models.py` holds plain dataclasses: `AgentRole`, `AgentDocument`,
`ArchitectureSlice`, `PendingApproval`, `ProjectArchitecture`, and the
`AgentStatus` / `DocumentType` enums.

Two invariants are enforced in the model rather than in callers:

```python
class AgentRole:
    def __post_init__(self):
        # an agent cannot exist without its two document slots
        self.documents = self.documents or empty_document_set(self.id)

class AgentStatus:
    @classmethod
    def coerce(cls, raw):        # accepts "IDLE" or "idle", raises on anything else
        ...
```

The second one is the v1 reload bug: statuses were written uppercase and read
lowercase, so every agent came back idle. Unknown values now raise instead of
silently defaulting.

`state_machine.py` is the transition matrix — see
[04 — Agent lifecycle](04-agent-lifecycle.md).

## core/ports

Seven abstract contracts:

| Port | Contract |
|---|---|
| `agent_port.py` | Ask a model for text. Returns `LLMReply(text, provider, degraded, reason, attempts)`. |
| `delegation_port.py` | Divide a parent plan into per-report slices. |
| `merge_port.py` | Merge an approved child slice into the parent's content. |
| `memory_port.py` | Load and store projects and slices. |
| `governance_port.py` | Validate an agent's output against its bounded context. |
| `event_bus_port.py` | Publish slices down, route approvals up, produce diffs. |
| `document_port.py` | List slots, apply chat updates, apply uploads. |

## agents/

`agents/core/` is behavior every agent shares, keyed off tree position rather
than role name:

- `agent_behavior.py` — chat and drafting. Builds context from the agent's own
  principles, its supervisor's plan (or the master blueprint at the root), and
  its direct reports, then applies any `[DOC_UPDATE]` tags in the reply.
- `delegation_capability.py` — refuses unless `children_ids` is non-empty and
  a plan exists, calls the Planner, publishes the slices down.
- `submission_capability.py` — refuses unless `parent_id` is set, runs
  governance, creates the pending approval; on approval calls the Merger.

`agents/planner/planner_agent.py` replaces v1's `slice_architecture()`, which
was pure string templating with no model call. It asks for one tagged block
per direct report and parses only ids it already knows:

```
<<<AGENT:frontend-lead>>>
markdown sub-plan for that report
```

Reports the model skipped get a deterministic template and the whole result is
marked `degraded`, so a template is never presented as model output.

`agents/merger/merger_agent.py` replaces the append-in-the-endpoint merge that
duplicated content on re-approval. Each child owns a stable marker in the
parent document:

```python
def _section_marker(agent):
    return f"<!-- archi:section agent={agent.id} -->"
```

An existing marked section is replaced in place. A replacement that is
materially shorter than what it overwrites still merges but is reported as a
conflict, rather than quietly discarding the supervisor's edits.

## adapters/

- **llm** — `fallback_chain.py` implements `AgentPort` by walking
  `ARCHI_LLM_PROVIDERS` (default `gemini,offline`) and returning the first
  success, recording each failed attempt on the reply.
  `gemini_adapter.py` calls the REST API via `urllib.request` and raises
  `GeminiUnavailableError` instead of returning canned text.
  `offline_adapter.py` is deterministic and always sets `degraded=True`.
- **memory** — `repository.py` keeps an in-memory dict as the source of truth
  and mirrors it to `data/projects.json` behind an `asyncio.Lock`, writing to a
  temp file and `os.replace`-ing it so a crash mid-write cannot truncate state.
  `serialization.py` round-trips the domain objects, statuses and version
  history included.
- **event_bus** — publishes slices downward, holds pending approvals on the
  project aggregate, and produces the unified diffs the review modal shows.
- **governance** — mechanical, reproducible checks: minimum length, authority
  claims (`"bypass review"`, `"i approve my own"`…), decisions about agents
  outside the author's subtree, plans with no structure, one-line principles.
  Every violation is returned, not just the first.
- **documents** — parses both `[DOC_UPDATE: plan | ...]` and the block form,
  enforces the `.md`/`.txt` and size limits, runs governance, then versions the
  write.

## api/

Thin routers over the agent layer. Casing is translated in exactly one place:

```python
class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True,
                              from_attributes=True)
```

Every DTO extends it, so HTTP is camelCase and Python stays snake_case with no
per-endpoint hand-translation — the v1 inconsistency.

`config/settings.py` is the only module that reads `os.environ`, cached with
`lru_cache` so configuration is resolved once per process.

## Swapping an implementation

Moving from JSON to Postgres is a new class implementing `MemoryPort` and one
line in `api/deps.py`. Nothing in `core/`, `agents/` or the routers changes.
The same holds for a new LLM provider (`AgentPort` + one entry in
`ARCHI_LLM_PROVIDERS`) and for a smarter merge strategy (`MergePort`).
