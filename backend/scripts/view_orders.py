import asyncio
import json

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models import Order


async def view_orders():
    async with async_session_maker() as session:
        result = await session.execute(select(Order))
        orders = result.scalars().all()

        if not orders:
            print("No orders found.")
            return

        print(f"Found {len(orders)} orders:\n" + "=" * 50)

        for order in orders:
            print(f"Order ID       : {order.id}")
            print(f"Conversation ID: {order.conversation_id}")
            print(f"Status         : {order.status.value}")
            print(f"Confidence     : {order.confidence_score}")
            print(f"Tier           : {order.extracted_by_tier.value}")

            # Use ensure_ascii=False to print actual Arabic characters instead of \uXXXX
            payload = json.dumps(order.extracted_payload, ensure_ascii=False, indent=2)
            print("Payload:")
            print(payload)
            print("-" * 50)


if __name__ == "__main__":
    asyncio.run(view_orders())
