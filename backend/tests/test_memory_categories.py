def _create(client, headers, title, category):
    response = client.post(
        "/api/memories", json={"title": title, "category": category}, headers=headers
    )
    assert response.status_code == 201, response.text


def test_categories_empty(client, auth_headers):
    response = client.get("/api/memories/categories", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0}


def test_categories_are_counted_case_insensitively(client, auth_headers):
    _create(client, auth_headers, "a", "Code")
    _create(client, auth_headers, "b", "code")
    _create(client, auth_headers, "c", "link")
    body = client.get("/api/memories/categories", headers=auth_headers).json()
    assert body["items"] == [
        {"category": "code", "count": 2},
        {"category": "link", "count": 1},
    ]
    assert body["total"] == 3


def test_categories_only_count_own_memories(client, auth_headers, other_headers):
    _create(client, auth_headers, "mine", "code")
    body = client.get("/api/memories/categories", headers=other_headers).json()
    assert body == {"items": [], "total": 0}


def test_categories_requires_login(client):
    assert client.get("/api/memories/categories").status_code == 401


def test_categories_route_is_not_read_as_a_memory_id(client, auth_headers):
    # "/categories" must not be captured by "/{memory_id}" (which would give 422).
    assert client.get("/api/memories/categories", headers=auth_headers).status_code == 200
