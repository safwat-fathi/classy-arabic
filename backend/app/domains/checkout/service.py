async def validate_delivery_area(merchant_id: str, address: str | None) -> dict:
    """Stub. Delivery Service (SRD S29) does not exist yet - see ROADMAP.md
    'Delivery service'. Always reports unavailable rather than guessing a
    fee/area match, per SRD S44 (never claim a value the backend can't verify)."""
    return {"status": "unavailable", "reason": "delivery_service_not_built"}


async def get_checkout_state(merchant_id: str, conversation_id: str) -> dict:
    raise NotImplementedError(
        "checkout state requires a Cart (SRD S25) which does not exist yet - "
        "see ROADMAP.md 'Cart & checkout services'"
    )


async def create_order(merchant_id: str, conversation_id: str, confirm: bool) -> dict:
    raise NotImplementedError(
        "create_order requires cart/pricing/order-number support (SRD S26-27) "
        "which does not exist yet - see ROADMAP.md 'Cart & checkout services' / "
        "'Order service hardening'. The Order model exists, but S26's "
        "responsibilities (validate cart, snapshot prices, generate order "
        "number) all need fields Order does not have yet - creating a row "
        "without them would be a semantically-incomplete order, not a real one."
    )
