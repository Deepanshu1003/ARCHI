"""
Specialist Agent class representing domain experts (Frontend, Backend, Database, UI/UX, API, QA, etc.).
"""
from typing import Optional, Any
from .base_agent import BaseAgent

class SpecialistAgent(BaseAgent):
    def __init__(
        self,
        person_name: str,
        role_name: str,
        responsibilities: str,
        parent_id: Optional[str] = None,
        memory_store: Optional[Any] = None
    ):
        super().__init__(person_name, role_name, responsibilities, parent_id, memory_store)

    def finalize_and_submit(self, supervisor: Optional[BaseAgent] = None) -> str:
        self.status = "approved"
        submission_summary = f"Completed domain task for {self.role_name}. Decisions: {self.decisions}"
        
        if supervisor:
            supervisor.chat_history.append({
                "role": "agent",
                "content": f"📥 [Domain Submission from {self.person_name} ({self.role_name})]:\n{self.decisions}",
                "timestamp": 0
            })
            
        return submission_summary
