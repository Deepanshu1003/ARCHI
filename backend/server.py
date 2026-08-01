# backend/server.py
"""
ARCHI Persistent Python Core HTTP Server
Runs as a persistent background daemon process launched by server.ts on startup.
Communicates with Node.js Express backend via HTTP REST over port 3002.
Uses ONLY Python Standard Library (http.server, json, urllib, asyncio, difflib), requiring zero external pip dependencies.
"""

import http.server
import socketserver
import json
import urllib.parse
import sys
import os
import asyncio
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

PORT = 3002


class ArchiHTTPRequestHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default stdout HTTP logging for cleaner logs
        pass

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/api/python/health" or path == "/health":
            self.send_json_response({
                "status": "ok",
                "runtime": "Pure Python 3.11+ Persistent Server",
                "architecture": "Hexagonal Clean Domain Core (Python)",
                "transport": "HTTP REST (Persistent Daemon)"
            })
        elif path == "/api/python/projects" or path == "/get_projects":
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                projects = loop.run_until_complete(memory_repository.get_all_projects())
                self.send_json_response(projects)
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            finally:
                loop.close()
        else:
            self.send_json_response({"error": f"Not found: {path}"}, status=404)

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        content_length = int(self.headers.get('Content-Length', 0))
        raw_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            payload = json.loads(raw_body) if raw_body.strip() else {}
        except Exception:
            payload = {}

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            result = loop.run_until_complete(self.handle_action_async(path, payload))
            self.send_json_response(result)
        except Exception as e:
            import traceback
            self.send_json_response({"error": str(e), "traceback": traceback.format_exc()}, status=500)
        finally:
            loop.close()

    async def handle_action_async(self, path: str, payload: dict):
        if path == "/api/python/diff" or path == "/diff":
            parent = payload.get("parentContent") or payload.get("oldContent") or ""
            author = payload.get("authorContent") or payload.get("newContent") or ""
            diff_lines = list(difflib.unified_diff(
                parent.splitlines(keepends=True),
                author.splitlines(keepends=True),
                fromfile=payload.get("fromFile", "Supervisor Plan"),
                tofile=payload.get("toFile", "Subordinate Sub-Plan")
            ))
            return {
                "diffSummary": "".join(diff_lines),
                "hasChanges": len(diff_lines) > 0
            }

        elif path == "/api/python/transition" or path == "/transition":
            curr_str = (payload.get("currentStatus") or "IDLE").upper()
            target_str = (payload.get("targetStatus") or "DRAFTING").upper()
            try:
                curr_enum = AgentStatus(curr_str)
                target_enum = AgentStatus(target_str)
                is_valid = AgentStateMachine.can_transition(curr_enum, target_enum)
                return {
                    "newStatus": target_enum.value if is_valid else curr_enum.value,
                    "isValid": is_valid
                }
            except Exception as trans_err:
                return {
                    "newStatus": curr_str,
                    "isValid": False,
                    "error": str(trans_err)
                }

        elif path == "/api/python/projects" or path == "/save_project":
            await memory_repository.save_raw_project(payload)
            return {"success": True, "project": payload}

        elif path == "/api/python/delete_project" or path == "/delete_project":
            project_id = payload.get("id") or payload.get("project_id")
            if project_id:
                await memory_repository.delete_project(project_id)
            return {"success": True, "message": f"Project {project_id} deleted"}

        elif path == "/api/python/delete_all_projects" or path == "/delete_all_projects":
            await memory_repository.delete_all_projects()
            return {"success": True, "message": "All projects deleted"}

        elif path == "/api/project/create" or path == "/create_project":
            agents_dtos = [
                AgentRoleDTO(
                    id=a.get("id"),
                    person_name=a.get("personName") or a.get("person_name") or "Agent",
                    role_name=a.get("roleName") or a.get("role_name") or "Specialist",
                    responsibilities=a.get("responsibilities", ""),
                    parent_id=a.get("parentId") or a.get("parent_id"),
                    children_ids=a.get("childrenIds") or a.get("children_ids") or [],
                    status=a.get("status", "IDLE").upper()
                )
                for a in payload.get("agents", [])
            ]
            req = CreateProjectRequest(
                project_id=payload.get("project_id") or payload.get("id"),
                name=payload.get("name", "ARCHI Architecture Project"),
                root_agent_id=payload.get("root_agent_id") or payload.get("rootAgentId", "root-1"),
                agents=agents_dtos
            )
            return await create_project(req)

        elif path == "/api/architecture/create" or path == "/create_architecture":
            req = CreateArchitectureRequest(
                project_id=payload.get("project_id"),
                context=payload.get("context", "")
            )
            return await create_architecture(req)

        elif path == "/api/architecture/finalize" or path == "/finalize_architecture":
            req = FinalizeArchitectureRequest(
                project_id=payload.get("project_id")
            )
            return await finalize_architecture(req)

        elif path == "/api/architecture/publish" or path == "/publish_slice":
            req = PublishSliceRequest(
                project_id=payload.get("project_id"),
                agent_id=payload.get("agent_id"),
                title=payload.get("title", "Domain Spec"),
                content=payload.get("content", "")
            )
            return await publish_slice(req)

        elif path == "/api/architecture/approve" or path == "/approve_slice":
            req = ApproveSliceRequest(
                project_id=payload.get("project_id"),
                supervisor_id=payload.get("supervisor_id"),
                subordinate_id=payload.get("subordinate_id")
            )
            return await approve_slice(req)

        elif path == "/api/chat" or path == "/chat":
            agent_data = payload.get("agent", {})
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
            return {"reply": reply}

        elif path == "/api/delegate" or path == "/delegate":
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
            return {
                "success": True,
                "delegations": {cid: sl.content for cid, sl in slices.items()}
            }

        else:
            return {"error": f"Unknown endpoint: {path}"}

    def send_json_response(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run():
    server_address = ('127.0.0.1', PORT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(server_address, ArchiHTTPRequestHandler)
    print(f"🚀 ARCHI Python Persistent Core HTTP Server running on http://127.0.0.1:{PORT}")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    run()
