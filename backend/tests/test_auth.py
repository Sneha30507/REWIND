from datetime import timedelta

from app.core.config import get_settings
from app.core.security import create_access_token

PASSWORD = "correct-horse-battery"


def test_register_success_hides_password(client):
    response = client.post(
        "/api/auth/register", json={"email": "New@Example.com ", "password": PASSWORD}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new@example.com"  # trimmed + lowercased
    assert "password" not in body
    assert "password_hash" not in body
    assert PASSWORD not in response.text


def test_register_duplicate_email_conflict(client):
    client.post("/api/auth/register", json={"email": "a@example.com", "password": PASSWORD})
    response = client.post(
        "/api/auth/register", json={"email": "A@EXAMPLE.com", "password": PASSWORD}
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "email_taken"


def test_register_validation(client):
    short = client.post("/api/auth/register", json={"email": "a@example.com", "password": "short"})
    assert short.status_code == 422
    bad_email = client.post(
        "/api/auth/register", json={"email": "not-an-email", "password": PASSWORD}
    )
    assert bad_email.status_code == 422
    assert bad_email.json()["error"]["code"] == "validation_error"
    missing = client.post("/api/auth/register", json={})
    assert missing.status_code == 422


def test_login_success(client):
    client.post("/api/auth/register", json={"email": "a@example.com", "password": PASSWORD})
    response = client.post("/api/auth/login", json={"email": "a@example.com", "password": PASSWORD})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["expires_in"] > 0


def test_login_wrong_password_and_unknown_email_look_the_same(client):
    client.post("/api/auth/register", json={"email": "a@example.com", "password": PASSWORD})
    wrong = client.post("/api/auth/login", json={"email": "a@example.com", "password": "nope-nope"})
    unknown = client.post("/api/auth/login", json={"email": "zzz@example.com", "password": PASSWORD})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_me_requires_token_and_returns_user(client, auth_headers):
    assert client.get("/api/auth/me").status_code == 401
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_invalid_expired_and_forged_tokens_rejected(client, auth_headers):
    settings = get_settings()

    def bearer(token):
        return {"Authorization": f"Bearer {token}"}

    assert client.get("/api/auth/me", headers=bearer("garbage")).status_code == 401

    expired = create_access_token(
        "1", secret_key=settings.secret_key, algorithm=settings.jwt_algorithm,
        expires_delta=timedelta(seconds=-5),
    )
    assert client.get("/api/auth/me", headers=bearer(expired)).status_code == 401

    forged = create_access_token(
        "1", secret_key="x" * 40, algorithm=settings.jwt_algorithm,
        expires_delta=timedelta(minutes=5),
    )
    assert client.get("/api/auth/me", headers=bearer(forged)).status_code == 401

    no_such_user = create_access_token(
        "99999", secret_key=settings.secret_key, algorithm=settings.jwt_algorithm,
        expires_delta=timedelta(minutes=5),
    )
    assert client.get("/api/auth/me", headers=bearer(no_such_user)).status_code == 401


def test_unauthorized_response_has_www_authenticate_header(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.json()["error"]["code"] == "unauthorized"
