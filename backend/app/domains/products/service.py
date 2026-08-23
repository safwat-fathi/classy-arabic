from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.products.schemas import ProductRead
from app.models import Product


async def list_products(db: AsyncSession, merchant_id: str) -> list[ProductRead]:
    stmt = select(Product).where(Product.merchant_id == merchant_id).order_by(Product.name)
    result = await db.execute(stmt)
    products = result.scalars().all()
    return [
        ProductRead(
            id=p.id,
            merchant_id=p.merchant_id,
            name=p.name,
            aliases=p.aliases,
            variants=p.variants,
        )
        for p in products
    ]
