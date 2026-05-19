"""Override example: replace the generated GET /users/{id} route."""
from fastapi import APIRouter
from fastbackend_fastapi import override

router = APIRouter()


@override("/users/{id}", "get")
@router.get("/users/{user_id}")
async def custom_get_user(user_id: int):
    """Custom retrieve handler; the runtime skips its default GET /users/{id}."""
    return {
        "id": user_id,
        "name": "Override User",
        "email": "override@example.com",
        "source": "custom-override",
    }
