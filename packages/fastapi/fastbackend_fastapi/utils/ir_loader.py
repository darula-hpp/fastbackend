"""Load and validate IR from JSON file."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_ir(ir_path: str | Path) -> dict[str, Any]:
    """Load IR from JSON file."""
    path = Path(ir_path)
    if not path.exists():
        raise FileNotFoundError(f"IR file not found: {path}")

    with path.open("r", encoding="utf-8") as f:
        ir = json.load(f)

    validate_ir(ir)
    return ir


def validate_ir(ir: dict[str, Any]) -> None:
    """Validate IR structure."""
    required_root = ["version", "metadata", "entities", "relationships", "enums"]
    for field in required_root:
        if field not in ir:
            raise ValueError(f"IR missing required field: {field}")

    if not isinstance(ir["entities"], list):
        raise ValueError("IR entities must be a list")

    for entity in ir["entities"]:
        required_entity = ["name", "tableName", "fields", "primaryKey"]
        for field in required_entity:
            if field not in entity:
                raise ValueError(f"Entity missing required field: {field}")
