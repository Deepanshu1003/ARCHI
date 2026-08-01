# backend/adapters/web/fastapi_adapter.py
"""
FastAPI Web Adapter for STRATA
Provides HTTP REST APIs for project creation, multi-agent architecture generation,
downward delegation, upward approval workflows, and interactive node chat.
"""

import uuid
import logging
from typing import Dict, List, Optional, Any

try:
    from fastapi import FastAPI, HTTPException, status
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
except ImportError:
    # Graceful shim for environments where fastapi/pydantic are not yet installed
    class BaseModel:
        def __init__(self, **data):
            for k, v in data.items():
                setattr(self, k, v)

    class Field:
        def __init__(self, default=None, **kwargs):
            self.default = default

    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail

    class CORSMiddleware:
        pass

    class FastAPI:
        def __init__(self, title: str = "", version: str = ""):
            self.title = title
            self.version = version
            self.routes = []

        def add_middleware(self, *args, **kwargs):
            pass

        def post(self, path: str):
            def decorator(func):
                return func
            return decorator

        def get(self, path: str):
            def decorator(func):
                return func
            return decorator

from ...core.domain.models import (
    AgentRole,
    AgentStatus,
    ArchitectureSlice,
    ProjectArchitecture,
)
from ...core.domain.state_machine import AgentStateMachine, InvalidStateTransitionError
from ..memory.in_memory_repository import InMemoryRepository
from ..event_bus.in_memory_event_bus import InMemoryEventBus
from ..agent.gemini_agent_adapter import GeminiAgentAdapter
from ..delegation.llm_delegation_adapter import LLMDelegationAdapter

logger = logging.getLogger("ARCHI.FastAPIAdapter")

# Global singleton dependencies
memory_repository = InMemoryRepository()
event_bus = InMemoryEventBus(memory_port=memory_repository)
agent_adapter = GeminiAgentAdapter()
delegation_adapter = LLMDelegationAdapter()

app = FastAPI(
    title="ARCHI — Agentic Role-based Collaborative Hierarchical Infrastructure",
    version="1.0.0",
)

# Enable CORS for React frontend integration
if hasattr(app, "add_middleware") and callable(app.add_middleware):
    try:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    except Exception:
        pass


# ============================================================================
# Request & Response Data Transfer Objects (DTOs)
# ============================================================================

class AgentRoleDTO(BaseModel):
    id: str
    person_name: str
    role_name: str
    responsibilities: str
    parent_id: Optional[str] = None
    children_ids: List[str] = []
    status: str = "IDLE"


class CreateProjectRequest(BaseModel):
    project_id: str = Field(default_factory=lambda: f"proj-{uuid.uuid4().hex[:8]}")
    name: str = "ARCHI Multi-Agent Architecture"
    root_agent_id: str = "root-1"
    agents: List[AgentRoleDTO] = []


class CreateArchitectureRequest(BaseModel):
    project_id: str
    context: Optional[str] = "Build an enterprise microservices web application"


class FinalizeArchitectureRequest(BaseModel):
    project_id: str


class PublishSliceRequest(BaseModel):
    project_id: str
    agent_id: str
    title: str
    content: str


class ApproveSliceRequest(BaseModel):
    project_id: str
    supervisor_id: str
    subordinate_id: str


class ChatRequest(BaseModel):
    project_id: str
    agent_id: str
    message: str
    history: List[Dict[str, str]] = []


# ============================================================================
# API Routes
# ============================================================================

@app.post("/api/project/create")
async def create_project(req: CreateProjectRequest) -> Dict[str, Any]:
    """
    Accepts project metadata and agent hierarchy (10+ custom agents),
    and initializes project state in MemoryPort.
    """
    agents_map: Dict[str, AgentRole] = {}
    for dto in req.agents:
        status_enum = AgentStatus.IDLE
        try:
            status_enum = AgentStatus(dto.status)
        except ValueError:
            pass

        agents_map[dto.id] = AgentRole(
            id=dto.id,
            person_name=dto.person_name,
            role_name=dto.role_name,
            responsibilities=dto.responsibilities,
            parent_id=dto.parent_id,
            children_ids=dto.children_ids or [],
            status=status_enum,
        )

    # Ensure root agent exists
    if req.root_agent_id not in agents_map and req.agents:
        req.root_agent_id = req.agents[0].id

    project = ProjectArchitecture(
        project_id=req.project_id,
        name=req.name,
        root_agent_id=req.root_agent_id,
        agents=agents_map,
        master_blueprint="",
        domain_slices={},
    )

    await memory_repository.save_project(project)
    
    # Save raw project payload for full state persistence across reloads
    raw_agents: Dict[str, Any] = {}
    for aid, arole in agents_map.items():
        raw_agents[aid] = {
            "id": arole.id,
            "personName": arole.person_name,
            "roleName": arole.role_name,
            "responsibilities": arole.responsibilities,
            "parentId": arole.parent_id,
            "childrenIds": arole.children_ids,
            "status": arole.status.value,
            "decisions": "",
            "chatHistory": []
        }
    
    raw_project = {
        "id": project.project_id,
        "name": project.name,
        "createdAt": 1700000000000,
        "rootAgentId": project.root_agent_id,
        "agents": raw_agents,
        "masterBlueprint": "",
        "domainSlices": {},
        "pendingApprovals": {}
    }
    await memory_repository.save_raw_project(raw_project)

    return {
        "status": "success",
        "project_id": project.project_id,
        "name": project.name,
        "total_agents": len(project.agents),
        "root_agent_id": project.root_agent_id,
    }


