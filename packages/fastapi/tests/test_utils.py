"""Tests for shared utilities."""

from fastbackend_fastapi.utils.pluralize import pluralize


class TestPluralize:
    def test_regular_noun(self):
        assert pluralize("User") == "users"

    def test_noun_ending_in_y(self):
        assert pluralize("Category") == "categories"

    def test_noun_ending_in_s(self):
        assert pluralize("Class") == "classes"
