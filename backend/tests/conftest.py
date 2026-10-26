"""Shared test setup.

Environment variables are set BEFORE the app is imported, so tests never read
your real .env or touch your real rewind.db. Each test gets a fresh in-memory
SQLite database.
"""

import os

os.environ["SECRET_KEY"] = "test-secret-key-only-for-pytest-0123456789abcdef"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["CORS_ORIGINS"] = "http://localhost:3000,http://127.0.0.1:3000"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_db, make_engine  # noqa: E402
from app.main import app  # noqa: E402

PASSWORD = "correct-horse-battery"


@pytest.fixture()
def client():
    engine = make_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    # No "with" block on purpose: it would run the startup code against the real engine.
    yield TestClient(app)
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


def _login_headers(client: TestClient, email: str) -> dict[str, str]:
    created = client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    assert created.status_code == 201, created.text
    login = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


@pytest.fixture()
def auth_headers(client):
    """Headers for a registered, logged-in user (alice)."""
    return _login_headers(client, "alice@example.com")


@pytest.fixture()
def other_headers(client):
    """Headers for a second, different user (bob)."""
    return _login_headers(client, "bob@example.com")
