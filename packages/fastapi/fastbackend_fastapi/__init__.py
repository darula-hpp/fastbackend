"""FastBackend FastAPI runtime adapter."""

from fastbackend_fastapi.runtime import Runtime, create_app
from fastbackend_fastapi.decorators import override

__version__ = "0.1.0"
__all__ = ["Runtime", "create_app", "override", "__version__"]
