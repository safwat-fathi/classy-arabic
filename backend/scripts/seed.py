import asyncio
from datetime import UTC, datetime

from app.core.database import async_session_maker
from app.engine.embeddings import embed_text
from app.models import (
    Conversation,
    ConvState,
    Direction,
    Merchant,
    Message,
    Product,
)
from app.models._ids import new_id


async def seed_data():
    async with async_session_maker() as session:
        # 1. Create Merchant
        merchant = Merchant(id=new_id(), name="Classy Boutique")
        session.add(merchant)

        # 2. Create Products
        p1 = Product(
            id=new_id(),
            merchant_id=merchant.id,
            name="Summer Linen Dress",
            aliases=["فستان صيفي", "فستان كتان"],
            variants={"sizes": ["S", "M", "L"], "colors": ["White", "Beige"]},
        )
        p2 = Product(
            id=new_id(),
            merchant_id=merchant.id,
            name="Classic Denim Jacket",
            aliases=["جاكيت جينز", "جاكيت ازرق"],
            variants={"sizes": ["M", "L", "XL"]},
        )
        for product in (p1, p2):
            product.embedding = await embed_text(f"{product.name} " + " ".join(product.aliases))
        session.add_all([p1, p2])

        # 3. Create Sample Conversation (GATHERING state)
        c1 = Conversation(
            id=new_id(),
            merchant_id=merchant.id,
            customer_ref="cust_123",
            state=ConvState.GATHERING,
            slots={},
            last_message_at=datetime.now(UTC),
        )
        session.add(c1)

        # 4. Add initial message history
        m1 = Message(
            id=new_id(),
            conversation_id=c1.id,
            direction=Direction.INBOUND,
            raw_text="السلام عليكم، بكام الفستان الصيفي؟",
            normalized_text="السلام عليكم، بكام الفستان الصيفي؟",
            intent="question",
            intent_confidence=0.95,
            created_at=datetime.now(UTC),
        )
        m1.embedding = await embed_text(m1.normalized_text)
        session.add(m1)

        await session.commit()

        print("\n" + "=" * 50)
        print("✅ Database Seeded Successfully!")
        print("=" * 50)
        print(f"Merchant ID     : {merchant.id}")
        print(f"Conversation ID : {c1.id}")
        print("=" * 50)
        print("\n👉 You can now copy this Conversation ID and use it in Swagger:")
        print("   http://localhost:8000/docs -> POST /api/v1/messages/\n")


if __name__ == "__main__":
    asyncio.run(seed_data())
