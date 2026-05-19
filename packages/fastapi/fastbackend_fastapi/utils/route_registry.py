"""Route registry for dynamic route management."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class RegisteredRoute:
    path: str
    methods: list[str]
    entity: str | None = None
    relationship: str | None = None
    is_custom: bool = False
    is_override: bool = False


@dataclass
class RouteRegistry:
    routes: list[RegisteredRoute] = field(default_factory=list)
    overrides: set[str] = field(default_factory=set)

    def register(
        self,
        path: str,
        methods: list[str],
        *,
        entity: str | None = None,
        relationship: str | None = None,
        is_custom: bool = False,
        is_override: bool = False,
    ) -> None:
        self.routes.append(
            RegisteredRoute(
                path=path,
                methods=methods,
                entity=entity,
                relationship=relationship,
                is_custom=is_custom,
                is_override=is_override,
            )
        )

    def mark_override(self, method: str, path: str) -> None:
        self.overrides.add(f"{method.upper()}:{path}")

    def is_overridden(self, method: str, path: str) -> bool:
        return f"{method.upper()}:{path}" in self.overrides

    def summary(self) -> dict[str, int]:
        return {
            "total": len(self.routes),
            "crud": sum(1 for r in self.routes if r.entity and not r.is_custom),
            "relationships": sum(1 for r in self.routes if r.relationship),
            "custom": sum(1 for r in self.routes if r.is_custom),
            "overrides": len(self.overrides),
        }
