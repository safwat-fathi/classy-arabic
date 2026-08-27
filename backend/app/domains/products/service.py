from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.products.schemas import ProductRead, ProductVariantRead
from app.models import Product


def _to_product_read(p: Product) -> ProductRead:
    return ProductRead(
        id=p.id,
        merchant_id=p.merchant_id,
        name=p.name,
        aliases=p.aliases,
        variants=[
            ProductVariantRead(
                id=v.id,
                product_id=v.product_id,
                label=v.label,
                sku=v.sku,
                price=float(v.price) if v.price is not None else None,
                stock=v.stock,
                status=v.status.value,
                attributes=v.attributes,
            )
            for v in p.variants
        ],
        price=float(p.price) if p.price is not None else None,
    )


async def list_products(db: AsyncSession, merchant_id: str) -> list[ProductRead]:
    stmt = (
        select(Product)
        .where(Product.merchant_id == merchant_id)
        .options(selectinload(Product.variants))
        .order_by(Product.name)
    )
    result = await db.execute(stmt)
    return [_to_product_read(p) for p in result.scalars().all()]


async def search_products(db: AsyncSession, merchant_id: str, query: str, filters: dict) -> list[ProductRead]:
    stmt = (
        select(Product)
        .where(
            Product.merchant_id == merchant_id,
            or_(Product.name.ilike(f"%{query}%"), Product.aliases.any(query)),
        )
        .options(selectinload(Product.variants))
    )
    result = await db.execute(stmt)
    return [_to_product_read(p) for p in result.scalars().all()]


async def get_product(db: AsyncSession, merchant_id: str, product_id: str) -> ProductRead | None:
    product = await db.get(Product, product_id, options=[selectinload(Product.variants)], populate_existing=True)
    if product is None or product.merchant_id != merchant_id:
        return None
    return _to_product_read(product)
