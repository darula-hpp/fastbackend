"""Query engine for pagination, filtering, sorting, and search."""

from __future__ import annotations

from typing import Any


class QueryEngine:
    """Builds query parameters and applies filters dynamically."""

    @staticmethod
    def parse_pagination(limit: int = 20, offset: int = 0) -> dict[str, int]:
        return {
            "limit": min(max(limit, 1), 100),
            "offset": max(offset, 0),
        }

    @staticmethod
    def parse_sort(sort: str | None, allowed_fields: list[str]) -> list[tuple[str, str]]:
        if not sort:
            return []

        result = []
        for part in sort.split(","):
            part = part.strip()
            if ":" in part:
                field, direction = part.split(":", 1)
            else:
                field, direction = part, "asc"

            if field in allowed_fields:
                result.append((field, direction.lower()))

        return result

    @staticmethod
    def parse_filters(
        params: dict[str, Any], entity_fields: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        field_names = {f["name"] for f in entity_fields}
        filters = []

        for key, value in params.items():
            if key in ("limit", "offset", "sort", "q"):
                continue

            if "__" in key:
                field_name, operator = key.rsplit("__", 1)
            else:
                field_name, operator = key, "eq"

            if field_name in field_names and value is not None:
                filters.append({"field": field_name, "operator": operator, "value": value})

        return filters

    @staticmethod
    def apply_filters(items: list[dict[str, Any]], filters: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not filters:
            return items

        result = items
        for f in filters:
            result = [item for item in result if QueryEngine._match(item, f)]
        return result

    @staticmethod
    def apply_search(items: list[dict[str, Any]], query: str | None, text_fields: list[str]) -> list[dict[str, Any]]:
        if not query:
            return items

        q = query.lower()
        return [
            item
            for item in items
            if any(
                q in str(item.get(field, "")).lower()
                for field in text_fields
                if item.get(field) is not None
            )
        ]

    @staticmethod
    def apply_sort(items: list[dict[str, Any]], sort_spec: list[tuple[str, str]]) -> list[dict[str, Any]]:
        if not sort_spec:
            return items

        result = list(items)
        for field, direction in reversed(sort_spec):
            reverse = direction == "desc"
            result.sort(key=lambda x: x.get(field) or "", reverse=reverse)
        return result

    @staticmethod
    def apply_pagination(items: list[dict[str, Any]], limit: int, offset: int) -> list[dict[str, Any]]:
        return items[offset : offset + limit]

    @staticmethod
    def _match(item: dict[str, Any], filter_spec: dict[str, Any]) -> bool:
        field = filter_spec["field"]
        operator = filter_spec["operator"]
        value = filter_spec["value"]
        item_value = item.get(field)

        if item_value is None:
            return False

        match operator:
            case "eq":
                return str(item_value) == str(value)
            case "ne":
                return str(item_value) != str(value)
            case "gt":
                return item_value > value
            case "lt":
                return item_value < value
            case "gte":
                return item_value >= value
            case "lte":
                return item_value <= value
            case "like":
                return str(value).lower() in str(item_value).lower()
            case _:
                return str(item_value) == str(value)
