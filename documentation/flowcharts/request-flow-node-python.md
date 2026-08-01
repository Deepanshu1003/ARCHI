sequenceDiagram
    autonumber
    participant Client as React SPA (Browser)
    participant Express as Node.js Express (Port 3000)
    participant Gemini as Google GenAI (gemini-3.6-flash)
    participant FastAPI as Python FastAPI Adapter
    participant Core as Pure Python Core

    Client->>Express: POST /api/chat
    Express->>Gemini: Prompt Agent Context
    Gemini-->>Express: Agent Response
    Express->>FastAPI: POST /api/python/diff
    FastAPI->>Core: Compute difflib.unified_diff
    Core-->>FastAPI: Diff Result
    FastAPI-->>Express: JSON Diff Response
    Express-->>Client: Updated Agent & Memory State
