# Python Core - Head Agent Module

Contains the top-level supervisor definition for the organizational hierarchy.

---

## 👤 Component Details

### `supervisor.py` (`SupervisorAgent`)
- **Default Persona**: Alice (Head Architect)
- **Role**: Oversees the entire project strategy, interprets high-level requirements from the Human Director, and formulates top-level architectural decisions.
- **Key Actions**:
  - `receive_instruction(message)`: Processes user prompt and generates high-level architectural strategy.
  - `update_decisions(new_decisions)`: Updates the root decision string that is inherited by all subordinate leads.
