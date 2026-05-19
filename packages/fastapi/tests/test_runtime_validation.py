"""Runtime request validation tests."""

import json

import pytest
from fastapi.testclient import TestClient

from fastbackend_fastapi.runtime import create_app


USER_IR = {
    "version": "1.0.0",
    "metadata": {
        "projectName": "validation-test",
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
    ir_path.write_text(json.dumps(USER_IR))

    custom_path = tmp_path / "custom"
    custom_path.mkdir()
    (custom_path / "__init__.py").write_text("")

    app = create_app(ir_path=str(ir_path), custom_path=str(custom_path))
    return TestClient(app)


class TestRuntimeValidation:
    def test_create_rejects_invalid_email(self, client):
        response = client.post("/users", json={"email": "not-an-email"})
        assert response.status_code == 422

    def test_create_accepts_valid_email(self, client):
        response = client.post("/users", json={"email": "valid@example.com"})
        assert response.status_code == 200
        assert response.json()["email"] == "valid@example.com"

    def test_update_allows_partial_payload(self, client):
        create_resp = client.post("/users", json={"email": "valid@example.com"})
        user_id = create_resp.json()["id"]

        update_resp = client.put(f"/users/{user_id}", json={"email": "updated@example.com"})
        assert update_resp.status_code == 200
        assert update_resp.json()["email"] == "updated@example.com"
