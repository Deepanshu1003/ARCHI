"""
ARCHI Python Core Gateway — FastAPI Adapter
Exposes pure Python domain core models, state machine, and diff engine over HTTP REST endpoints.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import difflib

from backend.core.domain.models import AgentStatus, ArchitectureSlice, AgentRole
from backend.core.domain.state_machine import AgentStateMachine

app = FastAPI(
    title="ARCHI Pure Python Core Gateway",
    description="HTTP REST API exposing the ARCHI hexagonal Python domain core.",
    version="1.0.0"
)

class DiffRequest(BaseModel):
    parentContent: str
    authorContent: str
    fromFile: Optional[str] = "Supervisor Plan"
    toFile: Optional[str] = "Subordinate Sub-Plan"

class DiffResponse(BaseModel):
    diffSummary: str
    hasChanges: bool

class StateTransitionRequest(BaseModel):
    currentStatus: str
    targetStatus: str

class StateTransitionResponse(BaseModel):
    newStatus: str
    isValid: bool

@app.get("/api/python/health")
def health_check():
    return {
        "status": "ok",
        "runtime": "Pure Python 3.11+",
        "architecture": "Hexagonal Domain Core"
    }

@app.post("/api/python/diff", response_model=DiffResponse)
def calculate_diff(req: DiffRequest):
    diff_lines = list(difflib.unified_diff(
        req.parentContent.splitlines(keepends=True),
        req.authorContent.splitlines(keepends=True),
        fromfile=req.fromFile,
        tofile=req.toFile,
    ))
    diff_summary = "".join(diff_lines)
    return DiffResponse(
        diffSummary=diff_summary,
        hasChanges=len(diff_lines) > 0
    )

@app.post("/api/python/transition", response_model=StateTransitionResponse)
def transition_state(req: StateTransitionRequest):
    try:
        current_enum = AgentStatus(req.currentStatus.lower())
        target_enum = AgentStatus(req.targetStatus.lower())
        
        # Validate transition using deterministic AgentStateMachine
        state_machine = AgentStateMachine(agent_id="gateway-check", initial_status=current_enum)
        
        if target_enum == AgentStatus.DRAFTING:
            state_machine.start_drafting()
        elif target_enum == AgentStatus.DELEGATED:
            state_machine.delegate_subplans()
        elif target_enum == AgentStatus.AWAITING_REVIEW:
            state_machine.submit_for_review()
        elif target_enum == AgentStatus.APPROVED:
            state_machine.approve_slice()
        else:
            raise ValueError(f"Unsupported target status: {target_enum}")

        return StateTransitionResponse(
            newStatus=state_machine.get_status().value,
            isValid=True
        )
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
