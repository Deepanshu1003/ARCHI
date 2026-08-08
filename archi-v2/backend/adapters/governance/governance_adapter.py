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

    def _foreign_scope_violations(self, agent: AgentRole, content: str) -> List[str]:
        """Flags content that assigns work to agents outside the agent's subtree."""
        if self.project is None:
            return []
        lowered = content.lower()
        allowed = {agent.id, *agent.children_ids}
        if agent.parent_id:
            allowed.add(agent.parent_id)

        violations: List[str] = []
        for other_id, other in self.project.agents.items():
            if other_id in allowed:
                continue
            pattern = rf"\b{re.escape(other.person_name.lower())}\b"
            if other.person_name and re.search(pattern, lowered):
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
