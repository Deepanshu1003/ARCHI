# 02 — Organizational Hierarchy & Agent Tree

## Hierarchical Workforce Structure

ARCHI organizes software engineering agents into strict supervisor and subordinate relationships.

```mermaid
graph TD
    Alice["Alice (Head Architect)<br>ID: root-1"] --> Bob["Bob (Frontend Lead)<br>ID: lead-fe"]
    Alice --> Carol["Carol (Backend Lead)<br>ID: lead-be"]
    Alice --> Dave["Dave (DevOps Lead)<br>ID: lead-devops"]
    Alice --> Eve["Eve (Governance Lead)<br>ID: lead-gov"]

    Bob --> Frank["Frank (React Specialist)<br>ID: spec-react"]
    Bob --> Grace["Grace (Tailwind Specialist)<br>ID: spec-tailwind"]

    Carol --> Heidi["Heidi (Express Specialist)<br>ID: spec-express"]
    Carol --> Ivan["Ivan (DB Specialist)<br>ID: spec-db"]

    Dave --> Judy["Judy (Cloud Specialist)<br>ID: spec-cloud"]
    Eve --> Karl["Karl (Security Specialist)<br>ID: spec-security"]
```

### Delegation Protocol Rules
1. **Direct Report Scoping**: A supervisor delegates architectural sub-plans **strictly to direct reports** (`childrenIds`).
2. **Context Isolation**: Subordinate agents receive sliced instructions relevant to their specific domain rather than unfiltered system context.
3. **Upward Publishing**: Specialists publish completed domain slices upward to their immediate supervisor (`parentId`) for diff review.