@app.post("/api/architecture/create")
async def create_architecture(req: CreateArchitectureRequest) -> Dict[str, Any]:
    """
    Triggers Head Architect via AgentPort to draft the master architecture blueprint
    (Planner, Backend, Frontend, Tools, Platform, Governance).
    """
    project = await memory_repository.get_project(req.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{req.project_id}' not found.")

    root_agent = project.agents.get(project.root_agent_id)
    if not root_agent:
        raise HTTPException(status_code=400, detail="Root agent not found in project hierarchy.")

    # Generate master blueprint via AgentPort
    blueprint_content = await agent_adapter.generate_architecture(root_agent, req.context or "")
    project.master_blueprint = blueprint_content

    # Create root architecture slice & transition state to DRAFTING
    AgentStateMachine.transition(root_agent, AgentStatus.DRAFTING)
    master_slice = ArchitectureSlice(
        slice_id=f"slice-{root_agent.id}",
        agent_id=root_agent.id,
        title=f"Master Blueprint: {root_agent.role_name}",
        domain_scope="Overall System Topology & Governance",
        content=blueprint_content,
        version=1,
        is_finalized=False,
    )
    project.domain_slices[root_agent.id] = master_slice

    await memory_repository.save_slice(master_slice)
    await memory_repository.save_project(project)

    return {
        "status": "success",
        "project_id": project.project_id,
        "root_agent_id": root_agent.id,
        "master_blueprint": blueprint_content,
        "root_status": root_agent.status.value,
    }


@app.post("/api/architecture/finalize")
async def finalize_architecture(req: FinalizeArchitectureRequest) -> Dict[str, Any]:
    """
    Locks master plan, invokes DelegationPort to slice domain sub-plans,
    and triggers EventBusPort.publish_downward().
    """
    project = await memory_repository.get_project(req.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{req.project_id}' not found.")

    root_agent = project.agents.get(project.root_agent_id)
    if not root_agent:
        raise HTTPException(status_code=400, detail="Root agent not found.")

    # Finalize master slice
    master_slice = project.domain_slices.get(root_agent.id)
    if master_slice:
        master_slice.is_finalized = True

    # Identify direct reports
    direct_reports = [
        project.agents[child_id]
        for child_id in root_agent.children_ids
        if child_id in project.agents
    ]

    # Transition states via State Machine
    AgentStateMachine.transition_on_delegate(root_agent, direct_reports)

    # Slice architecture via DelegationPort
    delegated_slices = await delegation_adapter.slice_architecture(
        project.master_blueprint, direct_reports
    )

    # Publish downward via EventBusPort
    target_ids = [child.id for child in direct_reports]
    if master_slice:
        await event_bus.publish_downward(master_slice, target_ids)

    # Update project slices
    for child_id, child_slice in delegated_slices.items():
        project.domain_slices[child_id] = child_slice
        await memory_repository.save_slice(child_slice)

    await memory_repository.save_project(project)

    return {
        "status": "success",
        "project_id": project.project_id,
        "root_status": root_agent.status.value,
        "delegated_count": len(delegated_slices),
        "delegated_slices": {
            child_id: sl.content for child_id, sl in delegated_slices.items()
        },
    }


@app.post("/api/architecture/publish")
async def publish_slice(req: PublishSliceRequest) -> Dict[str, Any]:
    """
    Allows a Lead or Specialist to publish their refined domain slice.
    - If author has direct reports, delegates sub-slices downward.
    - If author has a supervisor, triggers EventBusPort.publish_upward_for_approval().
    """
    project = await memory_repository.get_project(req.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{req.project_id}' not found.")

    agent = project.agents.get(req.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{req.agent_id}' not found.")

    existing_slice = project.domain_slices.get(req.agent_id)
    current_version = (existing_slice.version + 1) if existing_slice else 1

    updated_slice = ArchitectureSlice(
        slice_id=f"slice-{agent.id}",
        agent_id=agent.id,
        title=req.title or f"Domain Slice: {agent.role_name}",
        domain_scope=agent.responsibilities,
        content=req.content,
        version=current_version,
        is_finalized=True,
    )
    project.domain_slices[agent.id] = updated_slice
    await memory_repository.save_slice(updated_slice)

    # If author has direct reports, delegate downward
    if agent.children_ids:
        direct_reports = [
            project.agents[cid] for cid in agent.children_ids if cid in project.agents
        ]
        AgentStateMachine.transition_on_delegate(agent, direct_reports)
        sub_slices = await delegation_adapter.slice_architecture(req.content, direct_reports)
        for cid, cslice in sub_slices.items():
            project.domain_slices[cid] = cslice
            await memory_repository.save_slice(cslice)
        await event_bus.publish_downward(updated_slice, [c.id for c in direct_reports])

    # If author has supervisor, submit upward for approval
    if agent.parent_id:
        AgentStateMachine.transition_on_submit_review(agent)
        await event_bus.publish_upward_for_approval(updated_slice, agent.parent_id)

    await memory_repository.save_project(project)

    return {
        "status": "success",
        "agent_id": agent.id,
        "agent_status": agent.status.value,
        "slice_version": updated_slice.version,
        "diff_summary": updated_slice.diff_summary,
    }


@app.post("/api/architecture/approve")
async def approve_slice(req: ApproveSliceRequest) -> Dict[str, Any]:
    """
    Allows a supervisor to accept and merge a subordinate's slice.
    Updates subordinate state to APPROVED and merges slice content into master blueprint.
    """
    project = await memory_repository.get_project(req.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{req.project_id}' not found.")

    supervisor = project.agents.get(req.supervisor_id)
    subordinate = project.agents.get(req.subordinate_id)

    if not supervisor or not subordinate:
        raise HTTPException(status_code=404, detail="Supervisor or subordinate agent not found.")

    subordinate_slice = project.domain_slices.get(subordinate.id)
    if not subordinate_slice:
        raise HTTPException(status_code=400, detail="Subordinate slice not found.")

    # Transition state to APPROVED
    AgentStateMachine.transition_on_approve(supervisor, subordinate)

    # Merge subordinate content into supervisor/master blueprint
    project.master_blueprint += f"\n\n### [APPROVED SLICE] {subordinate.role_name}\n{subordinate_slice.content}"

    # Clear pending approval request
    event_bus.remove_pending_approval(supervisor.id, subordinate.id)

    await memory_repository.save_project(project)

    return {
        "status": "success",
        "supervisor_id": supervisor.id,
        "subordinate_id": subordinate.id,
        "subordinate_status": subordinate.status.value,
        "updated_master_blueprint": project.master_blueprint,
    }


@app.post("/api/chat")
async def chat_with_agent(req: ChatRequest) -> Dict[str, Any]:
    """Handles interactive chat between user and any specific agent node."""
    project = await memory_repository.get_project(req.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{req.project_id}' not found.")

    agent = project.agents.get(req.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{req.agent_id}' not found.")

    reply = await agent_adapter.chat(agent, req.history, req.message)
    return {
        "status": "success",
        "agent_id": agent.id,
        "person_name": agent.person_name,
        "role_name": agent.role_name,
        "reply": reply,
    }


@app.get("/api/project/{project_id}")
async def get_project_state(project_id: str) -> Dict[str, Any]:
    """
    Returns full project tree state, agent statuses, active slices,
    and pending approval diffs.
    """
    project = await memory_repository.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    agents_data = {
        aid: {
            "id": a.id,
            "person_name": a.person_name,
            "role_name": a.role_name,
            "responsibilities": a.responsibilities,
            "parent_id": a.parent_id,
            "children_ids": a.children_ids,
            "status": a.status.value,
        }
        for aid, a in project.agents.items()
    }

    slices_data = {
        aid: {
            "slice_id": sl.slice_id,
            "agent_id": sl.agent_id,
            "title": sl.title,
            "domain_scope": sl.domain_scope,
            "content": sl.content,
            "version": sl.version,
            "is_finalized": sl.is_finalized,
            "diff_summary": sl.diff_summary,
        }
        for aid, sl in project.domain_slices.items()
    }

    pending_approvals = {
        supervisor_id: event_bus.get_pending_approvals_for_supervisor(supervisor_id)
        for supervisor_id in project.agents.keys()
        if event_bus.get_pending_approvals_for_supervisor(supervisor_id)
    }

    return {
        "project_id": project.project_id,
        "name": project.name,
        "root_agent_id": project.root_agent_id,
        "master_blueprint": project.master_blueprint,
        "agents": agents_data,
        "domain_slices": slices_data,
        "pending_approvals": pending_approvals,
    }
