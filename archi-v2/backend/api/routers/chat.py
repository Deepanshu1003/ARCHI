"""Agent chat."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..deps import ProjectServices, get_project_services
from ..schemas.architecture import DegradedInfo
from ..schemas.chat import ChatRequest, ChatResponse
from ..schemas.projects import DocumentOut

router = APIRouter(prefix="/api/projects/{project_id}/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest, services: ProjectServices = Depends(get_project_services)
) -> ChatResponse:
    agent = services.agent(payload.agent_id)
    outcome = await services.behavior.chat(services.project, agent, payload.message)
    await services.save()
    return ChatResponse(
        agent_id=agent.id,
        reply=outcome.reply,
        documents_written=[
            DocumentOut.from_domain(doc) for doc in outcome.documents_written
        ],
        degraded_info=DegradedInfo(
            degraded=outcome.degraded, reason=outcome.reason, provider=outcome.provider
        ),
    )
