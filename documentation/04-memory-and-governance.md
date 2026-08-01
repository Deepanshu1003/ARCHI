# 04 — Memory Banks & Role-Based Schema Governance

## Role-Driven Memory Schemas

Each agent possesses an isolated Memory Bank validated against role-based schemas:

```mermaid
graph LR
    LLM[Agent Chat Response] --> Parser[Tag Parser]
    Parser -->|Valid Tag| Memory[Agent Memory Bank]
    Parser -->|Invalid Tag / Category| Quarantine[Quarantine / Review Queue]
    Memory --> ArchDoc[Architecture Doc]
    Memory --> DesignDoc[Component Design Doc]
    Memory --> ProceduralDoc[Procedural Log]
    Memory --> EpisodicDoc[Episodic Memory]
    Memory --> SprintDoc[Sprint Backlog]
```

### Memory Tag Processing
1. `[DOC_CREATE: Title | docType]` -> Creates new memory document matching role schema.
2. `[DOC_UPDATE: Title]` -> Updates document content.
3. `[DOC_DELETE: Title]` -> Soft-deletes document (archives with confirmation).
4. **Quarantine Gate**: Any tag failing role schema validation is placed in a quarantine state for human review rather than silently dropping or guessing content.
