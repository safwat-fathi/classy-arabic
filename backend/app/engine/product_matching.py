import logging
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.checkout.order_writer import ResolvedOrderLine
from app.engine.clients import AICallError
from app.engine.embeddings import embed_text
from app.engine.schemas import ExtractedLineItem
from app.models import Product
from app.models.enums import VariantStatus
from app.models.product_variant import ProductVariant

logger = logging.getLogger(__name__)


async def match_line_items_to_products(
    session: AsyncSession,
    merchant_id: str,
    line_items: list[ExtractedLineItem],
    max_distance: float = 0.45,
) -> list[ExtractedLineItem]:
    matched: list[ExtractedLineItem] = []
    for item in line_items:
        try:
            embedding = await embed_text(item.product_name)
        except AICallError as exc:
            logger.warning("product_match_embedding_failed product_name=%r error=%s", item.product_name, exc)
            matched.append(item.model_copy(update={"product_id": None}))
            continue
        distance_col = Product.embedding.cosine_distance(embedding)
        result = await session.execute(
            select(Product, distance_col)
            .where(Product.merchant_id == merchant_id, Product.embedding.is_not(None))
            .order_by(distance_col)
            .limit(1)
        )
        row = result.first()
        product_id = None
        if row is not None:
            product, distance = row
            if distance <= max_distance:
                product_id = product.id
        matched.append(item.model_copy(update={"product_id": product_id}))
    return matched


@dataclass(frozen=True)
class VariantCandidate:
    id: str
    label: str
    attributes: dict[str, str]


def match_variant_hint(hint: str | None, candidates: list[VariantCandidate]) -> str | None:
    """Pure, no DB access. Case-insensitive substring match: first check
    `hint` against each candidate's label, then against each attribute value
    (in candidate order). Returns the first candidate id that matches, or
    None if hint is empty, candidates is empty, or nothing matches. Never
    raises."""
    if not hint or not candidates:
        return None
    hint_lower = hint.lower()
    for candidate in candidates:
        if hint_lower in candidate.label.lower():
            return candidate.id
    for candidate in candidates:
        for value in candidate.attributes.values():
            if hint_lower in str(value).lower():
                return candidate.id
    return None


async def resolve_variants_for_line_items(
    session: AsyncSession, line_items: list[ExtractedLineItem]
) -> list[ExtractedLineItem]:
    """For each item with a resolved product_id, load that product's ACTIVE
    ProductVariant rows (one batched query for all items, not one per item).
    If a product has no active variants, the item passes through unchanged
    (variant_required stays False). If it has any, variant_required is set
    True and match_variant_hint fills variant_id (None if the hint doesn't
    match anything). Items with no product_id pass through unchanged."""
    product_ids = {item.product_id for item in line_items if item.product_id is not None}
    variants_by_product: dict[str, list[ProductVariant]] = {}
    if product_ids:
        result = await session.execute(
            select(ProductVariant).where(
                ProductVariant.product_id.in_(product_ids),
                ProductVariant.status == VariantStatus.ACTIVE,
            )
        )
        for variant in result.scalars().all():
            variants_by_product.setdefault(variant.product_id, []).append(variant)

    resolved: list[ExtractedLineItem] = []
    for item in line_items:
        candidates_orm = variants_by_product.get(item.product_id, []) if item.product_id else []
        if not candidates_orm:
            resolved.append(item)
            continue
        candidates = [
            VariantCandidate(id=variant.id, label=variant.label, attributes=variant.attributes or {})
            for variant in candidates_orm
        ]
        variant_id = match_variant_hint(item.variant_hint, candidates)
        resolved.append(item.model_copy(update={"variant_required": True, "variant_id": variant_id}))
    return resolved


async def build_resolved_order_lines(
    session: AsyncSession, line_items: list[ExtractedLineItem]
) -> tuple[list[ResolvedOrderLine], bool]:
    """Batch-loads Product and ProductVariant rows for every resolved id
    across all line_items (one query pair, not one query per item), applies
    the price-fallback rule (variant price if resolved+priced, else product
    price), and returns (lines, all_resolved).

    all_resolved is False if: line_items is empty, OR any item has no
    product_id, OR any item has variant_required=True but variant_id is
    None, OR the resolved product/variant combination has no price
    available. Only items that pass all three checks become entries in
    `lines` — an item that fails one check is simply excluded from `lines`,
    it does not abort the batch.
    """
    if not line_items:
        return [], False

    product_ids = {item.product_id for item in line_items if item.product_id is not None}
    variant_ids = {item.variant_id for item in line_items if item.variant_id is not None}

    products_by_id: dict[str, Product] = {}
    if product_ids:
        result = await session.execute(select(Product).where(Product.id.in_(product_ids)))
        products_by_id = {product.id: product for product in result.scalars().all()}

    variants_by_id: dict[str, ProductVariant] = {}
    if variant_ids:
        result = await session.execute(select(ProductVariant).where(ProductVariant.id.in_(variant_ids)))
        variants_by_id = {variant.id: variant for variant in result.scalars().all()}

    lines: list[ResolvedOrderLine] = []
    all_resolved = True
    for item in line_items:
        if item.product_id is None:
            all_resolved = False
            continue
        if item.variant_required and item.variant_id is None:
            all_resolved = False
            continue

        product = products_by_id.get(item.product_id)
        if product is None:
            all_resolved = False
            continue
        variant = variants_by_id.get(item.variant_id) if item.variant_id is not None else None

        unit_price = variant.price if (variant is not None and variant.price is not None) else product.price
        if unit_price is None:
            all_resolved = False
            continue

        lines.append(
            ResolvedOrderLine(
                product_id=product.id,
                variant_id=variant.id if variant is not None else None,
                name_snapshot=product.name,
                variant_snapshot=variant.label if variant is not None else None,
                unit_price=unit_price,
                quantity=item.quantity,
            )
        )
    return lines, all_resolved
