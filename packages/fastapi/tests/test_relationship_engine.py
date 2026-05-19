"""Relationship endpoint tests."""

import json

import pytest
from fastapi.testclient import TestClient

from fastbackend_fastapi.runtime import Runtime


RELATIONSHIP_IR = {
    "version": "1.0.0",
    "metadata": {
        "projectName": "relationship-test",
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
            ],
            "primaryKey": ["id"],
            "uniqueConstraints": [],
            "indexes": [],
            "metadata": {},
        },
        {
            "name": "Post",
            "tableName": "posts",
            "fields": [
                {"name": "id", "type": {"base": "integer"}, "nullable": False, "validation": [], "metadata": {}},
                {"name": "title", "type": {"base": "string"}, "nullable": False, "validation": [], "metadata": {}},
                {"name": "user_id", "type": {"base": "integer"}, "nullable": False, "validation": [], "metadata": {}},
            ],
            "primaryKey": ["id"],
            "uniqueConstraints": [],
            "indexes": [],
            "metadata": {},
        },
    ],
    "relationships": [
        {
            "name": "posts",
            "type": "one-to-many",
            "sourceEntity": "User",
            "targetEntity": "Post",
            "sourceField": "id",
            "targetField": "user_id",
            "cascadeDelete": False,
            "metadata": {},
        }
    ],
    "enums": [],
}


@pytest.fixture
def relationship_app(tmp_path):
    ir_path = tmp_path / "ir.json"
    ir_path.write_text(json.dumps(RELATIONSHIP_IR))

    custom_path = tmp_path / "custom"
    custom_path.mkdir()
    (custom_path / "__init__.py").write_text("")

    runtime = Runtime(ir_path=str(ir_path), custom_path=str(custom_path))
    result = runtime.initialize()
    assert result.success is True

    runtime.store["User"] = [{"id": 1, "name": "Alice"}]
    runtime.store["Post"] = [
        {"id": 1, "title": "First", "user_id": 1},
        {"id": 2, "title": "Second", "user_id": 1},
        {"id": 3, "title": "Other", "user_id": 2},
    ]

    return TestClient(runtime.app)


class TestRelationshipEngine:
    def test_one_to_many_endpoint(self, relationship_app):
        response = relationship_app.get("/users/1/posts")
        assert response.status_code == 200
        titles = {post["title"] for post in response.json()}
        assert titles == {"First", "Second"}

    def test_relationship_not_found(self, relationship_app):
        response = relationship_app.get("/users/99/posts")
        assert response.status_code == 404

    def test_relationship_pagination(self, relationship_app):
        response = relationship_app.get("/users/1/posts?limit=1&offset=0")
        assert response.status_code == 200
        assert len(response.json()) == 1
