# 02 — Using the UI

Start both the backend and frontend as described in [01 — Running](01-running.md).

Open:

```text
http://localhost:5173
```

ARCHI has three main project screens:

```text
Home → Setup → Dashboard
```

The backend is the source of truth. State-changing actions are sent to the server rather than stored only in the browser.

## Step 1 — Create a project

From **Home**, select **Start a New Project**.

You can:

- create a blank project;
- provide an initial project name and description;
- import an organization structure as JSON.

A new blank project starts with one root agent.

If importing JSON, the structure needs a `rootAgentId` and an `agents` collection. **Export JSON** from an existing project is the easiest way to obtain a valid template.

## Step 2 — Build the hierarchy

The **Setup** screen is the organization-chart editor.

Each agent has:

- **Person Name / Persona**
- **Role / Title**
- **Responsibilities**

Responsibilities are important because they become model context and are also used by governance checks.

You can:

- add direct reports;
- remove an agent and its subtree;
- import JSON;
- edit JSON;
- export JSON;
- adjust tree density and zoom.

The root cannot be deleted.

### Capability rules

Capabilities come from tree position, not role title.

```text
children exist → may delegate
parent exists   → may submit upward
```

## Step 3 — Draft and delegate

### Draft

Select an agent and use **Build Architecture**.

The agent creates or updates its `plan` document and enters the drafting state.

You can refine the result through:

- the chat terminal;
- the Raw Editor.

### Delegate

For a supervisor with direct reports, select **Finalize & Delegate**.

The Planner:

1. reads the supervisor's plan;
2. reads the direct-report roster;
3. generates one slice per report;
4. writes the slices to the corresponding child plans;
5. updates the relevant lifecycle statuses.

If the model does not produce a valid slice for a report, ARCHI creates deterministic fallback content and marks the result as degraded.

## Step 4 — Submit

Select a subordinate agent and refine its assigned plan.

Use **Publish Domain Spec** to submit it to the supervisor.

Before creating the approval request, server-side governance checks the submission.

Examples of rejected content include:

- content that is too short;
- claims that bypass supervisor approval;
- assignments outside the agent's permitted hierarchy;
- structurally empty plans.

The UI receives the specific violation list so the author can correct the content.

## Step 5 — Review and approve

Select the supervisor.

Pending submissions appear with a **Diff** action.

The review flow is:

```text
Child submits
     ↓
Supervisor reviews diff
     ├── Request Revision → child drafts again
     └── Approve → child section merged into parent
```

Approval uses a stable section marker for each child. Re-approving a child therefore replaces that child's previous section rather than appending another copy.

If a replacement is materially shorter than the existing section, the merge can still occur but is reported as a conflict.

## Step 6 — Build Plan & Spec

The project-wide **Build Plan & Spec** view provides:

### Build Plan by Team

Shows the current plan for each agent in hierarchy order, including:

- responsibilities;
- status;
- principles;
- current plan.

### Public Domain Spec

Shows the published project specification.

The public specification cannot be published until the project reaches its required final state.

Publishing creates a frozen assembled markdown copy. Publishing again after later changes replaces the previous published copy.

## Documents

Every agent owns exactly two document slots:

| Document | Purpose |
|---|---|
| `principles` | Constraints, inherited context, and boundaries |
| `plan` | Current work owned by the agent |

Both start empty.

### Chat document updates

Agent replies can contain:

```text
[DOC_UPDATE: plan | one-line content]
```

or:

```text
[DOC_UPDATE: plan]
multi-line markdown
[/DOC_UPDATE]
```

The backend extracts the tag, writes the content to the requested slot, increments its version, and removes the control tag from the user-visible reply.

### File uploads

The document upload endpoint accepts:

- `.md`
- `.txt`

The default maximum size is 512 KiB.

Document writes are validated server-side and stored as new versions.

## What is not durable

The frontend still contains some legacy v1 workspaces:

- Sprint Planning
- Code Repository
- AI Coding Tools

These are not backed by the v2 backend and should not be treated as persisted application data.
