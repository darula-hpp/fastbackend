"""Dynamic Pydantic model creation from IR."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, create_model


TYPE_MAP: dict[str, Any] = {
    "string": str,
    "integer": int,
    "float": float,
    "boolean": bool,
    "date": date,
    "datetime": datetime,
    "json": dict,
    "uuid": UUID,
    "email": EmailStr,
}


class ValidationEngine:
    """Creates Pydantic models dynamically from IR entities."""

    def __init__(self) -> None:
        self._models: dict[str, type[BaseModel]] = {}

    def create_models(self, entity: dict[str, Any]) -> dict[str, type[BaseModel]]:
        name = entity["name"]
        full = self._create_model(entity, f"{name}", mode="full")
        create = self._create_model(entity, f"{name}Create", mode="create")
        update = self._create_model(entity, f"{name}Update", mode="update")

        self._models[name] = full
        self._models[f"{name}Create"] = create
        self._models[f"{name}Update"] = update

        return {"full": full, "create": create, "update": update}

    def get_model(self, name: str) -> type[BaseModel] | None:
        return self._models.get(name)

    def _create_model(
        self, entity: dict[str, Any], model_name: str, mode: str
    ) -> type[BaseModel]:
        fields: dict[str, Any] = {}
        pk = entity.get("primaryKey", ["id"])

        for field_def in entity["fields"]:
            field_name = field_def["name"]

            if mode == "create" and field_name in pk and field_name == "id":
                continue

            py_type = self._map_type(field_def)
            field_kwargs: dict[str, Any] = {}

            if mode == "update":
                py_type = Optional[py_type]
                field_kwargs["default"] = None
            elif field_def.get("nullable", True) and mode != "create":
                py_type = Optional[py_type]
                field_kwargs["default"] = None
            elif not field_def.get("nullable", True) and mode == "create":
                is_required = any(
                    v.get("type") == "required" for v in field_def.get("validation", [])
                )
                if not is_required and field_def.get("defaultValue") is None:
                    field_kwargs["default"] = ...

            for rule in field_def.get("validation", []):
                if rule["type"] == "minLength" and "value" in rule:
                    field_kwargs["min_length"] = rule["value"]
                elif rule["type"] == "maxLength" and "value" in rule:
                    field_kwargs["max_length"] = rule["value"]
                elif rule["type"] == "min" and "value" in rule:
                    field_kwargs["ge"] = rule["value"]
                elif rule["type"] == "max" and "value" in rule:
                    field_kwargs["le"] = rule["value"]
                elif rule["type"] == "pattern" and "value" in rule:
                    field_kwargs["pattern"] = rule["value"]

            if field_kwargs:
                fields[field_name] = (py_type, Field(**field_kwargs))
            else:
                fields[field_name] = (py_type, ...)

        return create_model(model_name, **fields)

    def _map_type(self, field_def: dict[str, Any]) -> Any:
        field_type = field_def.get("type", {})
        base = field_type.get("base", "string")
        fmt = field_type.get("format")

        if fmt == "email":
            return EmailStr
        if fmt == "uuid":
            return UUID
        if base == "array" and field_type.get("arrayOf"):
            inner = self._map_type({"type": field_type["arrayOf"]})
            return list[inner]

        return TYPE_MAP.get(base, str)
