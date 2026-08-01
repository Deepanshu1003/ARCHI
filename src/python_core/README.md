# Python Core - Modular Agent Architecture

This directory contains the Python core implementation of the Agentic Organization Architect. It translates the hierarchical organizational structure into pure Python modules, enabling headless orchestration, backend integration, and autonomous agent workflows.

---

## 🏗️ Architecture Overview

The Python core mirror the React frontend layout and follows a strict hierarchical tree:

```
src/python_core/
├── main.py                  # Entry point script executing the end-to-end multi-agent pipeline
├── README.md                # This documentation file
├── utils/                   # Shared utility modules
│   ├── memory_store.py      # Persistent JSON storage for messages, decisions, and prompt logs
│   └── llm_client.py        # Gemini AI SDK client and fallback simulator
└── agents/                  # Domain agent classes
    ├── head/                # Supervisor agent (Alice)
    ├── platform/            # Platform infrastructure sub-agents (Control, Memory, Governance)
    └── tools/               # Tool builder sub-agents (Grace, Henry)
```

---

## 🤖 How Agents are Created & Managed

1. **Instantiation**: Each agent is an instance of its domain class (e.g., `SupervisorAgent`, `ControlAgent`, `MemoryAgent`).
2. **Context Passing**: Sub-agents receive `supervisor_decisions` passed down from their parent during message processing.
3. **Memory Logging**: Every user input and AI reply is automatically logged into `MemoryStore` (`data/python_memory.json`).

---

## ⚙️ Running the Python Core Pipeline

Execute the main orchestrator script directly:

```bash
python3 src/python_core/main.py
```

This will:
1. Initialize the `MemoryStore`.
2. Instantiate Alice (Head Architect), Dave (Control), Eve (Memory), Frank (Governance), Grace (Code Specs), and Henry (API Adapters).
3. Process a sample user architectural prompt.
4. Delegate tasks downward through the team.
5. Save the complete project snapshot and event logs to `data/python_memory.json`.
