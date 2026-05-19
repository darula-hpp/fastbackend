"""Runtime HTTP query behavior tests."""

import json

import pytest
from fastapi.testclient import TestClient

from fastbackend_fastapi.runtime import Runtime


QUERY_IR = {
    "version": "1.0.0",
    "metadata": {
        "projectName": "query-test",
        "schemaFormat": "sqlalchemy",
        "adapter": "fastapi",
        "generatedAt": "2024-01-01T00:00:00Z",
        "schemaVersion": "1.0.0",
    },
    "entities": [
        {
            "name": "User",
            "tableName": "users",
            "fields": [
                {"name": "id", "type": {"base": "integer"}, "nullable": False, "validation": [], "metadata": {}},
                {"name": "name", "type": {"base": "string"}, "nullable": False, "validation": [], "metadata": {}},
                {"name": "email", "type": {"base": "string"}, "nullable": False, "validation": [], "metadata": {}},
            ],
            "primaryKey": ["id"],
            "uniqueConstraints": [],
            "indexes": [],
            "metadata": {},
        }
    ],
    "relationships": [],
    "enums": [],
}


@pytest.fixture
def client(tmp_path):
    ir_path = tmp_path / "ir.json"
    ir_path.write_text(json.dumps(QUERY_IR))

    custom_path = tmp_path / "custom"
    custom_path.mkdir()
    (custom_path / "__init__.py").write_text("")

    runtime = Runtime(ir_path=str(ir_path), custom_path=str(custom_path))
    runtime.initialize()
    runtime.store["User"] = [
        {"id": 1, "name": "Alice", "email": "alice@example.com"},
        {"id": 2, "name": "Bob", "email": "bob@example.com"},
        {"id": 3, "name": "Charlie", "email": "charlie@example.com"},
    ]

    return TestClient(runtime.app)


class TestRuntimeQuery:
    def test_filter_by_field(self, client):
        response = client.get("/users?name=Alice")
        assert response.status_code == 200
        assert response.json() == [{"id": 1, "name": "Alice", "email": "alice@example.com"}]

    def test_search_query(self, client):
        response = client.get("/users?q=bob")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "Bob"

    def test_sort_and_paginate(self, client):
        response = client.get("/users?sort=name:desc&limit=2&offset=1")
        assert response.status_code == 200
        names = [user["name"] for user in response.json()]
        assert names == ["Bob", "Alice"]
