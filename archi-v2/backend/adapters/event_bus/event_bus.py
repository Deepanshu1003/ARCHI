"""In-process event bus: downward delivery and upward approval queues."""

from __future__ import annotations

import difflib
import logging
from typing import Dict, List

from ...core.domain.models import (
    ArchitectureSlice,
    PendingApproval,
    ProjectArchitecture,
)
from ...core.ports.event_bus_port import EventBusPort

logger = logging.getLogger("archi.event_bus")


def unified_diff(
    before: str, after: str, from_label: str, to_label: str
) -> str:
    """Renders a unified diff, or a readable notice when nothing changed."""
    lines = list(
        difflib.unified_diff(
            before.splitlines(keepends=True),
            after.splitlines(keepends=True),
            fromfile=from_label,
            tofile=to_label,
        )
    )
    return "".join(lines) or "No textual differences detected."


class InProcessEventBus(EventBusPort):
    """Routes slices between agents, storing queues on the project aggregate.

    Keeping the queues on the aggregate rather than in adapter-local state means
    they survive a restart along with everything else.
    """

    async def publish_downward(
        self,
        project: ProjectArchitecture,
        supervisor_id: str,
        slices: Dict[str, ArchitectureSlice],
    ) -> None:
        for agent_id, slice_data in slices.items():
            if agent_id not in project.agents:
                logger.warning("Skipping delivery to unknown agent '%s'.", agent_id)
                continue
            project.domain_slices[agent_id] = slice_data
        logger.info(
            "Supervisor '%s' delegated %d slice(s) in project '%s'.",
            supervisor_id,
            len(slices),
            project.project_id,
        )

    async def publish_upward_for_approval(
        self,
        project: ProjectArchitecture,
        slice_data: ArchitectureSlice,
        supervisor_id: str,
    ) -> PendingApproval:
        parent_slice = project.domain_slices.get(supervisor_id)
        parent_content = parent_slice.content if parent_slice else project.master_blueprint

        diff_text = unified_diff(
            parent_content,
            slice_data.content,
            from_label=f"supervisor:{supervisor_id}",
            to_label=f"author:{slice_data.agent_id}",
        )
        slice_data.diff_summary = diff_text
        project.domain_slices[slice_data.agent_id] = slice_data

        approval = PendingApproval(
            slice_id=slice_data.slice_id,
            supervisor_id=supervisor_id,
            author_id=slice_data.agent_id,
            title=slice_data.title,
            content=slice_data.content,
            diff_text=diff_text,
            version=slice_data.version,
            is_finalized=slice_data.is_finalized,
        )

        queue = project.pending_approvals.setdefault(supervisor_id, [])
        # A resubmission replaces the author's previous request.
        queue[:] = [item for item in queue if item.author_id != slice_data.agent_id]
        queue.append(approval)
        return approval

    async def pending_for_supervisor(
        self, project: ProjectArchitecture, supervisor_id: str
    ) -> List[PendingApproval]:
        return list(project.pending_approvals.get(supervisor_id, []))

    async def clear_pending(
        self, project: ProjectArchitecture, supervisor_id: str, author_id: str
    ) -> None:
        queue = project.pending_approvals.get(supervisor_id)
        if not queue:
            return
        queue[:] = [item for item in queue if item.author_id != author_id]
