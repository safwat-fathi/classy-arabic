

_UNAVAILABLE_MSG = (
    "cart storage (SRD S25 Cart/CartItem) does not exist yet - "
    "see ROADMAP.md 'Cart & checkout services'"
)


async def add_item(merchant_id: str, conversation_id: str, product_id: str, quantity: float) -> None:
    raise NotImplementedError(_UNAVAILABLE_MSG)


async def update_item(merchant_id: str, conversation_id: str, line_item_id: str, quantity: float) -> None:
    raise NotImplementedError(_UNAVAILABLE_MSG)


async def remove_item(merchant_id: str, conversation_id: str, line_item_id: str) -> None:
    raise NotImplementedError(_UNAVAILABLE_MSG)
