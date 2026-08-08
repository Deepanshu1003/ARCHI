"""The Planner: an agent whose job is dividing a plan across direct reports.

Unlike v1's template-only delegation adapter, this asks the intelligence
backend for a genuine per-report decomposition, and falls back to a structured
template only when no provider can answer — flagging that it did so.
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List

from ...core.domain.models import AgentRole, ArchitectureSlice
from ...core.ports.agent_port import AgentPort
from ...core.ports.delegation_port import DelegationPort, DelegationResult

logger = logging.getLogger("archi.agents.planner")

SECTION_PATTERN = re.compile(
    r"^\s*<<<AGENT:(?P<agent_id>[^>]+)>>>\s*$(?P<body>.*?)(?=^\s*<<<AGENT:|\Z)",
    re.MULTILINE | re.DOTALL,
)


class PlannerAgent(DelegationPort):
    """Splits a supervisor's plan into one tailored sub-plan per direct report."""

    name = "planner"

    def __init__(self, intelligence: AgentPort) -> None:
        self.intelligence = intelligence

    @staticmethod
    def _prompt(supervisor: AgentRole, plan: str, reports: List[AgentRole]) -> str:
        roster = "\n".join(
            f"- id={report.id} | {report.person_name} | {report.role_name} | "
            f"scope: {report.responsibilities or 'unspecified'}"
            for report in reports
        )
        return (
            "Divide the plan below into one sub-plan per direct report. Each sub-plan "
            "must cover only that report's scope and must be directly actionable.\n\n"
            f"## Direct reports\n{roster}\n\n"
            f"## Plan to divide\n{plan}\n\n"
            "## Required output format\n"
            "For every report, emit exactly:\n"
            "<<<AGENT:the-agent-id>>>\n"
            "markdown sub-plan for that agent\n\n"
            "Emit no other text."
        )

    @staticmethod
    def _fallback_content(supervisor: AgentRole, plan: str, report: AgentRole) -> str:
        excerpt = plan.strip()
        if len(excerpt) > 600:
            excerpt = excerpt[:600].rstrip() + " …"
        # Blockquoted so governance reads it as inherited context rather than
        # as this report assigning work to the peers the parent plan names.
        excerpt = "\n".join(f"> {line}" for line in excerpt.splitlines())
        return (
            f"# Sub-plan for {report.role_name} (template)\n\n"
            f"> Produced without an LLM. Configure a provider for a tailored split.\n\n"
            f"**Assigned to**: {report.person_name}\n"
            f"**Delegated by**: {supervisor.person_name} ({supervisor.role_name})\n"
            f"**Scope**: {report.responsibilities or 'unspecified'}\n\n"
            f"## Parent plan excerpt\n{excerpt or 'No parent plan content.'}\n\n"
            "## Expected of you\n"
            f"1. Expand the parent plan for {report.role_name} responsibilities.\n"
            "2. Define interfaces, data structures and boundaries you own.\n"
            "3. Submit upward when complete.\n"
        )

    def _parse(self, text: str, reports: List[AgentRole]) -> Dict[str, str]:
        by_id = {report.id: report for report in reports}
        parsed: Dict[str, str] = {}
        for match in SECTION_PATTERN.finditer(text):
            agent_id = match.group("agent_id").strip()
            body = match.group("body").strip()
            if agent_id in by_id and body:
                parsed[agent_id] = body
            elif agent_id not in by_id:
                logger.warning("Planner emitted a section for unknown agent '%s'.", agent_id)
        return parsed

    async def slice_architecture(
        self,
        supervisor: AgentRole,
        master_blueprint: str,
        direct_reports: List[AgentRole],
    ) -> DelegationResult:
        if not direct_reports:
            return DelegationResult(slices={}, provider=self.name)

        reply = await self.intelligence.generate_architecture(
            supervisor, self._prompt(supervisor, master_blueprint, direct_reports)
        )
        parsed = {} if reply.degraded else self._parse(reply.text, direct_reports)

        missing = [report.id for report in direct_reports if report.id not in parsed]
        if missing:
            logger.info("Planner falling back to template for: %s", ", ".join(missing))

        slices: Dict[str, ArchitectureSlice] = {}
        for report in direct_reports:
            content = parsed.get(report.id) or self._fallback_content(
                supervisor, master_blueprint, report
            )
            slices[report.id] = ArchitectureSlice(
                slice_id=f"slice-{report.id}",
                agent_id=report.id,
                title=f"Sub-Plan: {report.role_name}",
                domain_scope=report.responsibilities,
                content=content,
                version=1,
                is_finalized=False,
            )

        degraded = bool(missing)
        reason = reply.reason
        if degraded and not reason:
            reason = (
                "The model response did not contain a section for every direct "
                "report; templates were used for the remainder."
            )
        return DelegationResult(
            slices=slices,
            degraded=degraded,
            reason=reason if degraded else "",
            provider=reply.provider,
        )
