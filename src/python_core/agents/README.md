# Python Core - Generic Agents Architecture

This directory contains generic, domain-agnostic object-oriented Python classes for managing multi-agent teams across **ANY software project domain** (e.g. Full-Stack Web App, AI Ecosystem, Mobile App, Data Infrastructure, etc.).

---

## 🏛️ Generic Agent Classes

```
python_core/agents/
├── base_agent.py        # BaseAgent: Core agent properties (id, name, role, responsibilities, history)
├── lead_agent.py        # LeadAgent: Extends BaseAgent with delegation logic to DIRECT REPORTS ONLY
└── specialist_agent.py  # SpecialistAgent: Extends BaseAgent for domain-specific implementation tasks
```

---

## 🔄 Direct Report Delegation Flow

1. **Lead / Supervisor Creation**: Any lead agent (such as Alice or Bob) defines a master plan in `decisions`.
2. **Direct Report Cascading**: Calling `lead.delegate_to_direct_reports([child1, child2], master_plan)` analyzes each direct report's specific role and responsibilities and generates domain-tailored sub-plans.
3. **Sub-Task Submission**: When direct reports finalize their sub-plans, calling `specialist.finalize_and_submit(supervisor)` bubbles up their finalized domain strategy to their supervisor.
