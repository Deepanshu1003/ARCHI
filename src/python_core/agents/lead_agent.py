"""
Lead Agent class representing team leads/supervisors in any domain (Web App, AI, Mobile, Data, etc.).
"""
from typing import Optional, Any, List, Dict
from .base_agent import BaseAgent

class LeadAgent(BaseAgent):
    def __init__(
        self,
        person_name: str,
        role_name: str = "Team Lead / Supervisor",
        responsibilities: str = "Oversee domain strategy and delegate sub-tasks to direct reports.",
        parent_id: Optional[str] = None,
        memory_store: Optional[Any] = None
    ):
        super().__init__(person_name, role_name, responsibilities, parent_id, memory_store)

    def delegate_to_direct_reports(self, direct_reports: List[BaseAgent], parent_plan: str) -> Dict[str, str]:
        """
        Takes the supervisor's master plan and generates domain-specific sub-plans
        FOR DIRECT REPORTS ONLY based on each report's exact responsibilities.
        """
        self.decisions = parent_plan
        self.status = "waiting_on_subordinates"
        delegated_plans = {}

        for report in direct_reports:
            sub_plan = (
                f"[Delegated Sub-Plan from {self.person_name} ({self.role_name})]\n"
                f"Target Role: {report.role_name}\n"
                f"Responsibilities: {report.responsibilities}\n"
                f"Action Plan: Expand master strategy into domain-specific implementation details."
            )
            report.decisions = sub_plan
            report.status = "active"
            report.chat_history.append({
                "role": "agent",
                "content": f"📋 {sub_plan}",
                "timestamp": 0
            })
            delegated_plans[report.id] = sub_plan

        return delegated_plans
