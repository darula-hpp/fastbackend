"""Dynamic relationship endpoint creation."""

from __future__ import annotations

from typing import Any, Callable

from fastapi import HTTPException

from fastbackend_fastapi.utils.route_registry import RouteRegistry
from fastbackend_fastapi.utils.pluralize import pluralize


class RelationshipEngine:
    """Creates relationship endpoints dynamically at runtime."""

    def __init__(
        self,
        registry: RouteRegistry,
        store: dict[str, list[dict[str, Any]]],
        relationships: list[dict[str, Any]],
    ) -> None:
        self.registry = registry
        self.store = store
        self.relationships = relationships

    def register_all(self, app: Any) -> int:
        count = 0
        for rel in self.relationships:
            count += self.register_relationship(app, rel)
        return count

    def register_relationship(self, app: Any, relationship: dict[str, Any]) -> int:
        source = relationship["sourceEntity"]
        resource = pluralize(source)
        rel_name = relationship["name"]
        path = f"/{resource}/{{id}}/{rel_name}"
        method = "GET"

        if self.registry.is_overridden(method, path):
            return 0

        handler = self._create_handler(relationship)
        app.add_api_route(path, handler, methods=[method], tags=[source])
        self.registry.register(
            path, [method], entity=source, relationship=rel_name
        )
        return 1

    def _create_handler(self, relationship: dict[str, Any]) -> Callable:
        source = relationship["sourceEntity"]
        target = relationship["targetEntity"]
        rel_type = relationship["type"]
        source_field = relationship.get("sourceField")
        target_field = relationship.get("targetField", f"{source.lower()}_id")

        async def relationship_handler(id: int, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
            source_pk = "id"
            source_items = self.store.get(source, [])
            target_items = self.store.get(target, [])

            source_record = next(
                (item for item in source_items if item.get(source_pk) == id), None
            )
            if source_record is None:
                raise HTTPException(status_code=404, detail=f"{source} not found")

            match rel_type:
                case "one-to-many":
                    fk = target_field or f"{source.lower()}_id"
                    related = [item for item in target_items if item.get(fk) == id]
                case "many-to-one":
                    fk = source_field or f"{target.lower()}_id"
                    fk_value = source_record.get(fk)
                    related = [item for item in target_items if item.get("id") == fk_value]
                case "many-to-many":
                    related = target_items[:limit]
                case "one-to-one":
                    fk = target_field or f"{source.lower()}_id"
                    related = [item for item in target_items if item.get(fk) == id]
                case _:
                    related = []

            return related[offset : offset + limit]

        return relationship_handler
