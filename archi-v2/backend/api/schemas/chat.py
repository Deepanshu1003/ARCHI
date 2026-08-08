"""DTOs for agent chat and document endpoints."""

from __future__ import annotations

from typing import List

from pydantic import Field

from .architecture import DegradedInfo
from .base import CamelModel
from .projects import DocumentOut


class ChatRequest(CamelModel):
    agent_id: str
    message: str


class ChatResponse(CamelModel):
    agent_id: str
    reply: str
    documents_written: List[DocumentOut] = Field(default_factory=list)
    degraded_info: DegradedInfo = Field(default_factory=DegradedInfo)


class DocumentListResponse(CamelModel):
    agent_id: str
    documents: List[DocumentOut]


class DocumentUploadResponse(CamelModel):
    agent_id: str
    document: DocumentOut
