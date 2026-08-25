from sqlalchemy import or_, select
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


async def search_products(db: AsyncSession, merchant_id: str, query: str, filters: dict) -> list[ProductRead]:
    stmt = select(Product).where(
        Product.merchant_id == merchant_id,
        or_(Product.name.ilike(f"%{query}%"), Product.aliases.any(query)),
    )
    result = await db.execute(stmt)
    return [
        ProductRead(id=p.id, merchant_id=p.merchant_id, name=p.name, aliases=p.aliases, variants=p.variants)
        for p in result.scalars().all()
    ]


async def get_product(db: AsyncSession, merchant_id: str, product_id: str) -> ProductRead | None:
    product = await db.get(Product, product_id)
    if product is None or product.merchant_id != merchant_id:
        return None
    return ProductRead(
        id=product.id,
        merchant_id=product.merchant_id,
        name=product.name,
        aliases=product.aliases,
        variants=product.variants,
    )
