import pytest


def create(client, headers, **overrides):
    payload = {
        "title": "Weather App",
        "description": "Live forecast dashboard",
        "status": "active",
        "progress": 40,
        "tags": ["React", "CSS"],
    }
    payload.update(overrides)
    response = client.post("/api/projects", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# ---------- create ----------

def test_create_project(client, auth_headers):
    project = create(client, auth_headers)
    assert project["id"] > 0
    assert project["title"] == "Weather App"
    assert project["description"] == "Live forecast dashboard"
    assert project["status"] == "active"
    assert project["progress"] == 40
    assert project["tags"] == ["React", "CSS"]
    assert project["created_at"].endswith("+00:00")
    assert project["updated_at"].endswith("+00:00")
    assert "owner_id" not in project


def test_create_uses_defaults(client, auth_headers):
    response = client.post("/api/projects", json={"title": "Just a title"}, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["description"] == ""
    assert body["status"] == "active"
    assert body["progress"] == 0
    assert body["tags"] == []


def test_title_is_trimmed(client, auth_headers):
    assert create(client, auth_headers, title="  Padded  ")["title"] == "Padded"


@pytest.mark.parametrize("title", ["", "   ", "x" * 201])
def test_invalid_title_rejected(client, auth_headers, title):
    response = client.post("/api/projects", json={"title": title}, headers=auth_headers)
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert any(d["field"].endswith("title") for d in error["details"])


@pytest.mark.parametrize(
    "extra",
    [{"status": "done"}, {"progress": -1}, {"progress": 101}, {"progress": "lots"}],
)
def test_invalid_status_or_progress_rejected(client, auth_headers, extra):
    response = client.post("/api/projects", json={"title": "t", **extra}, headers=auth_headers)
    assert response.status_code == 422


def test_tags_are_trimmed_and_deduplicated(client, auth_headers):
    assert create(client, auth_headers, tags=[" react ", "React", "ts"])["tags"] == ["react", "ts"]


def test_invalid_tags_rejected(client, auth_headers):
    for tags in ([f"t{i}" for i in range(21)], ["ok", "  "], ["x" * 31]):
        response = client.post("/api/projects", json={"title": "t", "tags": tags}, headers=auth_headers)
        assert response.status_code == 422


# ---------- read / list ----------

def test_list_empty(client, auth_headers):
    response = client.get("/api/projects", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "limit": 20, "offset": 0}


def test_list_newest_first(client, auth_headers):
    first = create(client, auth_headers, title="First")
    second = create(client, auth_headers, title="Second")
    items = client.get("/api/projects", headers=auth_headers).json()["items"]
    assert [p["id"] for p in items] == [second["id"], first["id"]]


def test_pagination(client, auth_headers):
    for i in range(5):
        create(client, auth_headers, title=f"Project {i}")
    body = client.get("/api/projects?limit=2&offset=2", headers=auth_headers).json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["limit"] == 2 and body["offset"] == 2


@pytest.mark.parametrize("query", ["limit=0", "limit=101", "offset=-1", "limit=abc"])
def test_bad_pagination_rejected(client, auth_headers, query):
    assert client.get(f"/api/projects?{query}", headers=auth_headers).status_code == 422


def test_status_filter(client, auth_headers):
    create(client, auth_headers, title="A", status="completed")
    create(client, auth_headers, title="B", status="planning")
    body = client.get("/api/projects?status=completed", headers=auth_headers).json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "A"
    assert client.get("/api/projects?status=nope", headers=auth_headers).status_code == 422


def test_search_title_or_description_case_insensitive(client, auth_headers):
    create(client, auth_headers, title="Online Voting", description="admin panel")
    create(client, auth_headers, title="Portfolio", description="Contains VOTING widget")
    create(client, auth_headers, title="Expense Tracker", description="monthly charts")
    body = client.get("/api/projects?q=voting", headers=auth_headers).json()
    assert body["total"] == 2
    assert {p["title"] for p in body["items"]} == {"Online Voting", "Portfolio"}


def test_search_treats_wildcards_literally(client, auth_headers):
    create(client, auth_headers, title="100% done")
    create(client, auth_headers, title="Something else")
    assert client.get("/api/projects?q=%25", headers=auth_headers).json()["total"] == 1
    assert client.get("/api/projects?q=_", headers=auth_headers).json()["total"] == 0


def test_blank_search_returns_everything(client, auth_headers):
    create(client, auth_headers)
    assert client.get("/api/projects?q=%20%20", headers=auth_headers).json()["total"] == 1


def test_get_project_by_id(client, auth_headers):
    created = create(client, auth_headers)
    response = client.get(f"/api/projects/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == created


def test_get_missing_project_404(client, auth_headers):
    response = client.get("/api/projects/9999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_non_numeric_id_rejected(client, auth_headers):
    assert client.get("/api/projects/abc", headers=auth_headers).status_code == 422


# ---------- update ----------

def test_update_replaces_project(client, auth_headers):
    created = create(client, auth_headers)
    response = client.put(
        f"/api/projects/{created['id']}",
        json={"title": "Renamed", "description": "", "status": "completed", "progress": 100, "tags": []},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["title"] == "Renamed"
    assert body["status"] == "completed"
    assert body["progress"] == 100
    assert body["tags"] == []
    assert body["created_at"] == created["created_at"]
    assert body["updated_at"] >= created["updated_at"]
    # and the change is really stored
    assert client.get(f"/api/projects/{created['id']}", headers=auth_headers).json() == body


def test_update_validates_input(client, auth_headers):
    created = create(client, auth_headers)
    response = client.put(
        f"/api/projects/{created['id']}", json={"title": "", "status": "active"}, headers=auth_headers
    )
    assert response.status_code == 422


def test_update_missing_project_404(client, auth_headers):
    response = client.put("/api/projects/9999", json={"title": "x"}, headers=auth_headers)
    assert response.status_code == 404


# ---------- delete ----------

def test_delete_project(client, auth_headers):
    created = create(client, auth_headers)
    response = client.delete(f"/api/projects/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"deleted": True, "id": created["id"]}
    assert client.get(f"/api/projects/{created['id']}", headers=auth_headers).status_code == 404
    assert client.get("/api/projects", headers=auth_headers).json()["total"] == 0


def test_delete_missing_project_404(client, auth_headers):
    assert client.delete("/api/projects/9999", headers=auth_headers).status_code == 404


# ---------- authentication & isolation ----------

@pytest.mark.parametrize(
    "method,path",
    [
        ("post", "/api/projects"),
        ("get", "/api/projects"),
        ("get", "/api/projects/1"),
        ("put", "/api/projects/1"),
        ("delete", "/api/projects/1"),
    ],
)
def test_projects_require_login(client, method, path):
    kwargs = {"json": {"title": "x"}} if method in ("post", "put") else {}
    response = getattr(client, method)(path, **kwargs)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_garbage_token_rejected(client):
    response = client.get("/api/projects", headers={"Authorization": "Bearer not.a.token"})
    assert response.status_code == 401


def test_users_cannot_see_or_change_each_others_projects(client, auth_headers, other_headers):
    mine = create(client, auth_headers, title="Alice private")

    assert client.get("/api/projects", headers=other_headers).json()["total"] == 0
    assert client.get("/api/projects?q=Alice", headers=other_headers).json()["total"] == 0
    assert client.get(f"/api/projects/{mine['id']}", headers=other_headers).status_code == 404
    put = client.put(f"/api/projects/{mine['id']}", json={"title": "Hacked"}, headers=other_headers)
    assert put.status_code == 404
    assert client.delete(f"/api/projects/{mine['id']}", headers=other_headers).status_code == 404

    # still intact for the owner
    still = client.get(f"/api/projects/{mine['id']}", headers=auth_headers)
    assert still.status_code == 200
    assert still.json()["title"] == "Alice private"
