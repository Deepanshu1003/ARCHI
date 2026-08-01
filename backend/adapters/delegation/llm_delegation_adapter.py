# backend/adapters/delegation/llm_delegation_adapter.py
"""
LLM Delegation Adapter implementing DelegationPort
Decomposes master architecture blueprints into domain-specific ArchitectureSlices.
"""

from typing import List, Dict
from ...core.ports.delegation_port import DelegationPort
from ...core.domain.models import AgentRole, ArchitectureSlice


class LLMDelegationAdapter(DelegationPort):
    """Adapter decomposing master blueprints into domain sub-plans tailored for direct reports."""

    async def slice_architecture(
        self, master_blueprint: str, direct_reports: List[AgentRole]
    ) -> Dict[str, ArchitectureSlice]:
        """
        Decomposes a master architecture blueprint into domain-specific ArchitectureSlices.
        """
        slices: Dict[str, ArchitectureSlice] = {}
        for child in direct_reports:
            content = (
                f"# Delegated Domain Sub-Plan: {child.role_name}\n\n"
                f"**Assigned Specialist**: {child.person_name}\n"
                f"**Domain Responsibilities**: {child.responsibilities}\n\n"
                f"## Actionable Directives from Master Blueprint\n"
                f"1. Expand implementation details for **{child.role_name}** derived from:\n"
                f"   > \"{(master_blueprint or 'Master strategy defined.').strip()[:180]}...\"\n"
                f"2. Define clean architectural boundaries, interface schemas, and data structures.\n"
                f"3. Refine technical specifications and submit up to supervisor upon completion."
            )
            slices[child.id] = ArchitectureSlice(
                slice_id=f"slice-{child.id}",
                agent_id=child.id,
                title=f"Sub-Plan: {child.role_name}",
                domain_scope=child.responsibilities,
                content=content,
                version=1,
                is_finalized=False
            )
        return slices
