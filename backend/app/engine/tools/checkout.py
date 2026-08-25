import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.checkout import service as checkout_service
from app.engine.schemas import CreateOrderAction, GetCheckoutStateAction, UpdateCustomerInfoAction
from app.engine.tools.errors import ActionArgumentError
from app.engine.tools.registry import register_tool
from app.models.conversation import Conversation

_EGYPT_MOBILE_RE = re.compile(r"^01[0125]\d{8}$")


@register_tool("update_customer_info")
async def handle_update_customer_info(
    session: AsyncSession, action: UpdateCustomerInfoAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    if action.phone and not _EGYPT_MOBILE_RE.match(action.phone):
        raise ActionArgumentError([f"phone {action.phone!r} is not a valid Egyptian mobile number"])

    conversation = await session.get(Conversation, conversation_id)
    # Reassign the whole dict, don't mutate in place — SQLAlchemy's JSON column
    # type does not detect in-place `.update()`/`[key] =` writes as a change,
    # so an in-place mutation here would silently never be persisted.
    slots = dict(conversation.slots)
    captured: dict[str, str] = {}
    for field, value in (("name", action.name), ("phone", action.phone), ("address", action.address)):
        if value:
            slots[f"customer_{field}"] = value
            captured[field] = value
    conversation.slots = slots

    delivery = await checkout_service.validate_delivery_area(merchant_id, action.address)
    return {"captured": captured, "delivery_validation": delivery}


@register_tool("get_checkout_state")
async def handle_get_checkout_state(
    session: AsyncSession, action: GetCheckoutStateAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    return await checkout_service.get_checkout_state(session, merchant_id, conversation_id)


@register_tool("create_order")
async def handle_create_order(
    session: AsyncSession, action: CreateOrderAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    return await checkout_service.create_order(session, merchant_id, conversation_id, action.confirm, message_id)
