"""Governance rules that actually run, rather than a port with no body.

Checks are deliberately mechanical (length, structure, ownership, foreign-scope
mentions) so their verdicts are reproducible and explainable.
"""

from __future__ import annotations

import re
from typing import List

from ...core.domain.models import (
    AgentRole,
    DocumentType,
    GovernanceVerdict,
    ProjectArchitecture,
)
from ...core.ports.governance_port import GovernancePort

MIN_CONTENT_CHARS = 24
MAX_CONTENT_CHARS = 200_000

# Phrases indicating an agent is claiming authority it does not have.
AUTHORITY_CLAIMS = (
    "i approve my own",
    "bypass review",
    "skip supervisor approval",
    "no review required",
)

# Headings that open a block of inherited or quoted material. Names appearing
# under one of these were written by somebody else, so they are not the
# author's own assignments.
QUOTED_SECTION_HEADINGS = re.compile(
    r"^\s{0,3}#{1,6}\s.*\b("
    r"context|parent plan|master blueprint|handed down|inherited|"
    r"direct reports|roster|delegated by|background"
    r")\b",
    re.IGNORECASE,
)
HEADING = re.compile(r"^\s{0,3}#{1,6}\s")

# An assignment is a name paired with a directive, not a bare mention. The
# name is spliced in as ``{name}``.
ASSIGNMENT_CUES = (
    r"\b(assign(?:ed|s|ing)?|delegat(?:e|es|ed|ing)|hand(?:ed|s|ing)? off|"
    r"task(?:ed|s|ing)?)\b[^.\n]{{0,40}}\b{name}\b",
    r"\b{name}\b\s*(?:\([^)]*\))?\s*(?:will|must|should|shall|is to|needs to|"
    r"owns|is responsible for|takes over|handles)\b",
    r"^\s*[-*]?\s*(?:owner|assignee|responsible)\s*:\s*[^\n]*\b{name}\b",
)


class RuleBasedGovernanceAdapter(GovernancePort):
    """Enforces bounded-context ownership and the two-document schema."""

    def __init__(self, project: ProjectArchitecture | None = None) -> None:
        self.project = project

    def for_project(self, project: ProjectArchitecture) -> "RuleBasedGovernanceAdapter":
        """Returns an adapter bound to a project, enabling cross-agent checks."""
        return RuleBasedGovernanceAdapter(project=project)

    @staticmethod
    def _length_violations(content: str) -> List[str]:
        violations: List[str] = []
        stripped = content.strip()
        if len(stripped) < MIN_CONTENT_CHARS:
            violations.append(
                f"Content is too short to review ({len(stripped)} chars, "
                f"minimum {MIN_CONTENT_CHARS})."
            )
        if len(content) > MAX_CONTENT_CHARS:
            violations.append(
                f"Content exceeds the {MAX_CONTENT_CHARS} character limit."
            )
        return violations

    @staticmethod
    def _authored_lines(content: str) -> List[str]:
        """Drops quoted and inherited passages, keeping what the agent wrote.

        A plan handed down by a supervisor quotes the parent plan and the peer
        roster verbatim. Those names are context, not the author's own
        assignments, so scanning them produces false positives.
        """
        kept: List[str] = []
        in_quoted_section = False
        for line in content.splitlines():
            if HEADING.match(line):
                in_quoted_section = bool(QUOTED_SECTION_HEADINGS.match(line))
                continue
            if in_quoted_section or line.lstrip().startswith(">"):
                continue
            kept.append(line)
        return kept

    def _foreign_scope_violations(self, agent: AgentRole, content: str) -> List[str]:
        """Flags content that assigns work to agents outside the agent's subtree."""
        if self.project is None:
            return []
        allowed = {agent.id, *agent.children_ids}
        if agent.parent_id:
            allowed.add(agent.parent_id)
        authored = "\n".join(self._authored_lines(content)).lower()
        if not authored.strip():
            return []

        violations: List[str] = []
        for other_id, other in self.project.agents.items():
            if other_id in allowed or not other.person_name:
                continue
            name = re.escape(other.person_name.lower())
            if any(
                re.search(cue.format(name=name), authored, re.MULTILINE)
                for cue in ASSIGNMENT_CUES
            ):
                violations.append(
                    f"Assigns work to '{other.person_name}' ({other.role_name}), who is "
                    f"not a direct report of {agent.person_name}."
                )
        return violations

    async def validate_boundary(self, agent: AgentRole, content: str) -> GovernanceVerdict:
        violations = self._length_violations(content)
        lowered = content.lower()
        violations.extend(
            f"Content claims authority it does not have: '{claim}'."
            for claim in AUTHORITY_CLAIMS
            if claim in lowered
        )
        violations.extend(self._foreign_scope_violations(agent, content))
        return GovernanceVerdict(is_valid=not violations, violations=violations)

    async def validate_document(
        self, agent: AgentRole, doc_type: DocumentType, content: str
    ) -> GovernanceVerdict:
        violations = self._length_violations(content)
        if doc_type is DocumentType.PLAN and not re.search(r"^\s*([-*]|\d+\.|#)", content, re.M):
            violations.append(
                "A plan must contain at least one heading or list item so it can be "
                "delegated and diffed."
            )
        if doc_type is DocumentType.PRINCIPLES and len(content.strip().splitlines()) < 2:
            violations.append("Principles must state at least two lines of constraints.")
        return GovernanceVerdict(is_valid=not violations, violations=violations)
