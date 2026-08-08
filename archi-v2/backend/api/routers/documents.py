"""The two document slots: read and upload.

Chat-driven writes happen in the chat router; both paths share the same
server-side store, so the schema cannot be bypassed from the API.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ...adapters.documents.document_store import DocumentRejectedError
from ...core.domain.models import DocumentType
from ..deps import ProjectServices, get_project_services
from ..schemas.chat import DocumentListResponse, DocumentUploadResponse
from ..schemas.projects import DocumentOut

router = APIRouter(prefix="/api/projects/{project_id}/agents/{agent_id}/documents", tags=["documents"])


def _coerce_type(doc_type: str) -> DocumentType:
    try:
        return DocumentType.coerce(doc_type)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown document type '{doc_type}'. Expected 'principles' or 'plan'.",
        ) from exc


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    agent_id: str, services: ProjectServices = Depends(get_project_services)
) -> DocumentListResponse:
    agent = services.agent(agent_id)
    documents = await services.documents.list_documents(agent)
    return DocumentListResponse(
        agent_id=agent.id, documents=[DocumentOut.from_domain(doc) for doc in documents]
    )


@router.post("/{doc_type}/upload", response_model=DocumentUploadResponse)
async def upload_document(
    agent_id: str,
    doc_type: str,
    file: UploadFile = File(...),
    services: ProjectServices = Depends(get_project_services),
) -> DocumentUploadResponse:
    agent = services.agent(agent_id)
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only UTF-8 encoded text files are supported.",
        ) from exc

    try:
        document = await services.documents.apply_upload(
            services.project,
            agent,
            _coerce_type(doc_type),
            file.filename or "upload.md",
            text,
        )
    except DocumentRejectedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.violations
        ) from exc

    await services.save()
    return DocumentUploadResponse(
        agent_id=agent.id, document=DocumentOut.from_domain(document)
    )
