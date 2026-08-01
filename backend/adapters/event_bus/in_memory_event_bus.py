# backend/adapters/event_bus/in_memory_event_bus.py
"""
In-Memory Event Bus & Approval Engine Implementation
Implements EventBusPort for inter-agent communication, downward delegation, and upward approval routing.
"""

import difflib
import logging
from typing import Dict, List, Optional, Any
from ...core.ports.event_bus_port import EventBusPort
from ...core.ports.memory_port import MemoryPort
from ...core.domain.models import ArchitectureSlice, AgentStatus, AgentRole, ProjectArchitecture
from ...core.domain.state_machine import AgentStateMachine

logger = logging.getLogger("ARCHI.InMemoryEventBus")


class PendingApproval:
    """Represents a pending architecture slice approval request for a supervisor."""
    def __init__(
        self,
        slice_data: ArchitectureSlice,
        supervisor_id: str,
        author_id: str,
        diff_text: str
    ):
        self.slice_data = slice_data
        self.supervisor_id = supervisor_id
        self.author_id = author_id
        self.diff_text = diff_text

    def to_dict(self) -> Dict[str, Any]:
        return {
            "slice_id": self.slice_data.slice_id,
            "supervisor_id": self.supervisor_id,
            "author_id": self.author_id,
            "title": self.slice_data.title,
            "content": self.slice_data.content,
            "diff_text": self.diff_text,
            "version": self.slice_data.version,
            "is_finalized": self.slice_data.is_finalized
        }


class InMemoryEventBus(EventBusPort):
    """
    In-memory implementation of EventBusPort.
    Handles downward delegation event publishing and upward review submission with textual diffs.
    """

    def __init__(self, memory_port: Optional[MemoryPort] = None):
        self.memory_port = memory_port
        self.downward_events: List[Dict[str, Any]] = []
        self.pending_approvals: Dict[str, List[PendingApproval]] = {}  # supervisor_id -> List[PendingApproval]

    def set_memory_port(self, memory_port: MemoryPort) -> None:
        """Sets or updates the memory port dependency."""
        self.memory_port = memory_port

    async def publish_downward(
        self, slice_data: ArchitectureSlice, target_agent_ids: List[str]
    ) -> None:
        """
        Distributes domain sub-architectures to direct reports and updates their status to DRAFTING.
        """
        logger.info(
            f"Publishing downward slice '{slice_data.title}' (id: {slice_data.slice_id}) "
            f"to targets: {target_agent_ids}"
        )

        event_record = {
            "event": "DOWNWARD_DELEGATION",
            "slice_id": slice_data.slice_id,
            "title": slice_data.title,
            "author_agent_id": slice_data.agent_id,
            "target_agent_ids": target_agent_ids,
            "version": slice_data.version
        }
        self.downward_events.append(event_record)

        if self.memory_port:
            # Update target agents' status to DRAFTING and save slice data
            for agent_id in target_agent_ids:
                agent_slice = ArchitectureSlice(
                    slice_id=f"slice-{agent_id}",
                    agent_id=agent_id,
                    title=f"Delegated Sub-Plan: {slice_data.title}",
                    domain_scope=slice_data.domain_scope,
                    content=slice_data.content,
                    version=slice_data.version,
                    is_finalized=False
                )
                await self.memory_port.save_slice(agent_slice)

    async def publish_upward_for_approval(
        self, slice_data: ArchitectureSlice, supervisor_id: str
    ) -> None:
        """
        Generates a textual diff comparing author's new content against parent slice,
        updates author's status to AWAITING_REVIEW, and routes diff notification to supervisor.
        """
        logger.info(
            f"Publishing upward slice '{slice_data.title}' from author '{slice_data.agent_id}' "
            f"to supervisor '{supervisor_id}' for approval."
        )

        parent_content = ""
        if self.memory_port:
            parent_slice = await self.memory_port.get_slice_by_agent(supervisor_id)
            if parent_slice:
                parent_content = parent_slice.content

        # Generate textual diff comparing new slice content against parent/master
        diff_lines = list(difflib.unified_diff(
            parent_content.splitlines(keepends=True),
            slice_data.content.splitlines(keepends=True),
            fromfile=f"Supervisor ({supervisor_id}) Plan",
            tofile=f"Author ({slice_data.agent_id}) Sub-Plan"
        ))
        diff_text = "".join(diff_lines) or "No textual differences detected."
        slice_data.diff_summary = diff_text

        approval_request = PendingApproval(
            slice_data=slice_data,
            supervisor_id=supervisor_id,
            author_id=slice_data.agent_id,
            diff_text=diff_text
        )

        if supervisor_id not in self.pending_approvals:
            self.pending_approvals[supervisor_id] = []
        
        # Replace existing pending approval for same author if re-submitted
        self.pending_approvals[supervisor_id] = [
            req for req in self.pending_approvals[supervisor_id] if req.author_id != slice_data.agent_id
        ]
        self.pending_approvals[supervisor_id].append(approval_request)

        if self.memory_port:
            await self.memory_port.save_slice(slice_data)

    def get_pending_approvals_for_supervisor(self, supervisor_id: str) -> List[Dict[str, Any]]:
        """Helper method to list all pending approvals for a specific supervisor."""
        approvals = self.pending_approvals.get(supervisor_id, [])
        return [app.to_dict() for app in approvals]

    def remove_pending_approval(self, supervisor_id: str, author_id: str) -> None:
        """Removes a cleared or approved pending request."""
        if supervisor_id in self.pending_approvals:
            self.pending_approvals[supervisor_id] = [
                req for req in self.pending_approvals[supervisor_id] if req.author_id != author_id
            ]
