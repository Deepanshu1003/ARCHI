# backend/bridge.py
"""
ARCHI Python Core Bridge Executor
Serves as the single execution bridge between Node/Express server.ts and the pure Python domain core.
All backend state management, AI adapters, state machine transitions, event bus actions, and diff calculations
are executed natively inside this Python 3 engine.
"""

import sys
import json
import asyncio
import os
import difflib

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.adapters.web.fastapi_adapter import (
    create_project,
    create_architecture,
    finalize_architecture,
    publish_slice,
    approve_slice,
    memory_repository,
    agent_adapter,
    delegation_adapter,
    AgentRoleDTO,
    CreateProjectRequest,
    CreateArchitectureRequest,
    FinalizeArchitectureRequest,
    PublishSliceRequest,
    ApproveSliceRequest,
)
from backend.core.domain.models import AgentStatus, AgentRole
from backend.core.domain.state_machine import AgentStateMachine


async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified for Python bridge"}))
        return

    action = sys.argv[1]
    raw_input = sys.stdin.read()
    payload = json.loads(raw_input) if raw_input and raw_input.strip() else {}

    try:
        if action == "health":
            result = {
                "status": "ok",
                "runtime": "Pure Python 3.11+",
                "architecture": "Hexagonal Clean Domain Core (Python)",
                "bridge": "Active"
            }

        elif action == "get_projects":
            projects = await memory_repository.get_all_projects()
            result = projects

        elif action == "save_project":
            await memory_repository.save_raw_project(payload)
            result = {"success": True, "project": payload}

        elif action == "delete_project":
            project_id = payload.get("id") or payload.get("project_id")
            if project_id:
                await memory_repository.delete_project(project_id)
            result = {"success": True, "message": f"Project {project_id} deleted in Python"}

        elif action == "delete_all_projects":
            await memory_repository.delete_all_projects()
            result = {"success": True, "message": "All projects deleted in Python memory repository"}

        elif action == "create_project":
            agents_dtos = [
                AgentRoleDTO(
                    id=a.get("id"),
                    person_name=a.get("personName") or a.get("person_name") or "Agent",
                    role_name=a.get("roleName") or a.get("role_name") or "Specialist",
                    responsibilities=a.get("responsibilities", ""),
                    parent_id=a.get("parentId") or a.get("parent_id"),
                    children_ids=a.get("childrenIds") or a.get("children_ids") or [],
                    status=a.get("status", "idle").upper()
                )
                for a in payload.get("agents", [])
            ]
            req = CreateProjectRequest(
                project_id=payload.get("project_id") or payload.get("id"),
                name=payload.get("name", "ARCHI Architecture Project"),
                root_agent_id=payload.get("root_agent_id") or payload.get("rootAgentId", "root-1"),
                agents=agents_dtos
            )
            result = await create_project(req)

        elif action == "create_architecture":
            req = CreateArchitectureRequest(
                project_id=payload.get("project_id"),
                context=payload.get("context", "")
            )
            result = await create_architecture(req)

        elif action == "finalize_architecture":
            req = FinalizeArchitectureRequest(
                project_id=payload.get("project_id")
            )
            result = await finalize_architecture(req)

        elif action == "publish_slice":
            req = PublishSliceRequest(
                project_id=payload.get("project_id"),
                agent_id=payload.get("agent_id"),
                title=payload.get("title", "Domain Spec"),
                content=payload.get("content", "")
            )
            result = await publish_slice(req)

        elif action == "approve_slice":
            req = ApproveSliceRequest(
                project_id=payload.get("project_id"),
                supervisor_id=payload.get("supervisor_id"),
                subordinate_id=payload.get("subordinate_id")
            )
            result = await approve_slice(req)

        elif action == "chat":
            agent_data = payload.get("agent", {})
            parent_data = payload.get("parentAgent")
            message = payload.get("message", "")
            history = payload.get("history", [])

            agent_role = AgentRole(
                id=agent_data.get("id", "agent-1"),
                person_name=agent_data.get("personName") or agent_data.get("person_name") or "Agent",
                role_name=agent_data.get("roleName") or agent_data.get("role_name") or "Specialist",
                responsibilities=agent_data.get("responsibilities", ""),
                parent_id=agent_data.get("parentId") or agent_data.get("parent_id"),
                children_ids=agent_data.get("childrenIds") or agent_data.get("children_ids") or []
            )

            reply = await agent_adapter.chat(agent=agent_role, history=history, message=message)
            result = {"reply": reply}

        elif action == "delegate":
            supervisor_data = payload.get("supervisor", {})
            reports_data = payload.get("directReports", [])
            parent_plan = payload.get("parentPlan", "")

            sup_role = AgentRole(
                id=supervisor_data.get("id", "sup-1"),
                person_name=supervisor_data.get("personName") or supervisor_data.get("person_name") or "Supervisor",
                role_name=supervisor_data.get("roleName") or supervisor_data.get("role_name") or "Lead",
                responsibilities=supervisor_data.get("responsibilities", "")
            )
            report_roles = [
                AgentRole(
                    id=r.get("id"),
                    person_name=r.get("personName") or r.get("person_name") or "Report",
                    role_name=r.get("roleName") or r.get("role_name") or "Specialist",
                    responsibilities=r.get("responsibilities", "")
                )
                for r in reports_data
            ]

            slices = await delegation_adapter.slice_architecture(master_blueprint=parent_plan, direct_reports=report_roles)
            result = {
                "success": True,
                "delegations": {cid: sl.content for cid, sl in slices.items()}
            }

        elif action == "diff":
            parent = payload.get("parentContent") or payload.get("oldContent") or ""
            author = payload.get("authorContent") or payload.get("newContent") or ""
            diff_lines = list(difflib.unified_diff(
                parent.splitlines(keepends=True),
                author.splitlines(keepends=True),
                fromfile=payload.get("fromFile", "Supervisor Plan"),
                tofile=payload.get("toFile", "Subordinate Sub-Plan")
            ))
            diff_str = "".join(diff_lines)
            result = {
                "diffSummary": diff_str,
                "hasChanges": len(diff_lines) > 0
            }

        elif action == "transition":
            curr_str = (payload.get("currentStatus") or "IDLE").upper()
            target_str = (payload.get("targetStatus") or "DRAFTING").upper()

            try:
                curr_enum = AgentStatus(curr_str)
                target_enum = AgentStatus(target_str)
                is_valid = AgentStateMachine.can_transition(curr_enum, target_enum)
                result = {
                    "newStatus": target_enum.value if is_valid else curr_enum.value,
                    "isValid": is_valid
                }
            except Exception as trans_err:
                result = {
                    "newStatus": curr_str,
                    "isValid": False,
                    "error": str(trans_err)
                }

        else:
            result = {"error": f"Unknown action: {action}"}

        print(json.dumps(result))

    except HTTPException as http_err:
        print(json.dumps({"error": http_err.detail, "status_code": getattr(http_err, "status_code", 400)}))
    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))


if __name__ == "__main__":
    asyncio.run(main())
