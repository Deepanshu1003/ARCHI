"""An app instance wired to a temp data dir and the offline provider."""

from __future__ import annotations

from typing import AsyncIterator, Dict

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from ...adapters.llm.fallback_chain import FallbackChainAdapter
from ...adapters.llm.offline_adapter import OfflineAdapter
from ...adapters.memory.repository import JsonFileRepository
from ...api import deps
from ...api.main import create_app
from ...config.settings import get_settings


@pytest.fixture
def app(settings):
    application = create_app()
    repository = JsonFileRepository(settings)
    intelligence = FallbackChainAdapter([OfflineAdapter()], settings)
    application.dependency_overrides[deps.get_repository] = lambda: repository
    application.dependency_overrides[deps.get_intelligence] = lambda: intelligence
    application.dependency_overrides[get_settings] = lambda: settings
    return application


@pytest_asyncio.fixture
async def client(app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client


@pytest.fixture
def project_payload() -> Dict:
    """camelCase, exactly as the frontend sends it."""
    return {
        "projectId": "project-test",
        "name": "Test Project",
        "description": "Fixture project",
        "rootAgentId": "agent-root",
        "agents": [
            {
                "id": "agent-root",
                "personName": "Ada",
                "roleName": "Chief Architect",
                "responsibilities": "Overall system architecture",
                "childrenIds": ["agent-api", "agent-ui"],
            },
            {
                "id": "agent-api",
                "personName": "Grace",
                "roleName": "Backend Lead",
                "responsibilities": "Backend services and data",
                "parentId": "agent-root",
            },
            {
                "id": "agent-ui",
                "personName": "Linus",
                "roleName": "Frontend Lead",
                "responsibilities": "Web client",
                "parentId": "agent-root",
            },
        ],
    }
