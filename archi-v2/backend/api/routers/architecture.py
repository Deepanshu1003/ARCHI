"""Drafting, delegation, submission, approval, diffing and publishing."""

from __future__ import annotations

import time

from fastapi import APIRouter, Depends, HTTPException, status

from ...adapters.event_bus.event_bus import unified_diff
from ...agents.core.delegation_capability import NotASupervisorError
from ...agents.core.submission_capability import (
    GovernanceRejectedError,
    NotASubordinateError,
)
from ...core.domain.blueprint import build_blueprint
from ...core.domain.state_machine import InvalidStateTransitionError
from ..deps import ProjectServices, get_project_services
from ..schemas.architecture import (
    ApproveRequest,
    ApproveResponse,
    DegradedInfo,
    DelegateRequest,
    DelegateResponse,
    DiffRequest,
    DiffResponse,
    DraftRequest,
    DraftResponse,
    RevisionRequest,
    RevisionResponse,
    SubmitRequest,
    SubmitResponse,
)
from ..schemas.blueprint import BlueprintOut
from ..schemas.projects import ApprovalOut, SliceOut

router = APIRouter(prefix="/api/projects/{project_id}/architecture", tags=["architecture"])


def _bad_request(exc: Exception) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/blueprint", response_model=BlueprintOut)
async def blueprint(
    services: ProjectServices = Depends(get_project_services),
) -> BlueprintOut:
    """The whole tree's plans in one document, with what is still pending."""
    return BlueprintOut.from_domain(
        build_blueprint(services.project), services.project.published_spec
    )


@router.post("/blueprint/publish", response_model=BlueprintOut)
async def publish_blueprint(
    services: ProjectServices = Depends(get_project_services),
) -> BlueprintOut:
    """Freezes the assembled plan as the project's public domain spec.

    Refused while any agent is still unapproved, so a half-built plan can never
    be handed out as final.
    """
    assembled = build_blueprint(services.project)
    if not assembled.is_final:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "The build plan is not final yet. Still pending: "
                f"{', '.join(assembled.pending_agents) or 'no agents in this project'}."
            ),
        )
    services.project.published_spec = assembled.markdown
    services.project.published_at = time.time()
    await services.save()
    return BlueprintOut.from_domain(assembled, services.project.published_spec)


@router.post("/draft", response_model=DraftResponse)
async def draft(
    payload: DraftRequest, services: ProjectServices = Depends(get_project_services)
) -> DraftResponse:
    agent = services.agent(payload.agent_id)
    outcome = await services.behavior.draft(services.project, agent, payload.context)
    await services.save()
    return DraftResponse(
        slice=SliceOut.from_domain(outcome.slice_data),
        agent_status=agent.status.value,
        governance_violations=outcome.governance_violations,
        degraded_info=DegradedInfo(
            degraded=outcome.degraded, reason=outcome.reason, provider=outcome.provider
        ),
    )


@router.post("/delegate", response_model=DelegateResponse)
async def delegate(
    payload: DelegateRequest, services: ProjectServices = Depends(get_project_services)
) -> DelegateResponse:
    supervisor = services.agent(payload.agent_id)
    try:
        outcome = await services.delegation.delegate(services.project, supervisor)
    except (NotASupervisorError, InvalidStateTransitionError, ValueError) as exc:
        raise _bad_request(exc) from exc
    await services.save()
    return DelegateResponse(
        supervisor_id=supervisor.id,
        recipients=outcome.recipients,
        slices={aid: SliceOut.from_domain(s) for aid, s in outcome.slices.items()},
        agent_statuses={
            aid: services.project.agent(aid).status.value
            for aid in [supervisor.id, *outcome.recipients]
        },
        degraded_info=DegradedInfo(degraded=outcome.degraded, reason=outcome.reason),
    )


@router.post("/submit", response_model=SubmitResponse)
async def submit(
    payload: SubmitRequest, services: ProjectServices = Depends(get_project_services)
) -> SubmitResponse:
    agent = services.agent(payload.agent_id)
    try:
        outcome = await services.submission.submit(services.project, agent, payload.content)
    except GovernanceRejectedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.violations
        ) from exc
    except (NotASubordinateError, InvalidStateTransitionError, ValueError) as exc:
        raise _bad_request(exc) from exc
    await services.save()
    return SubmitResponse(
        approval=ApprovalOut.from_domain(outcome.approval), agent_status=agent.status.value
    )


@router.post("/approve", response_model=ApproveResponse)
async def approve(
    payload: ApproveRequest, services: ProjectServices = Depends(get_project_services)
) -> ApproveResponse:
    supervisor = services.agent(payload.supervisor_id)
    subordinate = services.agent(payload.subordinate_id)
    try:
        outcome = await services.submission.approve(services.project, supervisor, subordinate)
    except (InvalidStateTransitionError, ValueError) as exc:
        raise _bad_request(exc) from exc
    await services.save()
    return ApproveResponse(
        supervisor_id=supervisor.id,
        subordinate_id=subordinate.id,
        merged_content=outcome.merge.merged_content,
        conflicts=outcome.merge.conflicts,
        summary=outcome.merge.summary,
        agent_statuses={
            supervisor.id: supervisor.status.value,
            subordinate.id: subordinate.status.value,
        },
    )


@router.post("/request-revision", response_model=RevisionResponse)
async def request_revision(
    payload: RevisionRequest, services: ProjectServices = Depends(get_project_services)
) -> RevisionResponse:
    supervisor = services.agent(payload.supervisor_id)
    subordinate = services.agent(payload.subordinate_id)
    try:
        await services.submission.request_revision(services.project, supervisor, subordinate)
    except (InvalidStateTransitionError, ValueError) as exc:
        raise _bad_request(exc) from exc
    await services.save()
    return RevisionResponse(
        subordinate_id=subordinate.id, agent_status=subordinate.status.value
    )


@router.post("/diff", response_model=DiffResponse)
async def diff(payload: DiffRequest) -> DiffResponse:
    text = unified_diff(
        payload.before, payload.after, payload.from_label, payload.to_label
    )
    return DiffResponse(diff=text, has_changes=bool(text.strip()))
