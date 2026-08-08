"""Delegation, available only to agents that have direct reports."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict, List

from ...core.domain.models import (
    AgentRole,
    ArchitectureSlice,
    ProjectArchitecture,
)
from ...core.domain.state_machine import AgentStateMachine
from ...core.ports.delegation_port import DelegationPort
from ...core.ports.event_bus_port import EventBusPort

logger = logging.getLogger("archi.agents.delegation")


class NotASupervisorError(ValueError):
    """Raised when an agent without direct reports is asked to delegate."""


@dataclass
class DelegationOutcome:
    """Slices produced for each direct report, plus who received them."""

    slices: Dict[str, ArchitectureSlice] = field(default_factory=dict)
    recipients: List[str] = field(default_factory=list)
    degraded: bool = False
    reason: str = ""


class DelegationCapability:
    """Hands a supervisor's plan to the Planner and publishes the results down."""

    def __init__(self, planner: DelegationPort, event_bus: EventBusPort) -> None:
        self.planner = planner
        self.event_bus = event_bus

    async def delegate(
        self, project: ProjectArchitecture, supervisor: AgentRole
    ) -> DelegationOutcome:
        if not supervisor.is_supervisor:
            raise NotASupervisorError(
                f"{supervisor.person_name} has no direct reports and cannot delegate."
            )

        own_slice = project.domain_slices.get(supervisor.id)
        parent_plan = own_slice.content if own_slice else project.master_blueprint
        if not parent_plan.strip():
            raise ValueError(
                f"{supervisor.person_name} has no plan to divide. Draft one first."
            )

        reports = project.direct_reports(supervisor.id)
        result = await self.planner.slice_architecture(supervisor, parent_plan, reports)

        await self.event_bus.publish_downward(project, supervisor.id, result.slices)
        AgentStateMachine.on_delegate(supervisor, reports)

        if supervisor.id == project.root_agent_id:
            project.master_blueprint = parent_plan

        return DelegationOutcome(
            slices=result.slices,
            recipients=[report.id for report in reports],
            degraded=result.degraded,
            reason=result.reason,
        )
