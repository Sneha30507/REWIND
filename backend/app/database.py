"""Database engine, session factory and the declarative Base."""

from collections.abc import Iterator
from typing import Any

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    """All models inherit from this."""


def make_engine(url: str, **engine_kwargs: Any) -> Engine:
    """Create an engine. For SQLite, allow use across threads and enforce foreign keys."""
    is_sqlite = url.startswith("sqlite")
    if is_sqlite:
        engine_kwargs.setdefault("connect_args", {"check_same_thread": False})
    engine = create_engine(url, **engine_kwargs)

    if is_sqlite:

        @event.listens_for(engine, "connect")
        def _enable_foreign_keys(dbapi_connection, _connection_record) -> None:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


engine = make_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request, always closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
