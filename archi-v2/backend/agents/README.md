# agents

Agent behavior, kept separate from the mechanics of talking to an LLM or a disk.
Reading `core/agent_behavior.py` should explain the decision flow without any
HTTP or persistence noise.

- `core/` — what every agent can do, derived from its position in the tree
- `planner/` — divides a parent plan into tailored sub-plans
- `merger/` — folds approved child work back into the parent plan

Planner and Merger sit behind `delegation_port` and `merge_port`, so a smarter
merge strategy is a new class, not a rewrite.
