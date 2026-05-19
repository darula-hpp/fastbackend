"""Tests for FastBackend FastAPI runtime."""

import json
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from fastbackend_fastapi.runtime import Runtime, create_app
from fastbackend_fastapi.utils.ir_loader import load_ir, validate_ir
from fastbackend_fastapi.validation_engine import ValidationEngine
from fastbackend_fastapi.query_engine import QueryEngine


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
                    "type": {"base": "string", "format": "email"},
                    "nullable": False,
                    "validation": [{"type": "required"}],
                    "metadata": {},
                },
                {
                    "name": "name",
                    "type": {"base": "string"},
                    "nullable": True,
                    "validation": [],
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


class TestIRLoader:
    def test_load_ir(self, ir_file):
        ir = load_ir(ir_file)
        assert ir["version"] == "1.0.0"
        assert len(ir["entities"]) == 1

    def test_validate_ir_missing_field(self):
        with pytest.raises(ValueError, match="missing required field"):
            validate_ir({"version": "1.0.0"})

    def test_load_ir_file_not_found(self):
        with pytest.raises(FileNotFoundError):
            load_ir("/nonexistent/ir.json")


class TestValidationEngine:
    def test_create_models(self):
        engine = ValidationEngine()
        models = engine.create_models(SAMPLE_IR["entities"][0])
        assert "full" in models
        assert "create" in models
        assert "update" in models

    def test_get_model(self):
        engine = ValidationEngine()
        engine.create_models(SAMPLE_IR["entities"][0])
        model = engine.get_model("User")
        assert model is not None


class TestQueryEngine:
    def test_parse_pagination(self):
        result = QueryEngine.parse_pagination(limit=200, offset=-5)
        assert result["limit"] == 100
        assert result["offset"] == 0

    def test_parse_sort(self):
        result = QueryEngine.parse_sort("name:desc,email:asc", ["name", "email"])
        assert result == [("name", "desc"), ("email", "asc")]

    def test_apply_filters(self):
        items = [{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]
        filters = [{"field": "name", "operator": "eq", "value": "John"}]
        result = QueryEngine.apply_filters(items, filters)
        assert len(result) == 1
        assert result[0]["name"] == "John"

    def test_apply_search(self):
        items = [{"name": "John"}, {"name": "Jane"}]
        result = QueryEngine.apply_search(items, "john", ["name"])
        assert len(result) == 1


class TestRuntime:
    def test_initialize(self, ir_file, tmp_path):
        custom_path = tmp_path / "custom"
        custom_path.mkdir()
        (custom_path / "__init__.py").write_text("")

        runtime = Runtime(ir_path=str(ir_file), custom_path=str(custom_path))
        result = runtime.initialize()

        assert result.success is True
        assert result.routes_created >= 5

    def test_create_app(self, ir_file, tmp_path):
        custom_path = tmp_path / "custom"
        custom_path.mkdir()
        (custom_path / "__init__.py").write_text("")

        app = create_app(ir_path=str(ir_file), custom_path=str(custom_path))
        client = TestClient(app)

        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["status"] == "healthy"

    def test_crud_endpoints(self, ir_file, tmp_path):
        custom_path = tmp_path / "custom"
        custom_path.mkdir()
        (custom_path / "__init__.py").write_text("")

        app = create_app(ir_path=str(ir_file), custom_path=str(custom_path))
        client = TestClient(app)

        create_resp = client.post("/users", json={"email": "test@example.com", "name": "Test"})
        assert create_resp.status_code == 200
        user = create_resp.json()
        assert user["email"] == "test@example.com"
        assert user["id"] == 1

        list_resp = client.get("/users")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

        get_resp = client.get("/users/1")
        assert get_resp.status_code == 200

        update_resp = client.put("/users/1", json={"name": "Updated"})
        assert update_resp.status_code == 200
        assert update_resp.json()["name"] == "Updated"

        delete_resp = client.delete("/users/1")
        assert delete_resp.status_code == 200

        not_found = client.get("/users/1")
        assert not_found.status_code == 404
