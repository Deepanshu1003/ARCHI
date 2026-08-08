"""The "divide" contract: split a parent plan into per-report sub-plans."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List

from ..domain.models import AgentRole, ArchitectureSlice


@dataclass
class DelegationResult:
    """Sub-plans produced for a supervisor's direct reports.

    ``degraded`` is True when no model shaped the split, so the caller can tell
    a real decomposition from a template.
    """

    slices: Dict[str, ArchitectureSlice] = field(default_factory=dict)
    degraded: bool = False
    reason: str = ""
    provider: str = ""


class DelegationPort(ABC):
    """Abstract port for decomposing a blueprint across direct reports."""

    @abstractmethod
    async def slice_architecture(
        self,
        supervisor: AgentRole,
        master_blueprint: str,
        direct_reports: List[AgentRole],
    ) -> DelegationResult:
        """Returns one slice per direct report, keyed by that report's agent id."""
