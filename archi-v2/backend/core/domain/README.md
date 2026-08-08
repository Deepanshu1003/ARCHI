# core/domain

Plain dataclasses and enums. No FastAPI, no Pydantic, no I/O — this layer can be
imported by anything and tested with no fixtures.

`models.py` holds `AgentRole`, `AgentDocument`, `ArchitectureSlice`,
`PendingApproval` and `ProjectArchitecture`. Two invariants live here rather
than in callers:

- `AgentRole.__post_init__` creates the two document slots (`principles`,
  `plan`) so no agent can exist without them.
- `AgentStatus.coerce` accepts either case. v1 persisted `"IDLE"` and compared
  against `"idle"`, silently resetting every agent's status on reload.

`state_machine.py` is the transition matrix. `IDLE → APPROVED` and
`DELEGATED → APPROVED` are rejected — v1 allowed both, so work could be approved
without ever being reviewed.
