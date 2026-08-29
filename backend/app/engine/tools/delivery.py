from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.checkout import service as checkout_service
from app.engine.schemas import GetDeliveryInfoAction
from app.engine.tools.registry import register_tool


@register_tool("get_delivery_info")
async def handle_get_delivery_info(
    session: AsyncSession, action: GetDeliveryInfoAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    return await checkout_service.validate_delivery_area(session, merchant_id, action.address)
