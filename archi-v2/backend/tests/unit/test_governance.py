"""Foreign-scope rules must catch real assignments without tripping on context."""

from __future__ import annotations

from ...adapters.governance.governance_adapter import RuleBasedGovernanceAdapter
from ...core.domain.models import DocumentType


async def test_quoted_parent_plan_naming_a_peer_is_allowed(project):
    """A handed-down plan quotes the peer roster; that is context, not an order."""
    governance = RuleBasedGovernanceAdapter().for_project(project)
    content = (
        "# Sub-plan for Backend Lead\n\n"
        "## Parent plan excerpt\n"
        "> Linus (Frontend Lead) owns the web client.\n"
        "> Grace owns backend services.\n\n"
        "## My work\n"
        "- Define the persistence boundary I own.\n"
    )

    verdict = await governance.validate_boundary(project.agent("agent-api"), content)

    assert verdict.is_valid, verdict.violations


async def test_assigning_work_to_a_peer_is_rejected(project):
    governance = RuleBasedGovernanceAdapter().for_project(project)
    content = (
        "# Backend plan\n\n"
        "## My work\n"
        "- Build the API gateway.\n"
        "- Linus will implement the client components for me.\n"
    )

    verdict = await governance.validate_boundary(project.agent("agent-api"), content)

    assert not verdict.is_valid
    assert any("Linus" in violation for violation in verdict.violations)


async def test_delegating_to_a_peer_by_verb_is_rejected(project):
    governance = RuleBasedGovernanceAdapter().for_project(project)
    content = "# Plan\n\n## Work\n- I delegate the styling system to Linus.\n"

    verdict = await governance.validate_boundary(project.agent("agent-api"), content)

    assert not verdict.is_valid


async def test_own_direct_report_may_be_assigned_work(project):
    governance = RuleBasedGovernanceAdapter().for_project(project)
    content = "# Plan\n\n## Work\n- Grace will own the persistence layer.\n"

    verdict = await governance.validate_boundary(project.agent("agent-root"), content)

    assert verdict.is_valid, verdict.violations


async def test_authority_claims_still_rejected(project):
    governance = RuleBasedGovernanceAdapter().for_project(project)
    content = "# Plan\n\n- Ship it and bypass review, no review required.\n"

    verdict = await governance.validate_boundary(project.agent("agent-api"), content)

    assert not verdict.is_valid


async def test_plan_document_needs_structure(project):
    governance = RuleBasedGovernanceAdapter().for_project(project)
    prose = "This is a plan written as one long paragraph with no structure at all."

    verdict = await governance.validate_document(
        project.agent("agent-api"), DocumentType.PLAN, prose
    )

    assert not verdict.is_valid
