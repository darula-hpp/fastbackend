"""FastBackend marker decorators for custom endpoints."""

from __future__ import annotations

from functools import wraps
from typing import Any, Callable


def override(path: str, method: str) -> Callable:
    """
    Mark a custom endpoint as an override for a runtime-created route.

    Usage:
        @fastbackend.override("/users", "get")
        @router.get("/users")
        async def custom_list_users():
            ...
    """
    def decorator(func: Callable) -> Callable:
        func.__fastbackend_override__ = {"path": path, "method": method.upper()}  # type: ignore[attr-defined]

        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            return await func(*args, **kwargs)

        wrapper.__fastbackend_override__ = {"path": path, "method": method.upper()}  # type: ignore[attr-defined]
        return wrapper

    return decorator
