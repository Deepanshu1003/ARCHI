# Python Core - Utils Module

This directory provides utility classes supporting state persistence, LLM connectivity, and memory logging.

---

## 🛠️ Files & Components

### 1. `memory_store.py` (`MemoryStore`)
- **Purpose**: Provides persistent disk storage for project hierarchies, agent states, chat histories, and prompt event logs.
- **File Location**: Writes to `data/python_memory.json`.
- **Key Methods**:
  - `save_project(project_data)`: Saves or updates a project JSON structure.
  - `log_event(event_type, agent_id, payload)`: Appends a timestamped log entry to the global log array.
  - `load_memory()`: Reads the memory JSON file from disk.

### 2. `llm_client.py` (`LLMClient`)
- **Purpose**: Interfaces with the Gemini API using `@google/genai` or falls back gracefully to structured mock responses if no key is configured.
- **Key Methods**:
  - `generate_response(system_instruction, history, user_message)`: Formats instructions and conversation history into a Gemini prompt and returns the output string.
