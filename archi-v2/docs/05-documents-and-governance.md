# 05 — Documents and Governance

## Two document slots

Every agent has exactly two server-managed documents:

| Type | Purpose |
|---|---|
| `principles` | Constraints, inherited context, and boundaries |
| `plan` | Current work owned by the agent |

Both are created when the agent is created.

There is no supported third document type.

## Versioning

Every accepted write creates a new document version.

The current document points to the latest version while previous versions remain available in `versions[]`.

This applies to both:

- chat-generated document updates;
- file uploads.

## Chat updates

The document adapter recognizes:

```text
[DOC_UPDATE: plan | content]
```

and:

```text
[DOC_UPDATE: plan]
content
[/DOC_UPDATE]
```

The supported document types are `principles` and `plan`.

After extraction:

1. the control tag is removed from the visible reply;
2. the content is validated;
3. the document is versioned;
4. the resulting document version is reported to the caller.

A failed document tag does not have to fail the entire chat response.

## Uploads

The upload endpoint accepts:

- `.md`
- `.txt`

The default maximum size is 512 KiB and can be changed with `ARCHI_MAX_UPLOAD_BYTES`.

Document rules are enforced server-side, so direct API calls cannot bypass the UI restrictions.

## Governance

Governance is intentionally rule-based rather than model-based.

That makes the checks:

- deterministic;
- reproducible;
- explainable;
- inexpensive.

The governance adapter returns all detected violations instead of stopping at the first one.

## Submission validation

A submitted plan is checked for:

### Content size

- minimum length: 24 characters;
- maximum length: 200,000 characters.

### Authority violations

Examples include claims such as:

```text
bypass review
skip supervisor approval
no review required
I approve my own
```

### Foreign scope

An agent must not assign work to an unrelated agent outside the permitted hierarchy.

The validator looks for assignment-style language rather than simply rejecting every mention of another agent's name.

Contextual sections such as inherited plans and rosters are treated differently from newly authored assignments.

## Document validation

In addition to submission rules:

### Plans

A plan must contain meaningful structure such as a heading or list item.

### Principles

Principles must contain at least two lines.

## Governance response

A rejected submission is returned as an HTTP 400 with the specific violation list.

This lets the UI show actionable feedback.

## Degraded output

When Gemini is unavailable, the offline adapter can generate deterministic content.

The response carries information similar to:

```json
{
  "degradedInfo": {
    "degraded": true,
    "reason": "...",
    "provider": "offline"
  }
}
```

The frontend displays this state so users can distinguish deterministic fallback content from model output.
