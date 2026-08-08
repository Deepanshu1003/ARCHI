"""The two-document schema, enforced server-side."""

from __future__ import annotations

import pytest

from ...adapters.documents.document_store import DocumentRejectedError, DocumentStore
from ...adapters.governance.governance_adapter import RuleBasedGovernanceAdapter
from ...core.domain.models import DocumentType

pytestmark = pytest.mark.asyncio

PLAN_BODY = "# Plan\n- Build the ingestion service\n- Define the storage schema\n"


@pytest.fixture
def store(settings) -> DocumentStore:
    return DocumentStore(governance=RuleBasedGovernanceAdapter(), settings=settings)


async def test_every_agent_starts_with_two_empty_slots(store, project) -> None:
    documents = await store.list_documents(project.agent("agent-api"))
    assert [doc.doc_type for doc in documents] == [DocumentType.PRINCIPLES, DocumentType.PLAN]
    assert all(not doc.is_populated for doc in documents)


async def test_inline_chat_tag_populates_and_is_stripped(store, project) -> None:
    agent = project.agent("agent-api")
    reply = f"Here you go.\n[DOC_UPDATE: plan | {PLAN_BODY}]\nAnything else?"
    cleaned, written = await store.apply_chat_update(project, agent, reply)

    assert "DOC_UPDATE" not in cleaned
    assert [doc.doc_type for doc in written] == [DocumentType.PLAN]
    assert agent.document(DocumentType.PLAN).is_populated


async def test_block_chat_tag_populates(store, project) -> None:
    agent = project.agent("agent-api")
    reply = f"[DOC_UPDATE: plan]{PLAN_BODY}[/DOC_UPDATE]"
    _, written = await store.apply_chat_update(project, agent, reply)
    assert written[0].content.startswith("# Plan")


async def test_every_update_appends_a_version(store, project) -> None:
    agent = project.agent("agent-api")
    await store.apply_chat_update(project, agent, f"[DOC_UPDATE: plan]{PLAN_BODY}[/DOC_UPDATE]")
    await store.apply_chat_update(
        project, agent, f"[DOC_UPDATE: plan]{PLAN_BODY}- And caching\n[/DOC_UPDATE]"
    )
    document = agent.document(DocumentType.PLAN)
    assert document.version == 2
    assert [v.version for v in document.versions] == [1, 2]


async def test_rejected_chat_document_does_not_break_the_turn(store, project) -> None:
    """A plan with no structure is dropped, but the chat reply still returns."""
    agent = project.agent("agent-api")
    cleaned, written = await store.apply_chat_update(
        project, agent, "[DOC_UPDATE: plan]just a sentence with no structure at all[/DOC_UPDATE]"
    )
    assert written == []
    assert cleaned == ""
    assert not agent.document(DocumentType.PLAN).is_populated


async def test_upload_rejects_unsupported_extensions(store, project) -> None:
    agent = project.agent("agent-api")
    with pytest.raises(DocumentRejectedError):
        await store.apply_upload(
            project, agent, DocumentType.PLAN, "notes.pdf", PLAN_BODY
        )


async def test_upload_populates_the_slot(store, project) -> None:
    agent = project.agent("agent-api")
    document = await store.apply_upload(
        project, agent, DocumentType.PLAN, "plan.md", PLAN_BODY
    )
    assert document.is_populated
    assert document.versions[0].source == "upload:plan.md"


async def test_no_other_document_types_can_be_created(store, project) -> None:
    with pytest.raises(ValueError):
        DocumentType.coerce("roadmap")
