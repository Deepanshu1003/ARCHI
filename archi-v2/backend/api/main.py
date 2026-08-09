"""FastAPI entrypoint. One process, owning all state, with no Node in front."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..config.settings import get_settings
from .routers import architecture, chat, documents, projects

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="ARCHI v2",
        version="2.0.0",
        description="Multi-agent architecture planning backend.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(projects.router)
    app.include_router(architecture.router)
    app.include_router(chat.router)
    app.include_router(documents.router)

    @app.get("/api/health", tags=["health"])
    async def health() -> dict:
        return {
            "status": "ok",
            "llmProviders": settings.llm_provider_chain,
            "geminiModels": settings.gemini_models,
            "geminiConfigured": settings.has_gemini_key,
            "geminiThinkingLevel": settings.gemini_thinking_level,
            "geminiTimeoutSeconds": settings.gemini_timeout_seconds,
        }

    return app


app = create_app()
