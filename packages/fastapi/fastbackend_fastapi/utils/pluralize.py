"""Shared runtime utilities."""

from __future__ import annotations


def pluralize(name: str) -> str:
    lower = name.lower()
    if lower.endswith("y"):
        return f"{lower[:-1]}ies"
    if lower.endswith(("s", "x", "ch", "sh")):
        return f"{lower}es"
    return f"{lower}s"
