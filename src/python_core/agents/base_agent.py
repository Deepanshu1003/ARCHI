"""
Generic Base Agent class for any domain (Web App, AI Platform, Mobile, etc.)
"""
import uuid
import time
from typing import List, Dict, Optional, Any

class BaseAgent:
    def __init__(
        self,
        person_name: str,
        role_name: str,
        responsibilities: str,
        parent_id: Optional[str] = None,
        memory_store: Optional[Any] = None
    ):
        self.id = str(uuid.uuid4())
        self.person_name = person_name
        self.role_name = role_name
        self.responsibilities = responsibilities
        self.parent_id = parent_id
        self.children_ids: List[str] = []
        self.status = "idle"  # idle | active | waiting_on_subordinates | reviewing | approved
        self.decisions = ""
        self.chat_history: List[Dict[str, Any]] = []
        self.memory_store = memory_store

    def add_child(self, child_id: str):
        if child_id not in self.children_ids:
            self.children_ids.append(child_id)

    def receive_instruction(self, message: str, supervisor_decisions: str = "") -> str:
        self.chat_history.append({
            "role": "user",
            "content": message,
            "timestamp": time.time()
        })

        reply = (
            f"As {self.person_name} ({self.role_name}), I have received your request: '{message}'.\n"
            f"Aligning with my responsibilities ({self.responsibilities}), I will execute this domain task."
        )

        if supervisor_decisions:
            reply += f"\nAligned with Supervisor Decisions: '{supervisor_decisions[:100]}...'"

        self.chat_history.append({
            "role": "agent",
            "content": reply,
            "timestamp": time.time()
        })

        if self.memory_store:
            self.memory_store.log_event(self.id, "instruction_received", {"message": message, "reply": reply})

        return reply

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "personName": self.person_name,
            "roleName": self.role_name,
            "responsibilities": self.responsibilities,
            "parentId": self.parent_id,
            "childrenIds": self.children_ids,
            "status": self.status,
            "decisions": self.decisions,
            "chatHistory": self.chat_history
        }
