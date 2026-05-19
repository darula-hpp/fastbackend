"""Dynamic CRUD endpoint creation."""

from __future__ import annotations

from typing import Any, Callable

from fastapi import HTTPException, Request
from pydantic import ValidationError

from fastbackend_fastapi.query_engine import QueryEngine
from fastbackend_fastapi.utils.route_registry import RouteRegistry
from fastbackend_fastapi.utils.pluralize import pluralize


class CRUDEngine:
    """Creates CRUD endpoints dynamically at runtime."""

    def __init__(
        self,
        registry: RouteRegistry,
        store: dict[str, list[dict[str, Any]]],
        validation_engine: Any | None = None,
    ) -> None:
        self.registry = registry
        self.store = store
        self.validation_engine = validation_engine
        self.query_engine = QueryEngine()

    def register_all(self, app: Any, entities: list[dict[str, Any]]) -> int:
        count = 0
        for entity in entities:
            count += self.register_entity(app, entity)
        return count

    def register_entity(self, app: Any, entity: dict[str, Any]) -> int:
        name = entity["name"]
        resource = pluralize(name)

        if name not in self.store:
            self.store[name] = []

        handlers = [
            ("GET", f"/{resource}", self._create_list_handler(entity)),
            ("POST", f"/{resource}", self._create_create_handler(entity)),
            ("GET", f"/{resource}/{{id}}", self._create_retrieve_handler(entity)),
            ("PUT", f"/{resource}/{{id}}", self._create_update_handler(entity)),
            ("DELETE", f"/{resource}/{{id}}", self._create_delete_handler(entity)),
        ]

        count = 0
        for method, path, handler in handlers:
            if self.registry.is_overridden(method, path):
                continue

            app.add_api_route(path, handler, methods=[method], tags=[name])
            self.registry.register(path, [method], entity=name)
            count += 1

        return count

    def _create_list_handler(self, entity: dict[str, Any]) -> Callable:
        name = entity["name"]
        text_fields = [
            f["name"] for f in entity["fields"] if f.get("type", {}).get("base") == "string"
        ]
        allowed_fields = [f["name"] for f in entity["fields"]]

        async def list_handler(
            request: Request,
            limit: int = 20,
            offset: int = 0,
            sort: str | None = None,
            q: str | None = None,
        ) -> list[dict[str, Any]]:
            pagination = self.query_engine.parse_pagination(limit, offset)
            params = dict(request.query_params)
            filters = self.query_engine.parse_filters(params, entity["fields"])
            sort_spec = self.query_engine.parse_sort(sort, allowed_fields)

            items = list(self.store.get(name, []))
            items = self.query_engine.apply_filters(items, filters)
            items = self.query_engine.apply_search(items, q, text_fields)
            items = self.query_engine.apply_sort(items, sort_spec)
            return self.query_engine.apply_pagination(
                items, pagination["limit"], pagination["offset"]
            )

        return list_handler

    def _create_create_handler(self, entity: dict[str, Any]) -> Callable:
        name = entity["name"]
        create_model = (
            self.validation_engine.get_model(f"{name}Create")
            if self.validation_engine is not None
            else None
        )

        async def create_handler(request: Request) -> dict[str, Any]:
            body = await request.json()
            payload = self._validate_payload(body, create_model)
            items = self.store.setdefault(name, [])
            pk_field = entity.get("primaryKey", ["id"])[0]
            new_id = max((item.get(pk_field, 0) for item in items), default=0) + 1
            record = {pk_field: new_id, **payload}
            items.append(record)
            return record

        return create_handler

    def _create_retrieve_handler(self, entity: dict[str, Any]) -> Callable:
        name = entity["name"]
        pk_field = entity.get("primaryKey", ["id"])[0]

        async def retrieve_handler(id: int) -> dict[str, Any]:
            for item in self.store.get(name, []):
                if item.get(pk_field) == id:
                    return item
            raise HTTPException(status_code=404, detail=f"{name} not found")

        return retrieve_handler

    def _create_update_handler(self, entity: dict[str, Any]) -> Callable:
        name = entity["name"]
        pk_field = entity.get("primaryKey", ["id"])[0]
        update_model = (
            self.validation_engine.get_model(f"{name}Update")
            if self.validation_engine is not None
            else None
        )

        async def update_handler(id: int, request: Request) -> dict[str, Any]:
            body = await request.json()
            payload = self._validate_payload(body, update_model, partial=True)
            items = self.store.get(name, [])
            for i, item in enumerate(items):
                if item.get(pk_field) == id:
                    items[i] = {**item, **payload, pk_field: id}
                    return items[i]
            raise HTTPException(status_code=404, detail=f"{name} not found")

        return update_handler

    @staticmethod
    def _validate_payload(
        body: Any,
        model: Any | None,
        *,
        partial: bool = False,
    ) -> dict[str, Any]:
        if model is None:
            if not isinstance(body, dict):
                raise HTTPException(status_code=422, detail="Request body must be a JSON object")
            return body

        try:
            validated = model.model_validate(body)
            return validated.model_dump(exclude_unset=partial)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=exc.errors()) from exc

    def _create_delete_handler(self, entity: dict[str, Any]) -> Callable:
        name = entity["name"]
        pk_field = entity.get("primaryKey", ["id"])[0]

        async def delete_handler(id: int) -> None:
            items = self.store.get(name, [])
            for i, item in enumerate(items):
                if item.get(pk_field) == id:
                    items.pop(i)
                    return
            raise HTTPException(status_code=404, detail=f"{name} not found")

        return delete_handler
