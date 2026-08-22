from fastapi import APIRouter

from app.domains.health.router import router as health_router
from app.domains.messages.router import router as messages_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(messages_router, prefix="/messages", tags=["messages"])
