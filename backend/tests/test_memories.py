from datetime import datetime

import pytest


def create(client, headers, **overrides):
    payload = {
        "title": "Meeting notes",
        "content": "Discussed the roadmap",
        "category": "work",
        "tags": ["meeting", "roadmap"],
    }
    payload.update(overrides)
    response = client.post("/api/memories", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# ---------- create ----------

def test_create_memory(client, auth_headers):
    memory = create(client, auth_headers)
    assert memory["id"] > 0
    assert memory["title"] == "Meeting notes"
    assert memory["category"] == "work"
    assert memory["tags"] == ["meeting", "roadmap"]
    assert memory["created_at"].endswith("+00:00")
    assert memory["updated_at"].endswith("+00:00")
    assert "owner_id" not in memory


def test_create_uses_defaults(client, auth_headers):
    response = client.post("/api/memories", json={"title": "Just a title"}, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["content"] == ""
    assert body["category"] == "general"
    assert body["tags"] == []


def test_title_is_trimmed(client, auth_headers):
    assert create(client, auth_headers, title="  Padded  ")["title"] == "Padded"


@pytest.mark.parametrize("title", ["", "   ", "x" * 201])
def test_invalid_title_rejected(client, auth_headers, title):
    response = client.post("/api/memories", json={"title": title}, headers=auth_headers)
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert any(d["field"].endswith("title") for d in error["details"])


def test_missing_title_rejected(client, auth_headers):
    response = client.post("/api/memories", json={"content": "no title"}, headers=auth_headers)
    assert response.status_code == 422


def test_invalid_tags_rejected(client, auth_headers):
    too_many = client.post(
        "/api/memories",
        json={"title": "t", "tags": [f"tag{i}" for i in range(21)]},
        headers=auth_headers,
    )
    blank = client.post("/api/memories", json={"title": "t", "tags": ["ok", "  "]}, headers=auth_headers)
    too_long = client.post("/api/memories", json={"title": "t", "tags": ["x" * 31]}, headers=auth_headers)
    assert too_many.status_code == blank.status_code == too_long.status_code == 422


def test_tags_are_trimmed_and_deduplicated(client, auth_headers):
    memory = create(client, auth_headers, tags=[" react ", "React", "ts"])
    assert memory["tags"] == ["react", "ts"]


def test_malformed_json_rejected(client, auth_headers):
    response = client.post(
        "/api/memories",
        content="{not json",
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert response.status_code == 422


# ---------- read / list ----------

def test_list_empty(client, auth_headers):
    response = client.get("/api/memories", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "limit": 20, "offset": 0}


def test_list_newest_first(client, auth_headers):
    first = create(client, auth_headers, title="First")
    second = create(client, auth_headers, title="Second")
    items = client.get("/api/memories", headers=auth_headers).json()["items"]
    assert [m["id"] for m in items] == [second["id"], first["id"]]


def test_pagination(client, auth_headers):
    for i in range(5):
        create(client, auth_headers, title=f"Memory {i}")
    body = client.get("/api/memories?limit=2&offset=2", headers=auth_headers).json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["limit"] == 2 and body["offset"] == 2
    last = client.get("/api/memories?limit=2&offset=4", headers=auth_headers).json()
    assert len(last["items"]) == 1


@pytest.mark.parametrize("query", ["limit=0", "limit=101", "offset=-1", "limit=abc"])
def test_bad_pagination_rejected(client, auth_headers, query):
    assert client.get(f"/api/memories?{query}", headers=auth_headers).status_code == 422


def test_category_filter_is_case_insensitive(client, auth_headers):
    create(client, auth_headers, title="A", category="Work")
    create(client, auth_headers, title="B", category="personal")
    body = client.get("/api/memories?category=work", headers=auth_headers).json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "A"


def test_get_memory_by_id(client, auth_headers):
    created = create(client, auth_headers)
    response = client.get(f"/api/memories/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == created


def test_get_missing_memory_404(client, auth_headers):
    response = client.get("/api/memories/9999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_non_numeric_id_rejected(client, auth_headers):
    assert client.get("/api/memories/abc", headers=auth_headers).status_code == 422


# ---------- update ----------

def test_update_memory(client, auth_headers):
    created = create(client, auth_headers)
    response = client.put(
        f"/api/memories/{created['id']}",
        json={"title": "New title", "content": "New content", "category": "ideas", "tags": ["x"]},
        headers=auth_headers,
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["id"] == created["id"]
    assert updated["title"] == "New title"
    assert updated["content"] == "New content"
    assert updated["category"] == "ideas"
    assert updated["tags"] == ["x"]
    assert updated["created_at"] == created["created_at"]
    assert datetime.fromisoformat(updated["updated_at"]) >= datetime.fromisoformat(created["updated_at"])
    # and it is really saved
    assert client.get(f"/api/memories/{created['id']}", headers=auth_headers).json() == updated


def test_update_validation_and_404(client, auth_headers):
    created = create(client, auth_headers)
    blank = client.put(f"/api/memories/{created['id']}", json={"title": " "}, headers=auth_headers)
    assert blank.status_code == 422
    missing = client.put("/api/memories/9999", json={"title": "x"}, headers=auth_headers)
    assert missing.status_code == 404


# ---------- delete ----------

def test_delete_memory(client, auth_headers):
    created = create(client, auth_headers)
    response = client.delete(f"/api/memories/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"deleted": True, "id": created["id"]}
    assert client.get(f"/api/memories/{created['id']}", headers=auth_headers).status_code == 404


def test_delete_missing_404(client, auth_headers):
    assert client.delete("/api/memories/9999", headers=auth_headers).status_code == 404


# ---------- search ----------

def test_search_matches_title_and_content_case_insensitive(client, auth_headers):
    create(client, auth_headers, title="React hooks", content="useState basics")
    create(client, auth_headers, title="Groceries", content="Buy REACT-themed mug")
    create(client, auth_headers, title="Unrelated", content="nothing here")
    body = client.get("/api/memories/search?q=react", headers=auth_headers).json()
    assert body["total"] == 2
    assert {m["title"] for m in body["items"]} == {"React hooks", "Groceries"}


def test_search_no_results(client, auth_headers):
    create(client, auth_headers)
    body = client.get("/api/memories/search?q=zzzzzz", headers=auth_headers).json()
    assert body == {"items": [], "total": 0, "limit": 20, "offset": 0}


def test_search_treats_wildcards_literally(client, auth_headers):
    create(client, auth_headers, title="Discount 100% off", content="")
    create(client, auth_headers, title="Plain title", content="")
    percent = client.get("/api/memories/search?q=100%25", headers=auth_headers).json()
    assert percent["total"] == 1
    lone = client.get("/api/memories/search?q=%25", headers=auth_headers).json()
    assert lone["total"] == 1  # only the title that really contains a "%"
    underscore = client.get("/api/memories/search?q=_", headers=auth_headers).json()
    assert underscore["total"] == 0


def test_search_with_category_filter_and_pagination(client, auth_headers):
    create(client, auth_headers, title="Alpha one", category="work")
    create(client, auth_headers, title="Alpha two", category="work")
    create(client, auth_headers, title="Alpha three", category="home")
    body = client.get("/api/memories/search?q=alpha&category=work&limit=1", headers=auth_headers).json()
    assert body["total"] == 2
    assert len(body["items"]) == 1


def test_search_requires_query(client, auth_headers):
    assert client.get("/api/memories/search", headers=auth_headers).status_code == 422
    assert client.get("/api/memories/search?q=", headers=auth_headers).status_code == 422
    assert client.get("/api/memories/search?q=%20%20", headers=auth_headers).status_code == 422


# ---------- authentication & isolation ----------

@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/api/memories"),
        ("post", "/api/memories"),
        ("get", "/api/memories/search?q=a"),
        ("get", "/api/memories/1"),
        ("put", "/api/memories/1"),
        ("delete", "/api/memories/1"),
    ],
)
def test_memory_endpoints_require_login(client, method, path):
    kwargs = {"json": {"title": "x"}} if method in {"post", "put"} else {}
    response = getattr(client, method)(path, **kwargs)
    assert response.status_code == 401


def test_invalid_token_rejected(client):
    response = client.get("/api/memories", headers={"Authorization": "Bearer not-a-token"})
    assert response.status_code == 401


def test_users_cannot_see_each_others_memories(client, auth_headers, other_headers):
    mine = create(client, auth_headers, title="Alice secret plan")

    # Bob's own list and search are empty
    assert client.get("/api/memories", headers=other_headers).json()["total"] == 0
    assert client.get("/api/memories/search?q=secret", headers=other_headers).json()["total"] == 0

    # Bob cannot read, change or delete Alice's memory (404, not 403, to avoid leaking it exists)
    url = f"/api/memories/{mine['id']}"
    assert client.get(url, headers=other_headers).status_code == 404
    assert client.put(url, json={"title": "hacked"}, headers=other_headers).status_code == 404
    assert client.delete(url, headers=other_headers).status_code == 404

    # ...and Alice's memory is untouched
    still_there = client.get(url, headers=auth_headers)
    assert still_there.status_code == 200
    assert still_there.json()["title"] == "Alice secret plan"
