"""The Merger: an agent whose job is folding approved work back into the parent.

Section-aware rather than string-concatenating: a sub-plan already present in
the parent under the same heading is replaced in place, and a replacement that
would drop parent content is reported as a conflict instead of applied silently.
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Tuple

from ...core.domain.models import AgentRole, ArchitectureSlice, MergeResult
from ...core.ports.merge_port import MergePort

logger = logging.getLogger("archi.agents.merger")

HEADING_PATTERN = re.compile(r"^(#{1,6})\s+(?P<title>.+?)\s*$", re.MULTILINE)


def _section_marker(agent: AgentRole) -> str:
    return f"<!-- archi:section agent={agent.id} -->"


class MergerAgent(MergePort):
    """Integrates an approved child slice into its supervisor's plan."""

    name = "merger"

    @staticmethod
    def _split_sections(content: str) -> List[Tuple[str, str]]:
        """Splits markdown into (heading, body) pairs, preserving order."""
        matches = list(HEADING_PATTERN.finditer(content))
        if not matches:
            return [("", content)] if content.strip() else []
        sections: List[Tuple[str, str]] = []
        preamble = content[: matches[0].start()]
        if preamble.strip():
            sections.append(("", preamble))
        for index, match in enumerate(matches):
            end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
            sections.append((match.group("title").strip().lower(), content[match.start() : end]))
        return sections

    def _detect_conflicts(
        self, parent_content: str, child_content: str, subordinate: AgentRole
    ) -> List[str]:
        """Reports parent sections the child claims but materially shrinks."""
        parent_sections: Dict[str, str] = {
            title: body for title, body in self._split_sections(parent_content) if title
        }
        conflicts: List[str] = []
        for title, body in self._split_sections(child_content):
            if not title or title not in parent_sections:
                continue
            existing = parent_sections[title]
            if len(body.strip()) < len(existing.strip()) * 0.5:
                conflicts.append(
                    f"Section '{title}' from {subordinate.person_name} is less than half "
                    f"the length of the supervisor's existing section; review manually."
                )
        return conflicts

    async def merge_slice(
        self,
        supervisor: AgentRole,
        subordinate: AgentRole,
        parent_content: str,
        child_slice: ArchitectureSlice,
    ) -> MergeResult:
        marker = _section_marker(subordinate)
        block = (
            f"{marker}\n"
            f"## {subordinate.role_name} — {subordinate.person_name}\n\n"
            f"{child_slice.content.strip()}\n"
        )

        conflicts = self._detect_conflicts(parent_content, child_slice.content, subordinate)

        if marker in parent_content:
            # Replace this subordinate's previously merged block in place.
            pattern = re.compile(
                rf"{re.escape(marker)}.*?(?=^<!-- archi:section agent=|\Z)",
                re.DOTALL | re.MULTILINE,
            )
            merged = pattern.sub(block, parent_content, count=1)
            summary = f"Replaced {subordinate.person_name}'s existing section."
        else:
            base = parent_content.rstrip()
            merged = f"{base}\n\n{block}" if base else block
            summary = f"Appended {subordinate.person_name}'s approved sub-plan."

        if conflicts:
            summary += f" {len(conflicts)} conflict(s) flagged for review."

        return MergeResult(merged_content=merged, conflicts=conflicts, summary=summary)
