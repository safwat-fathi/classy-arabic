from fastapi import APIRouter

from app.core.config import settings
from app.domains.health.schemas import HealthResponse

router = APIRouter()


@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    Check if the API is running.
    """
    return HealthResponse(status="ok", version=settings.VERSION)
