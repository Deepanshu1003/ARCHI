# 07 — Frontend Architecture & UI Component Guide

## React 18 + Vite Workspace

The frontend is built using React 18, TypeScript, and Tailwind CSS.

### Key Components
- **`SetupView.tsx`**: Interactive tree builder, JSON upload, raw JSON editor modal, and JSON exporter.
- **`DashboardView.tsx`**: Main workspace housing agent memory tabs, chat pane, and action buttons.
- **`AllAgentsDirectoryView.tsx`**: Visual card directory of all agents with delegation state indicators.
- **`SprintPlanningWorkspace.tsx`**: Epics, subtasks, deadline days, and task completion metrics.
- **`CodeRepositoryWorkspace.tsx`**: Main branch file viewer, PR diff viewer, and Morgan Git Merge Agent interface.
- **`AgentCodingToolsModal.tsx`**: AI sub-agents (Code Copilot, Test Runner, Refactor Assistant, PR Submitter).
- **`DiffReviewModal.tsx`**: Supervisor side-by-side textual diff review modal.
