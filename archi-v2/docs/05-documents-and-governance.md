# 05 — Documents and governance

## Two slots, always

Every agent owns exactly two documents, created with the agent in
`AgentRole.__post_init__` so an agent cannot exist without them:

| `doc_type` | Purpose |
|---|---|
| `principles` | Non-negotiable constraints, inherited context, boundaries. |
| `plan` | The agent's current dev plan. |

Both start empty. There is no endpoint that creates a third type, and the UI
has no affordance for one — v1's role-specific schemas and custom-document
modal are gone. Whether a slot has content is `is_populated`, not its
existence.

Every write appends to `versions[]` and bumps `version`; nothing is
overwritten in place, so "the current plan" always means the latest version of
the same document.

## Two ways to populate a slot

**1. Chat.** `DocumentStore` scans each agent reply for either form:

```
[DOC_UPDATE: plan | one-line content]

[DOC_UPDATE: plan]
multi-line markdown
[/DOC_UPDATE]
```

Only `principles` and `plan` match the pattern. The tag is stripped from the
text shown to the user and the content is written to that slot. A tagged
document that fails validation is dropped with a logged reason rather than
failing the whole chat turn — you still get the reply.

**2. Upload.** `POST /api/projects/{id}/agents/{agentId}/documents/{docType}/upload`
takes a `.md` or `.txt` file up to `ARCHI_MAX_UPLOAD_BYTES` (512 KB default)
and writes it as a new version of that slot. Other extensions are rejected.

Both paths go through the same `DocumentPort`, server-side. In v1 these rules
lived in frontend validation and were bypassable by calling the API directly.

## Governance

`RuleBasedGovernanceAdapter` implements the port v1 declared but never
implemented. The checks are mechanical on purpose — reproducible and
explainable, no model in the loop — and **all** violations are returned, not
just the first.

On a submission (`validate_boundary`):

- Content shorter than 24 characters, or longer than 200,000.
- Authority claims: `"bypass review"`, `"skip supervisor approval"`,
  `"no review required"`, `"i approve my own"`.
- Foreign scope — *assigning work to* an agent that is not the author, one of
  its direct reports, or its parent. Assigning sideways across the tree is a
  boundary violation.

Foreign scope looks for assignment phrasing ("delegate X to Linus", "Linus
will…", "Owner: Linus"), not for the bare name. Blockquoted passages and
sections headed as context — parent plan, inherited, roster, direct reports,
background — are skipped entirely, because a handed-down plan quotes the peer
roster verbatim and those names are context the author did not write.

On a document write (`validate_document`), additionally:

- A `plan` must contain at least one heading or list item, otherwise it cannot
  be meaningfully delegated or diffed.
- `principles` must be at least two lines.

A failed submission raises `GovernanceRejectedError` and the API returns 400
with the list of violations, so the UI can show exactly what to fix.

## Degraded output

When the model is unavailable — no `GEMINI_API_KEY`, an API error, or a
response that skipped some direct reports — the deterministic offline
templates fill in and the response carries:

```json
"degradedInfo": { "degraded": true, "reason": "...", "provider": "offline" }
```

The UI surfaces it. The point is that a template is never silently passed off
as model output.
