from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.cart import service as cart_service
from app.domains.cart.service import CartItemNotFoundError
from app.engine.schemas import AddToCartAction, RemoveFromCartAction, UpdateCartAction
from app.engine.tools.errors import ActionArgumentError
from app.engine.tools.registry import register_tool


@register_tool("add_to_cart")
async def handle_add_to_cart(
    session: AsyncSession, action: AddToCartAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    # product existence/ownership already validated by evaluate_action (Task 3)
    try:
        return await cart_service.add_item(
            session, merchant_id, conversation_id, action.product_id, action.quantity, notes=action.notes
        )
    except ValueError as exc:
        raise ActionArgumentError([str(exc)]) from exc


@register_tool("update_cart")
async def handle_update_cart(
    session: AsyncSession, action: UpdateCartAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    try:
        return await cart_service.update_item(
            session, merchant_id, conversation_id, action.line_item_id, action.quantity
        )
    except CartItemNotFoundError as exc:
        raise ActionArgumentError([str(exc)]) from exc


@register_tool("remove_from_cart")
async def handle_remove_from_cart(
    session: AsyncSession, action: RemoveFromCartAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    try:
        await cart_service.remove_item(session, merchant_id, conversation_id, action.line_item_id)
    except CartItemNotFoundError as exc:
        raise ActionArgumentError([str(exc)]) from exc
    return {}
