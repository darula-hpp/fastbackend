"""Validation engine tests."""

import pytest
from pydantic import ValidationError

from fastbackend_fastapi.validation_engine import ValidationEngine


USER_ENTITY = {
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


class TestValidationEngine:
    def test_create_model_requires_valid_email(self):
        engine = ValidationEngine()
        models = engine.create_models(USER_ENTITY)

        record = models["create"](email="valid@example.com", name="Test")
        assert record.email == "valid@example.com"

        with pytest.raises(ValidationError):
            models["create"](email="not-an-email", name="Test")

    def test_update_model_allows_partial_payload(self):
        engine = ValidationEngine()
        models = engine.create_models(USER_ENTITY)

        record = models["update"](name="Updated")
        assert record.name == "Updated"
        assert record.email is None
