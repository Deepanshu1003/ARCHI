"""Persistence round-trips, including the state v1 lost on reload."""

from __future__ import annotations

import pytest

from ...adapters.memory.repository import JsonFileRepository
from ...core.domain.models import AgentStatus, DocumentType

pytestmark = pytest.mark.asyncio


async def test_status_survives_a_reload(settings, project) -> None:
    """v1 reset every agent to IDLE here, because of an enum casing mismatch."""
    project.agent("agent-api").status = AgentStatus.AWAITING_REVIEW
    await JsonFileRepository(settings).save_project(project)

    reloaded = await JsonFileRepository(settings).get_project(project.project_id)
    assert reloaded is not None
    assert reloaded.agent("agent-api").status is AgentStatus.AWAITING_REVIEW


async def test_document_versions_survive_a_reload(settings, project) -> None:
    document = project.agent("agent-api").document(DocumentType.PLAN)
    document.apply_update("# Plan\n- one\n", author="agent-api", source="chat")
    document.apply_update("# Plan\n- one\n- two\n", author="agent-api", source="chat")
    await JsonFileRepository(settings).save_project(project)

    reloaded = await JsonFileRepository(settings).get_project(project.project_id)
    restored = reloaded.agent("agent-api").document(DocumentType.PLAN)
    assert restored.version == 2
    assert [v.version for v in restored.versions] == [1, 2]


async def test_empty_slots_survive_a_reload(settings, project) -> None:
    await JsonFileRepository(settings).save_project(project)
    reloaded = await JsonFileRepository(settings).get_project(project.project_id)
    documents = reloaded.agent("agent-ui").documents
    assert set(documents) == set(DocumentType)
    assert all(not doc.is_populated for doc in documents.values())


async def test_delete_removes_the_project(settings, project) -> None:
    repository = JsonFileRepository(settings)
    await repository.save_project(project)
    await repository.delete_project(project.project_id)
    assert await repository.get_project(project.project_id) is None
    assert await JsonFileRepository(settings).list_projects() == []
