import uuid
from typing import Dict, List, Any
from python_core.utils.llm_client import LLMClient
from python_core.utils.memory_store import MemoryStore

class SupervisorAgent:
    """
    Head Architect (Supervisor) Agent.
    Defines overall project architecture and delegates tasks to Platform and Tools Team Leads.
    """

    def __init__(
        self, 
        agent_id: str = None, 
        person_name: str = "Alice", 
        role_name: str = "Head Architect (Supervisor)",
        responsibilities: str = "Oversee system architecture and delegate sub-tasks.",
        memory_store: MemoryStore = None
    ):
        self.id = agent_id or str(uuid.uuid4())
        self.person_name = person_name
        self.role_name = role_name
        self.responsibilities = responsibilities
        self.decisions = "Core Architecture Goal: Multi-agent ecosystem with control, memory, and governance layers."
        self.chat_history: List[Dict[str, Any]] = []
        self.children_ids: List[str] = []
        self.llm = LLMClient()
        self.memory = memory_store or MemoryStore()

    def receive_instruction(self, message: str) -> str:
        self.chat_history.append({"role": "user", "content": message})
        system_prompt = (
            f"You are {self.person_name}, acting as {self.role_name}.\n"
            f"Responsibilities: {self.responsibilities}\n"
            f"Current Decisions: {self.decisions}\n"
            f"Provide a clear architectural response and delegation plan."
        )
        reply = self.llm.generate_response(system_prompt, self.chat_history, message)
        self.chat_history.append({"role": "agent", "content": reply})

        self.memory.log_event("agent_chat", self.id, {
            "role": self.role_name,
            "person": self.person_name,
            "user_input": message,
            "agent_reply": reply
        })
        return reply

    def update_decisions(self, new_decisions: str):
        self.decisions = new_decisions
        self.memory.log_event("decision_updated", self.id, {"decisions": new_decisions})
