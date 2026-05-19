"""Tests for endpoint override system."""

import json
from pathlib import Path

import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient

from fastbackend_fastapi.runtime import Runtime, create_app


SAMPLE_IR = {
    "version": "1.0.0",
    "metadata": {
        "projectName": "test-api",
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
                {
                    "name": "id",
                    "type": {"base": "integer"},
                    "nullable": False,
                    "validation": [{"type": "required"}],
                    "metadata": {},
                },
                {
                    "name": "email",
                    "type": {"base": "string"},
                    "nullable": False,
                    "validation": [{"type": "required"}],
                    "metadata": {},
                },
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
def ir_file(tmp_path):
    ir_path = tmp_path / "ir.json"
    ir_path.write_text(json.dumps(SAMPLE_IR))
    return ir_path


class TestOverrideSystem:
    def test_override_marker_skips_default_route(self, ir_file, tmp_path):
        custom_path = tmp_path / "custom"
        custom_path.mkdir()
        (custom_path / "__init__.py").write_text("")

        override_file = custom_path / "users_override.py"
        override_file.write_text('''
from fastapi import APIRouter
from fastbackend_fastapi import override

router = APIRouter()

@override("/users", "get")
@router.get("/users")
async def custom_list_users():
    return [{"id": 99, "email": "override@example.com"}]
''')

        runtime = Runtime(ir_path=str(ir_file), custom_path=str(custom_path))
        result = runtime.initialize()

        assert result.success is True
        assert runtime.registry.is_overridden("GET", "/users")

        client = TestClient(runtime.app)
        response = client.get("/users")
        assert response.status_code == 200
        assert response.json()[0]["email"] == "override@example.com"

    def test_non_overridden_routes_still_work(self, ir_file, tmp_path):
        custom_path = tmp_path / "custom"
        custom_path.mkdir()
        (custom_path / "__init__.py").write_text("")

        runtime = Runtime(ir_path=str(ir_file), custom_path=str(custom_path))
        runtime.initialize()

        client = TestClient(runtime.app)
        create_resp = client.post("/users", json={"email": "test@example.com"})
        assert create_resp.status_code == 200

        list_resp = client.get("/users")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1
