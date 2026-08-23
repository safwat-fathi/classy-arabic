import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.engine.embeddings import embed_text
from app.models import LabeledExample


async def run():
    engine = create_async_engine(settings.sqlalchemy_database_uri)
    async with AsyncSession(engine) as session:
        # Get the merchant ID from an existing example or product
        from app.models import Product

        res = await session.execute(select(Product.merchant_id).limit(1))
        merchant_id = res.scalar_one_or_none()
        if not merchant_id:
            print("No merchant found.")
            return

        examples = [
            {
                "normalized_text": "عايزة فستان كتان بيج مقاس small عمارة ١٢٣ فون ٠١١٥٨٨٧٨٤٥٢٤ على العنوان ١٥ مايو طريق التحرير",  # noqa: E501
                "intent": "purchase_intent",
                "extraction": {
                    "line_items": [{"product_name": "فستان كتان بيج", "quantity": 1, "notes": "مقاس small"}],
                    "address": "١٥ مايو طريق التحرير عمارة ١٢٣",
                    "phone": "011588784524",
                    "payment_method": None,
                    "ambiguous_fields": ["payment_method"],
                    "confidence": 0.95,
                },
            },
            {
                "normalized_text": "3ayza jacket denim ma2as xl phone 01123354874 address 6 October el7ay 4",
                "intent": "purchase_intent",
                "extraction": {
                    "line_items": [{"product_name": "jacket denim", "quantity": 1, "notes": "ma2as xl"}],
                    "address": "6 October el7ay 4",
                    "phone": "01123354874",
                    "payment_method": None,
                    "ambiguous_fields": ["payment_method"],
                    "confidence": 0.95,
                },
            },
            {
                "normalized_text": "I want 2 summer linen dresses in white. deliver to maadi street 9. cash on delivery. 01012345678",  # noqa: E501
                "intent": "purchase_intent",
                "extraction": {
                    "line_items": [{"product_name": "summer linen dress", "quantity": 2, "notes": "white"}],
                    "address": "maadi street 9",
                    "phone": "01012345678",
                    "payment_method": "cash_on_delivery",
                    "ambiguous_fields": [],
                    "confidence": 0.98,
                },
            },
        ]

        for ex_data in examples:
            embedding = await embed_text(ex_data["normalized_text"])
            ex = LabeledExample(
                merchant_id=merchant_id,
                normalized_text=ex_data["normalized_text"],
                intent=ex_data["intent"],
                extraction=ex_data["extraction"],
                embedding=embedding,
                source="manual_seed",
            )
            session.add(ex)

        await session.commit()
        print("Successfully seeded extraction examples!")


asyncio.run(run())
