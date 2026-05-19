#!/usr/bin/env python3
"""
SQLAlchemy schema parser for FastBackend.
Parses SQLAlchemy model files and outputs ParsedSchema JSON to stdout.
"""

from __future__ import annotations

import argparse
import enum
import importlib.util
import inspect
import json
import sys
from pathlib import Path
from typing import Any


def load_module_from_path(path: str) -> Any:
    """Load a Python module from file path."""
    module_path = Path(path).resolve()
    spec = importlib.util.spec_from_file_location(module_path.stem, module_path)
    if spec is None or spec.loader is None:
        raise ValueError(f"Cannot load module from {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_path.stem] = module
    spec.loader.exec_module(module)
    return module


def get_sqlalchemy_base(module: Any) -> Any:
    """Find DeclarativeBase or declarative_base in module."""
    for name in dir(module):
        obj = getattr(module, name)
        if inspect.isclass(obj):
            if hasattr(obj, "__tablename__") or hasattr(obj, "__table__"):
                continue
            if name in ("Base", "DeclarativeBase") or (
                hasattr(obj, "metadata") and hasattr(obj, "registry")
            ):
                return obj
    raise ValueError("No SQLAlchemy Base class found in module")


def map_column_type(column_type: Any) -> str:
    """Map SQLAlchemy column type to IR type string."""
    type_name = type(column_type).__name__.lower()

    type_map = {
        "string": "string",
        "varchar": "string",
        "text": "string",
        "char": "string",
        "integer": "integer",
        "int": "integer",
        "bigint": "integer",
        "smallinteger": "integer",
        "boolean": "boolean",
        "float": "float",
        "double": "float",
        "numeric": "float",
        "decimal": "float",
        "date": "date",
        "datetime": "datetime",
        "timestamp": "datetime",
        "json": "json",
        "uuid": "uuid",
    }

    for key, value in type_map.items():
        if key in type_name:
            return value

    if hasattr(column_type, "python_type"):
        py_type = column_type.python_type
        if py_type is str:
            return "string"
        if py_type is int:
            return "integer"
        if py_type is bool:
            return "boolean"
        if py_type is float:
            return "float"

    return "string"


def extract_validation(column: Any) -> list[dict[str, Any]]:
    """Extract validation rules from column."""
    rules: list[dict[str, Any]] = []

    if not column.nullable:
        rules.append({"type": "required"})

    col_type = column.type
    if hasattr(col_type, "length") and col_type.length:
        rules.append({"type": "maxLength", "value": col_type.length})

    return rules


def extract_entity(model_class: Any) -> dict[str, Any]:
    """Extract entity from SQLAlchemy model class."""
    table = model_class.__table__
    fields = []
    constraints = []

    for column in table.columns:
        field = {
            "name": column.name,
            "type": map_column_type(column.type),
            "nullable": column.nullable,
            "defaultValue": str(column.default.arg) if column.default is not None else None,
            "validation": extract_validation(column),
            "metadata": {},
        }
        fields.append(field)

    pk_cols = [col.name for col in table.primary_key.columns]
    if pk_cols:
        constraints.append({"type": "primary_key", "fields": pk_cols})

    for constraint in table.constraints:
        if hasattr(constraint, "columns") and type(constraint).__name__ == "UniqueConstraint":
            unique_fields = [col.name for col in constraint.columns]
            constraints.append({"type": "unique", "fields": unique_fields})

    return {
        "name": model_class.__name__,
        "tableName": table.name,
        "fields": fields,
        "constraints": constraints,
        "metadata": {},
    }


def extract_relationships(model_class: Any, all_models: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract relationships from SQLAlchemy model."""
    relationships = []

    if not hasattr(model_class, "__mapper__"):
        return relationships

    mapper = model_class.__mapper__

    for name, rel in mapper.relationships.items():
        target_class = rel.mapper.class_
        target_name = target_class.__name__
        source_name = model_class.__name__

        direction = rel.direction.name if hasattr(rel.direction, "name") else str(rel.direction)

        rel_type = "many-to-one"
        if direction == "ONETOMANY":
            rel_type = "one-to-many"
        elif direction == "MANYTOMANY":
            rel_type = "many-to-many"
        elif direction == "ONETOONE":
            rel_type = "one-to-one"

        rel_data: dict[str, Any] = {
            "name": name,
            "type": rel_type,
            "sourceEntity": source_name,
            "targetEntity": target_name,
            "cascadeDelete": "delete" in str(getattr(rel, "cascade", "")),
            "metadata": {},
        }

        if rel_type == "many-to-many" and rel.secondary is not None:
            rel_data["joinTable"] = rel.secondary.name

        if rel.back_populates:
            rel_data["metadata"]["backPopulates"] = rel.back_populates

        local_cols = [col.name for col in rel.local_columns]
        if local_cols:
            rel_data["sourceField"] = local_cols[0]

        remote_cols = [col.name for col in rel.remote_side] if rel.remote_side else []
        if remote_cols:
            rel_data["targetField"] = remote_cols[0].split(".")[-1] if "." in str(remote_cols[0]) else remote_cols[0]

        relationships.append(rel_data)

    return relationships


def extract_enums(module: Any) -> list[dict[str, Any]]:
    """Extract Python enums from module."""
    enums = []
    for name, obj in inspect.getmembers(module, inspect.isclass):
        if issubclass(obj, enum.Enum) and obj is not enum.Enum:
            values = [
                {"name": member.name, "value": member.value}
                for member in obj
            ]
            enums.append({"name": name, "values": values, "metadata": {}})
    return enums


def parse_schema(schema_paths: list[str]) -> dict[str, Any]:
    """Parse SQLAlchemy schema files."""
    all_entities: list[dict[str, Any]] = []
    all_relationships: list[dict[str, Any]] = []
    all_enums: list[dict[str, Any]] = []
    model_classes: dict[str, Any] = {}

    for path in schema_paths:
        module = load_module_from_path(path)
        all_enums.extend(extract_enums(module))

        for name, obj in inspect.getmembers(module, inspect.isclass):
            if not hasattr(obj, "__tablename__"):
                continue
            if obj.__tablename__ is None:
                continue

            entity = extract_entity(obj)
            all_entities.append(entity)
            model_classes[obj.__name__] = obj

    for model_class in model_classes.values():
        all_relationships.extend(extract_relationships(model_class, model_classes))

    return {
        "entities": all_entities,
        "relationships": all_relationships,
        "enums": all_enums,
        "metadata": {
            "schemaFormat": "sqlalchemy",
            "schemaVersion": "1.0.0",
            "sourceFiles": schema_paths,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse SQLAlchemy schema files")
    parser.add_argument("schema_files", nargs="+", help="Path to SQLAlchemy model files")
    args = parser.parse_args()

    try:
        result = parse_schema(args.schema_files)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
