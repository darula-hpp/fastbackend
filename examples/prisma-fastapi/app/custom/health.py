"""Custom health check extensions."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health/custom")
async def custom_health():
    return {"custom": "ok"}
