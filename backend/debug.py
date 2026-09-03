import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import async_session_maker
from app.models import Order
from app.domains.checkout.schemas import OrderRead

async def debug():
    async with async_session_maker() as session:
        merchant_id = '5ca4ddb1-f1f0-4363-882e-e83c0c2ab233'
        stmt = (
            select(Order)
            .where(Order.merchant_id == merchant_id)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
        )
        result = await session.execute(stmt)
        orders = result.scalars().all()
        for o in orders:
            print("Order dict:", o.__dict__)
            try:
                res = OrderRead.model_validate(o)
                print("Parsed:", res)
            except Exception as e:
                print("Error parsing order", o.id, e)

asyncio.run(debug())
