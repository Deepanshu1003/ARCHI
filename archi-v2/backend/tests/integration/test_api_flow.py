"""Full HTTP round-trips: create → draft → delegate → submit → approve."""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.asyncio

BASE = "/api/projects"
PLAN_MD = "# Plan\n- Build the ingestion service\n- Define the storage schema\n"


async def create_project(client, payload) -> dict:
    response = await client.post(BASE, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


async def test_health_reports_the_provider_chain(client) -> None:
    body = (await client.get("/api/health")).json()
    assert body["status"] == "ok"
    assert "llmProviders" in body


async def test_project_round_trip_is_camel_case(client, project_payload) -> None:
    created = await create_project(client, project_payload)
    assert created["rootAgentId"] == "agent-root"
    assert created["agents"]["agent-api"]["personName"] == "Grace"
    assert "root_agent_id" not in created

    listed = (await client.get(BASE)).json()
    assert [item["projectId"] for item in listed] == ["project-test"]


async def test_state_survives_across_requests(client, project_payload) -> None:
    """The v1 bug: a fresh Python process per request dropped in-memory state."""
    await create_project(client, project_payload)
    await client.post(
        f"{BASE}/project-test/architecture/draft", json={"agentId": "agent-root"}
    )
    fetched = (await client.get(f"{BASE}/project-test")).json()
    assert "agent-root" in fetched["domainSlices"]


async def test_unknown_project_and_agent_are_404(client, project_payload) -> None:
    assert (await client.get(f"{BASE}/nope")).status_code == 404
    await create_project(client, project_payload)
    response = await client.post(
        f"{BASE}/project-test/chat", json={"agentId": "ghost", "message": "hi"}
    )
    assert response.status_code == 404


async def test_delegation_requires_direct_reports(client, project_payload) -> None:
    await create_project(client, project_payload)
    await client.post(
        f"{BASE}/project-test/architecture/draft", json={"agentId": "agent-api"}
    )
    response = await client.post(
        f"{BASE}/project-test/architecture/delegate", json={"agentId": "agent-api"}
    )
    assert response.status_code == 400
    assert "cannot delegate" in response.json()["detail"].lower()


async def test_divide_then_merge_end_to_end(client, project_payload) -> None:
    await create_project(client, project_payload)

    draft = await client.post(
        f"{BASE}/project-test/architecture/draft", json={"agentId": "agent-root"}
    )
    assert draft.status_code == 200
    assert draft.json()["degradedInfo"]["degraded"] is True

    delegate = await client.post(
        f"{BASE}/project-test/architecture/delegate", json={"agentId": "agent-root"}
    )
    assert delegate.status_code == 200
    body = delegate.json()
    assert sorted(body["recipients"]) == ["agent-api", "agent-ui"]
    assert body["agentStatuses"]["agent-root"] == "DELEGATED"
    assert body["agentStatuses"]["agent-api"] == "DRAFTING"

    submit = await client.post(
        f"{BASE}/project-test/architecture/submit",
        json={"agentId": "agent-api", "content": PLAN_MD},
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["agentStatus"] == "AWAITING_REVIEW"
    assert submit.json()["approval"]["diffText"]

    approve = await client.post(
        f"{BASE}/project-test/architecture/approve",
        json={"supervisorId": "agent-root", "subordinateId": "agent-api"},
    )
    assert approve.status_code == 200, approve.text
    merged = approve.json()
    assert "Build the ingestion service" in merged["mergedContent"]
    assert merged["agentStatuses"]["agent-api"] == "APPROVED"


async def test_approval_without_submission_is_rejected(client, project_payload) -> None:
    await create_project(client, project_payload)
    response = await client.post(
        f"{BASE}/project-test/architecture/approve",
        json={"supervisorId": "agent-root", "subordinateId": "agent-api"},
    )
    assert response.status_code == 400


async def test_chat_writes_a_document_slot(client, project_payload) -> None:
    await create_project(client, project_payload)
    response = await client.post(
        f"{BASE}/project-test/chat",
        json={"agentId": "agent-api", "message": "what is your scope?"},
    )
    assert response.status_code == 200
    assert response.json()["degradedInfo"]["degraded"] is True

    documents = (
        await client.get(f"{BASE}/project-test/agents/agent-api/documents")
    ).json()["documents"]
    assert [doc["docType"] for doc in documents] == ["principles", "plan"]
    assert all(doc["isPopulated"] is False for doc in documents)


async def test_upload_populates_and_versions_a_slot(client, project_payload) -> None:
    await create_project(client, project_payload)
    url = f"{BASE}/project-test/agents/agent-api/documents/plan/upload"

    response = await client.post(url, files={"file": ("plan.md", PLAN_MD, "text/markdown")})
    assert response.status_code == 200, response.text
    assert response.json()["document"]["version"] == 1

    again = await client.post(
        url, files={"file": ("plan.md", PLAN_MD + "- And caching\n", "text/markdown")}
    )
    assert again.json()["document"]["version"] == 2
    assert len(again.json()["document"]["versions"]) == 2


async def test_upload_rejects_unsupported_file_types(client, project_payload) -> None:
    await create_project(client, project_payload)
    response = await client.post(
        f"{BASE}/project-test/agents/agent-api/documents/plan/upload",
        files={"file": ("plan.pdf", PLAN_MD, "application/pdf")},
    )
    assert response.status_code == 422


async def test_persistence_outlives_the_app_instance(client, project_payload, app) -> None:
    """A second app over the same data dir sees the same projects."""
    await create_project(client, project_payload)

    from ...adapters.memory.repository import JsonFileRepository
    from ...config.settings import get_settings

    settings = app.dependency_overrides[get_settings]()
    reloaded = await JsonFileRepository(settings).get_project("project-test")
    assert reloaded is not None
    assert reloaded.name == "Test Project"
