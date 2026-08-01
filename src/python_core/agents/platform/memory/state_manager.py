import uuid
from typing import Dict, List, Any
from python_core.utils.llm_client import LLMClient
from python_core.utils.memory_store import MemoryStore

class MemoryAgent:
    """
    Memory State Specialist Agent.
    Manages persistent state retention, history indexing, and prompt log tracking.
    """

    def __init__(
        self, 
        agent_id: str = None, 
        person_name: str = "Eve", 
        role_name: str = "Memory State Specialist",
        responsibilities: str = "Manage state retention, persistent storage, prompt history logging.",
        memory_store: MemoryStore = None
    ):
        self.id = agent_id or str(uuid.uuid4())
        self.person_name = person_name
        self.role_name = role_name
        self.responsibilities = responsibilities
        self.decisions = ""
        self.chat_history: List[Dict[str, Any]] = []
        self.llm = LLMClient()
        self.memory = memory_store or MemoryStore()

    def receive_instruction(self, message: str, supervisor_decisions: str = "") -> str:
        self.chat_history.append({"role": "user", "content": message})
        system_prompt = (
            f"You are {self.person_name}, acting as {self.role_name}.\n"
            f"Responsibilities: {self.responsibilities}\n"
            f"Supervisor Context: {supervisor_decisions}\n"
            f"Provide memory persistence strategy and indexing schema."
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
