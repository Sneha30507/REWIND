"""FastAPI application entry point.

Run from the backend/ folder:   uvicorn app.main:app --reload --port 8000
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers the tables on Base.metadata)
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.database import Base, engine
from app.routers import auth, health, memories


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Phase 1 setup: create any missing tables on startup (existing tables and
    # data are left untouched). See README for why Alembic is not used yet.
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Backend for the Rewind AI dashboard (Phase 1: auth + memories).",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,  # we use Bearer tokens, not cookies
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(application)
    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(memories.router)
    return application


app = create_app()
