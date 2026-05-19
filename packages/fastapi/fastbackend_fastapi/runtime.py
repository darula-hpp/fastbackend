"""FastBackend FastAPI runtime engine."""

from __future__ import annotations

import importlib.util
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from fastapi import FastAPI

from fastbackend_fastapi.crud_engine import CRUDEngine
from fastbackend_fastapi.relationship_engine import RelationshipEngine
from fastbackend_fastapi.utils.ir_loader import load_ir
from fastbackend_fastapi.utils.route_registry import RouteRegistry
from fastbackend_fastapi.utils.pluralize import pluralize
from fastbackend_fastapi.validation_engine import ValidationEngine


@dataclass
class InitializationResult:
    success: bool
    routes_created: int = 0
    models_created: int = 0
    errors: list[str] = field(default_factory=list)


OVERRIDE_PATTERN = re.compile(
    r'@(?:fastbackend\.)?override\s*\(\s*["\']([^"\']+)["\']\s*,\s*["\'](\w+)["\']\s*\)'
)


class Runtime:
    """Orchestrates FastAPI runtime initialization from IR."""

    def __init__(self, ir_path: str = ".fastbackend/ir.json", custom_path: str = "app/custom") -> None:
        self.ir_path = ir_path
        self.custom_path = custom_path
        self.registry = RouteRegistry()
        self.store: dict[str, list[dict[str, Any]]] = {}
        self.validation_engine = ValidationEngine()
        self.app: FastAPI | None = None

    def initialize(self, app: FastAPI | None = None) -> InitializationResult:
        try:
            ir = load_ir(self.ir_path)
            self.app = app or FastAPI(
                title=ir["metadata"]["projectName"],
                version=ir["metadata"]["schemaVersion"],
            )

            self._scan_overrides()
            self._register_root_route(ir)
            self._register_health_check()
            self._create_models(ir["entities"])

            crud_engine = CRUDEngine(self.registry, self.store, self.validation_engine)
            routes_created = crud_engine.register_all(self.app, ir["entities"])

            rel_engine = RelationshipEngine(self.registry, self.store, ir["relationships"])
            routes_created += rel_engine.register_all(self.app)

            custom_count = self._register_custom_endpoints()
            routes_created += custom_count

            return InitializationResult(
                success=True,
                routes_created=routes_created,
                models_created=len(self.validation_engine._models),
            )
        except Exception as e:
            return InitializationResult(success=False, errors=[str(e)])

    def _create_models(self, entities: list[dict[str, Any]]) -> None:
        for entity in entities:
            self.validation_engine.create_models(entity)

    def _register_root_route(self, ir: dict[str, Any]) -> None:
        assert self.app is not None
        metadata = ir["metadata"]
        resources = [f"/{pluralize(entity['name'])}" for entity in ir["entities"]]

        async def root() -> dict[str, Any]:
            return {
                "name": metadata["projectName"],
                "adapter": metadata["adapter"],
                "schemaFormat": metadata["schemaFormat"],
                "message": "FastBackend API is running. Use the resource paths below.",
                "endpoints": {
                    "health": "/health",
                    "resources": resources,
                },
            }

        self.app.add_api_route("/", root, methods=["GET"], tags=["Meta"])
        self.registry.register("/", ["GET"])

    def _register_health_check(self) -> None:
        assert self.app is not None

        async def health_check() -> dict[str, Any]:
            return {"status": "healthy", "database": "connected"}

        self.app.add_api_route("/health", health_check, methods=["GET"], tags=["Health"])
        self.registry.register("/health", ["GET"])

    def _scan_overrides(self) -> None:
        custom_dir = Path(self.custom_path)
        if not custom_dir.exists():
            return

        for py_file in custom_dir.rglob("*.py"):
            if py_file.name == "__init__.py":
                continue
            content = py_file.read_text(encoding="utf-8")
            for match in OVERRIDE_PATTERN.finditer(content):
                path, method = match.group(1), match.group(2)
                self.registry.mark_override(method, path)

    def _register_custom_endpoints(self) -> int:
        assert self.app is not None
        custom_dir = Path(self.custom_path)
        if not custom_dir.exists():
            custom_dir.mkdir(parents=True, exist_ok=True)
            return 0

        count = 0
        for py_file in custom_dir.rglob("*.py"):
            if py_file.name == "__init__.py":
                continue

            module_name = f"fastbackend_custom_{py_file.stem}"
            spec = importlib.util.spec_from_file_location(module_name, py_file)
            if spec is None or spec.loader is None:
                continue

            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)

            if hasattr(module, "router"):
                self.app.include_router(module.router)
                count += 1
                self.registry.register(f"custom:{py_file.stem}", ["*"], is_custom=True)

        return count

    def get_route_summary(self) -> dict[str, Any]:
        return self.registry.summary()


def create_app(
    ir_path: str = ".fastbackend/ir.json",
    custom_path: str = "app/custom",
) -> FastAPI:
    """Create and initialize a FastAPI app from IR."""
    runtime = Runtime(ir_path=ir_path, custom_path=custom_path)
    result = runtime.initialize()

    if not result.success:
        raise RuntimeError(f"Failed to initialize runtime: {', '.join(result.errors)}")

    return runtime.app  # type: ignore[return-value]
