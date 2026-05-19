"""OpenAPI spec accuracy tests for the FastAPI runtime."""

import json

import pytest
from fastapi.testclient import TestClient

from fastbackend_fastapi.runtime import create_app


FULL_IR = {
    "version": "1.0.0",
    "metadata": {
        "projectName": "openapi-test",
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
def app(tmp_path):
    ir_path = tmp_path / "ir.json"
    ir_path.write_text(json.dumps(FULL_IR))

    custom_path = tmp_path / "custom"
    custom_path.mkdir()
    (custom_path / "__init__.py").write_text("")

    custom_router = custom_path / "health.py"
    custom_router.write_text(
        '''
from fastapi import APIRouter

router = APIRouter()

@router.get("/health/custom")
async def custom_health():
    return {"custom": "ok"}
'''
    )

    return create_app(ir_path=str(ir_path), custom_path=str(custom_path))


class TestOpenAPIRuntime:
    def test_openapi_includes_generated_crud_paths(self, app):
        schema = app.openapi()
        paths = schema["paths"]

        assert "/health" in paths
        assert "/users" in paths
        assert "/users/{id}" in paths
        assert "/posts" in paths
        assert "/users/{id}/posts" in paths
        assert paths["/users"]["get"] is not None
        assert paths["/users"]["post"] is not None

    def test_openapi_includes_custom_endpoints(self, app):
        schema = app.openapi()
        assert "/health/custom" in schema["paths"]

    def test_registered_routes_are_reachable(self, app):
        client = TestClient(app)

        health = client.get("/health")
        assert health.status_code == 200

        custom = client.get("/health/custom")
        assert custom.status_code == 200
        assert custom.json()["custom"] == "ok"

        users = client.get("/users")
        assert users.status_code == 200
