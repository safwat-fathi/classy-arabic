from fastapi import APIRouter

from app.domains.auth.router import router as auth_router
from app.domains.channels.router import router as channels_router
from app.domains.conversations.router import router as conversations_router
from app.domains.health.router import router as health_router
from app.domains.messages.router import router as messages_router
from app.domains.products.router import router as products_router
from app.domains.store_knowledge.router import router as store_knowledge_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(messages_router, prefix="/messages", tags=["messages"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(conversations_router, prefix="/conversations", tags=["conversations"])
api_router.include_router(store_knowledge_router, prefix="/store-knowledge", tags=["store-knowledge"])
api_router.include_router(channels_router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
