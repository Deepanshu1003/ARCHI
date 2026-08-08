"""Project CRUD."""

from __future__ import annotations

import uuid
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from ...core.domain.models import AgentRole, AgentStatus, ProjectArchitecture
from ...core.ports.memory_port import MemoryPort
from ..deps import ProjectServices, get_project_services, get_repository
from ..schemas.projects import (
    AgentIn,
    CreateProjectRequest,
    ProjectOut,
    UpdateProjectRequest,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _build_agents(agents_in: List[AgentIn], root_agent_id: str) -> Dict[str, AgentRole]:
    if not agents_in:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A project needs at least one agent.",
        )

    ids = [agent.id for agent in agents_in]
    if len(set(ids)) != len(ids):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Agent ids must be unique.",
        )
    if root_agent_id not in ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Root agent '{root_agent_id}' is not in the agent list.",
        )

    known = set(ids)
    agents: Dict[str, AgentRole] = {}
    for item in agents_in:
        if item.parent_id and item.parent_id not in known:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Agent '{item.id}' has unknown parent '{item.parent_id}'.",
            )
        unknown_children = [cid for cid in item.children_ids if cid not in known]
        if unknown_children:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Agent '{item.id}' lists unknown children: {unknown_children}.",
            )
        try:
            agent_status = AgentStatus.coerce(item.status)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
            ) from exc
        agents[item.id] = AgentRole(
            id=item.id,
            person_name=item.person_name,
            role_name=item.role_name,
            responsibilities=item.responsibilities,
            parent_id=item.parent_id,
            children_ids=list(item.children_ids),
            status=agent_status,
        )
    return agents


@router.get("", response_model=List[ProjectOut])
async def list_projects(repository: MemoryPort = Depends(get_repository)) -> List[ProjectOut]:
    projects = await repository.list_projects()
    return [ProjectOut.from_domain(project) for project in projects]


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: CreateProjectRequest, repository: MemoryPort = Depends(get_repository)
) -> ProjectOut:
    project_id = payload.project_id or f"project-{uuid.uuid4().hex[:12]}"
    if await repository.get_project(project_id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project '{project_id}' already exists.",
        )
    project = ProjectArchitecture(
        project_id=project_id,
        name=payload.name,
        description=payload.description,
        root_agent_id=payload.root_agent_id,
        agents=_build_agents(payload.agents, payload.root_agent_id),
    )
    await repository.save_project(project)
    return ProjectOut.from_domain(project)


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(services: ProjectServices = Depends(get_project_services)) -> ProjectOut:
    return ProjectOut.from_domain(services.project)


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    payload: UpdateProjectRequest,
    services: ProjectServices = Depends(get_project_services),
) -> ProjectOut:
    project = services.project
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.root_agent_id is not None:
        project.root_agent_id = payload.root_agent_id
    if payload.agents is not None:
        project.agents = _build_agents(payload.agents, project.root_agent_id)
    await services.save()
    return ProjectOut.from_domain(project)


@router.delete(
    "/{project_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None
)
async def delete_project(
    project_id: str, repository: MemoryPort = Depends(get_repository)
) -> None:
    await repository.delete_project(project_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_all_projects(repository: MemoryPort = Depends(get_repository)) -> None:
    await repository.delete_all_projects()
