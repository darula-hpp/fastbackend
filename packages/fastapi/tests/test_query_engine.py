"""Extended query engine tests."""

from fastbackend_fastapi.query_engine import QueryEngine


class TestQueryEngineExtended:
    def test_parse_filters_with_operators(self):
        fields = [
            {"name": "name", "type": {"base": "string"}},
            {"name": "age", "type": {"base": "integer"}},
        ]
        params = {
            "name__like": "john",
            "age__gte": 18,
            "limit": 10,
            "sort": "name:asc",
            "q": "search",
        }

        filters = QueryEngine.parse_filters(params, fields)
        assert {"field": "name", "operator": "like", "value": "john"} in filters
        assert {"field": "age", "operator": "gte", "value": 18} in filters

    def test_apply_sort_descending(self):
        items = [{"name": "Bob"}, {"name": "Alice"}, {"name": "Carol"}]
        sorted_items = QueryEngine.apply_sort(items, [("name", "desc")])
        assert [item["name"] for item in sorted_items] == ["Carol", "Bob", "Alice"]

    def test_apply_pagination(self):
        items = [{"id": index} for index in range(5)]
        page = QueryEngine.apply_pagination(items, limit=2, offset=1)
        assert page == [{"id": 1}, {"id": 2}]

    def test_match_operators(self):
        item = {"name": "John", "score": 10}

        assert QueryEngine._match(item, {"field": "name", "operator": "eq", "value": "John"})
        assert QueryEngine._match(item, {"field": "name", "operator": "ne", "value": "Jane"})
        assert QueryEngine._match(item, {"field": "score", "operator": "gt", "value": 5})
        assert QueryEngine._match(item, {"field": "score", "operator": "lt", "value": 20})
        assert QueryEngine._match(item, {"field": "score", "operator": "gte", "value": 10})
        assert QueryEngine._match(item, {"field": "score", "operator": "lte", "value": 10})
        assert QueryEngine._match(item, {"field": "name", "operator": "like", "value": "oh"})

    def test_match_returns_false_for_missing_field(self):
        item = {"name": "John"}
        assert not QueryEngine._match(item, {"field": "missing", "operator": "eq", "value": "x"})

    def test_parse_sort_ignores_unknown_fields(self):
        result = QueryEngine.parse_sort("unknown:desc,name:asc", ["name"])
        assert result == [("name", "asc")]
