"""Custom email endpoint example."""
from fastapi import APIRouter

router = APIRouter()


@router.post("/users/{user_id}/send-email")
async def send_email(user_id: int):
    """Send a notification email to the user."""
    return {"status": "sent", "user_id": user_id}
