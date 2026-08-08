# 02 — Using the UI

Both processes must be running ([01 — Running it](01-running.md)). Open
http://localhost:5173.

The app has three screens: **Home** (project list) → **Setup** (build the org
chart) → **Dashboard** (do the work). Everything you do is written straight to
the backend; there is no local draft copy, so if a call fails you get a red
banner at the top of the window rather than content that only exists in your
browser.

## Step 1 — Create a project (Home)

Click **Start a New Project**, give it a name, and press **Create**. You get a
project with a single root agent — the Head Architect.

If you already have an org chart, paste it into the JSON box in the same
dialog. It needs `rootAgentId` and an `agents` map; export the shape from an
existing project first (Setup → **Export JSON**) if you want a template.

The Home screen also has, per project: **open**, **overview** (agent counts and
status roll-up), **edit team**, and **delete**. **Clear All Projects** wipes
everything on the server.

## Step 2 — Build the hierarchy (Setup)

The Setup screen is the org chart editor. For each agent card you set:

- **Person Name (Persona)** — who the agent is, e.g. `Bob`.
- **Role / Title** — e.g. `Frontend Lead`.
- **Responsibilities** — the agent's scope. This matters: it is fed to the
  model as context and it is what governance checks a submission against, so
  vague responsibilities produce vague plans.

**+ Direct Report** adds a child under that agent; the trash icon removes an
agent and its subtree. The root cannot be deleted. Zoom, density and
fit-to-screen controls are for large trees only; **Upload JSON File**,
**Paste/Edit JSON** and **Export JSON** move the structure in and out.

An agent's position in the tree — not its title — decides what it can do. An
agent with children can delegate; an agent with a parent can submit upward.

Click **Start Project** when the tree is right.

## Step 3 — Draft, delegate, review (Dashboard)

Pick an agent in the left-hand tree. The badge on each agent is its status:
**Idle → Drafting Spec → Delegated Down → Awaiting Review → Approved/Merged**.

### 3a. Draft

With the root selected, click **Build Architecture**. The agent writes its
plan into its `plan` document and moves to *Drafting Spec*. You can edit the
result directly in the **Raw Editor** tab, or talk to the agent in the
terminal panel to refine it.

### 3b. Delegate

Click **Finalize & Delegate** (only shown for agents that have direct
reports). The Planner splits the parent plan into one tailored sub-plan per
direct report and pushes it down; the supervisor becomes *Delegated Down* and
each report becomes *Drafting Spec* with its slice already in place.

If a reply or sub-plan came from the deterministic template instead of the
model — no API key, or the model skipped that report — an amber banner above
the workspace names the provider and the reason, and stays until you dismiss
it or switch agents. Do not treat a degraded slice as model output.

### 3c. Submit

Select a report, refine its slice (chat or Raw Editor), then click **Publish
Domain Spec**. Its status becomes *Awaiting Review* and a review request
appears on its supervisor.

Governance runs at this point. If the submission is empty, claims authority
the agent does not have, decides something outside its scope, or is
structureless, the submission is rejected with the specific reasons — server
side, so it cannot be skipped by calling the API directly.

### 3d. Review and approve

Select the supervisor. A purple **Diff: <name>** button appears for each
pending submission. Click it to see the unified diff of the supervisor's plan
before and after the merge, then **Approve** or **Request Revision**.

- **Approve** merges the child's section into the supervisor's plan and moves
  the child to *Approved/Merged*. Re-approving later replaces that same
  section instead of appending a second copy. If the new version is materially
  shorter than the section it replaces, the merge still applies but is flagged
  as a conflict for you to look at.
- **Request Revision** sends it back down to *Drafting Spec*.

Repeat up the tree; the root's plan becomes the assembled blueprint.

## Step 4 — Build Plan & Spec

**Build Plan & Spec** in the top bar opens the project-wide view, available
from every workspace. It has two tabs:

- **Build Plan by Team** — one section per agent in reporting order, indented
  by depth, showing that agent's responsibilities, status, principles and
  current plan. This is where the work is split by responsibility: each agent's
  section is exactly the slice it owns.
- **Public Domain Spec** — the frozen, published copy of that plan. Empty until
  you publish.

A banner at the top says whether the plan is **draft** or **final** and names
every agent still holding it up. A report's section is final once its
supervisor approves it; the root's is final once every descendant is approved
and the root holds the merged plan.

**Publish Domain Spec** is disabled while the plan is a draft, and the server
refuses the call too (HTTP 409) — so an incomplete plan can never be handed out
as final. Publishing freezes the assembled markdown as the public spec;
publishing again after further changes overwrites it. **Copy Markdown** and
**Download** export whichever tab you are on.

## Documents

Every agent has exactly two document tabs, both empty at creation:

- **Principles** — the constraints, inherited context and boundaries this agent
  must respect. The agent re-reads this every time it drafts or chats, so it is
  the place to put the rules you want obeyed.
- **Plan** — the work this agent owns, versioned on every write. It is filled
  automatically by **Build Architecture** (its own draft), by **Finalize &
  Delegate** on its supervisor (the slice handed down to it), and by an
  approval (the merged result on the supervisor). The **Build Plan** view is
  built from these plan slots, so anything written here shows up in the
  project-wide plan.

There is no way to add a third; the two slots are created server-side with the
agent. Populate them two ways:

1. **Chat.** Ask the agent for something and its reply is scanned for
   `[DOC_UPDATE: plan | ...]` (or the block form
   `[DOC_UPDATE: plan]...[/DOC_UPDATE]`). Tagged content is written into that
   slot and the version counter bumps.
2. **Upload.** The **Upload** button next to the tabs puts a `.md` or `.txt`
   file into the currently selected slot. Other extensions and files over
   512 KB are rejected.

Each tab shows its version number, and **Preview** / **Raw Editor** switch
between rendered markdown and editing.

## What is not persisted

The **Sprint Planning** and **Code Repository** workspaces, and the AI coding
tools modal, are UI-only leftovers from v1. They work in the browser but the
backend does not store them, so their contents disappear on reload. The agent
tree, statuses, documents, slices and approvals are all server-side and do
survive both a reload and a backend restart.
