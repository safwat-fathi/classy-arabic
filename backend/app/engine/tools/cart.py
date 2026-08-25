from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.cart import service as cart_service
from app.engine.schemas import AddToCartAction, RemoveFromCartAction, UpdateCartAction
from app.engine.tools.errors import ToolUnavailableError
from app.engine.tools.registry import register_tool


@register_tool("add_to_cart")
async def handle_add_to_cart(
    session: AsyncSession, action: AddToCartAction, merchant_id: str, conversation_id: str
) -> dict:
    # product existence/ownership already validated by evaluate_action (Task 3)
    try:
        await cart_service.add_item(merchant_id, conversation_id, action.product_id, action.quantity)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc
    return {}


@register_tool("update_cart")
async def handle_update_cart(
    session: AsyncSession, action: UpdateCartAction, merchant_id: str, conversation_id: str
) -> dict:
    try:
        await cart_service.update_item(merchant_id, conversation_id, action.line_item_id, action.quantity)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc
    return {}


@register_tool("remove_from_cart")
async def handle_remove_from_cart(
    session: AsyncSession, action: RemoveFromCartAction, merchant_id: str, conversation_id: str
) -> dict:
    try:
        await cart_service.remove_item(merchant_id, conversation_id, action.line_item_id)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc
    return {}
