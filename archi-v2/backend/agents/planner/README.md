# agents/planner

v1 delegated by string-templating the parent plan into each child's document —
no model was ever called. The Planner is a real agent: it receives the parent
plan plus the roster of direct reports and asks the model for one tailored
sub-plan per report, tagged so the reply can be split reliably:

```
<<<AGENT:frontend-lead>>>
markdown sub-plan
<<<AGENT:backend-lead>>>
markdown sub-plan
```

Only tags matching a known direct report are accepted. Any report the model
skipped gets a structured fallback section, and the whole result is marked
`degraded` so the UI can say the plan is template-derived instead of pretending
it came from a model.
