# Python Core - Platform Team Module

The Platform Team handles core infrastructure responsibilities split across three specialized sub-domains:

---

## 📂 Sub-Directory Structure

- **`control/`**: Contains `orchestrator.py` (`ControlAgent` - Dave). Manages execution pipelines and message routing.
- **`memory/`**: Contains `state_manager.py` (`MemoryAgent` - Eve). Handles persistent storage and history logging.
- **`governance/`**: Contains `policy_enforcer.py` (`GovernanceAgent` - Frank). Enforces safety, security rules, and API policies.
