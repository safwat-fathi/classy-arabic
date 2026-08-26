import asyncio
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import delete, select

from app.core.database import async_session_maker
from app.engine.embeddings import embed_text
from app.models import (
    Conversation,
    ConvState,
    Direction,
    Merchant,
    Message,
    Product,
    StoreKnowledge,
)
from app.models._ids import new_id

MERCHANT_NAME = "Classy Boutique"
DEMO_CUSTOMER_REF = "demo-visitor"

PRODUCTS = [
    {
        "name": "Classic Denim Jacket",
        "aliases": ["جاكيت جينز", "جاكيت ازرق", "denim jacket", "jacket"],
        "variants": {"sizes": ["S", "M", "L", "XL"], "colors": ["Blue", "Black"]},
        "price": Decimal("899.00"),
    },
    {
        "name": "Summer Linen Dress",
        "aliases": ["فستان صيفي", "فستان كتان", "linen dress"],
        "variants": {"sizes": ["S", "M", "L"], "colors": ["White", "Beige"]},
        "price": Decimal("1299.00"),
    },
    {
        "name": "Essential Black T-Shirt",
        "aliases": ["تيشيرت اسود", "تيشيرت أساسي", "black tshirt", "tshirt"],
        "variants": {"sizes": ["S", "M", "L", "XL"]},
        "price": Decimal("249.00"),
    },
]

STORE_KNOWLEDGE = [
    {
        "knowledge_type": "shipping",
        "title": "سياسة الشحن والتوصيل",
        "content": (
            "بنشحن لكل محافظات مصر، والتوصيل بياخد من يومين لأربعة أيام عمل حسب "
            "المنطقة. مصاريف الشحن بتتحدد حسب المحافظة وبتتقال للعميل قبل تأكيد الأوردر."
        ),
        "keywords": ["شحن", "توصيل", "التوصيل", "الشحن", "بيوصل", "هيوصل", "shipping", "delivery"],
    },
    {
        "knowledge_type": "returns",
        "title": "سياسة الاستبدال والإرجاع",
        "content": (
            "تقدر تستبدل أو ترجع أي قطعة خلال 14 يوم من الاستلام، بشرط إنها لسه "
            "بالتيكيت وملهاش استخدام. الاستبدال مجاني، والإرجاع بيتم خصم مصاريف الشحن."
        ),
        "keywords": ["استبدال", "ارجاع", "إرجاع", "استرجاع", "تغيير المقاس", "return", "exchange"],
    },
    {
        "knowledge_type": "payment",
        "title": "طرق الدفع المتاحة",
        "content": (
            "بنقبل الدفع كاش عند الاستلام، أو InstaPay، أو فودافون كاش. تقدر تختار "
            "الطريقة اللي تريحك وقت تأكيد الأوردر."
        ),
        "keywords": ["دفع", "ادفع", "الدفع", "فلوس", "كاش", "انستا", "instapay", "vodafone cash", "payment"],
    },
    {
        "knowledge_type": "general",
        "title": "مواعيد العمل",
        "content": "متجرنا شغال من الساعة 10 الصبح لحد 10 بالليل كل يوم، وبنرد على رسايلكم أول بأول.",
        "keywords": ["مواعيد", "فاتحين", "شغالين", "بتفتحوا", "hours", "متاحين"],
    },
    {
        "knowledge_type": "faq",
        "title": "دليل المقاسات",
        "content": (
            "المقاسات عندنا من S لحد XL. لو مش متأكد من مقاسك، ابعتلنا طولك ووزنك "
            "وهنرشحلك المقاس المناسب."
        ),
        "keywords": ["مقاس", "مقاسات", "سايز", "size", "sizing"],
    },
]


async def seed_data():
    async with async_session_maker() as session:
        # 1. Find-or-create the merchant by its stable name, so re-running this
        # script doesn't create duplicate "Classy Boutique" merchants (Merchant
        # has no unique constraint on name; the operator-facing DEMO_STOPGAP_MERCHANT_ID
        # env var must keep pointing at the same id across re-seeds).
        merchant = (
            await session.execute(select(Merchant).where(Merchant.name == MERCHANT_NAME))
        ).scalar_one_or_none()
        if merchant is None:
            merchant = Merchant(id=new_id(), name=MERCHANT_NAME, ai_tool_ordering_enabled=False)
            session.add(merchant)
            await session.flush()

        # 2. Replace this merchant's products every run. Safe only because
        # ai_tool_ordering_enabled stays False for this merchant — no Cart/Order
        # row can ever reference these product ids (see plan's Global Constraints).
        await session.execute(delete(Product).where(Product.merchant_id == merchant.id))
        for spec in PRODUCTS:
            product = Product(
                id=new_id(),
                merchant_id=merchant.id,
                name=spec["name"],
                aliases=spec["aliases"],
                variants=spec["variants"],
                price=spec["price"],
            )
            product.embedding = await embed_text(f"{product.name} " + " ".join(product.aliases))
            session.add(product)

        # 3. Replace this merchant's FAQ/policy content every run.
        await session.execute(delete(StoreKnowledge).where(StoreKnowledge.merchant_id == merchant.id))
        for spec in STORE_KNOWLEDGE:
            session.add(
                StoreKnowledge(
                    id=new_id(),
                    merchant_id=merchant.id,
                    knowledge_type=spec["knowledge_type"],
                    title=spec["title"],
                    content=spec["content"],
                    keywords=spec["keywords"],
                )
            )

        # 4. Find-or-create ONE stable seed conversation — the demo page picks
        # conversations[0] (most recently active), so keeping this stable
        # across re-seeds keeps the demo's picked conversation id stable too.
        # Message history is not touched on re-seed (harmless clutter; nothing
        # in the demo reads conversation history for display).
        conversation = (
            await session.execute(
                select(Conversation).where(
                    Conversation.merchant_id == merchant.id, Conversation.customer_ref == DEMO_CUSTOMER_REF
                )
            )
        ).scalar_one_or_none()
        if conversation is None:
            conversation = Conversation(
                id=new_id(),
                merchant_id=merchant.id,
                customer_ref=DEMO_CUSTOMER_REF,
                state=ConvState.GATHERING,
                slots={},
                last_message_at=datetime.now(UTC),
            )
            session.add(conversation)
            await session.flush()

            m1 = Message(
                id=new_id(),
                conversation_id=conversation.id,
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
        print(f"Conversation ID : {conversation.id}")
        print(f"Seeded {len(PRODUCTS)} products and {len(STORE_KNOWLEDGE)} store knowledge entries.")
        print("=" * 50)
        print("\n👉 Copy the Merchant ID into DEMO_STOPGAP_MERCHANT_ID in frontend/.env.local\n")


if __name__ == "__main__":
    asyncio.run(seed_data())
