# agents/core

Behavior comes from tree position, not from a role name. There is no
`SupervisorAgent` class; an agent with `children_ids` can delegate and an agent
with a `parent_id` can submit upward.

- `agent_behavior.py` — chat and drafting. Builds context from the agent's own
  principles, its supervisor's plan, and its direct reports, then hands replies
  to the `DocumentPort` so `[DOC_UPDATE: ...]` tags are applied server-side.
- `delegation_capability.py` — refuses to run for a leaf or for an agent with no
  plan yet; otherwise calls the Planner and publishes the resulting slices.
- `submission_capability.py` — refuses to run for the root; validates against
  governance, then creates a pending approval for the supervisor.
