from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.schemas import AddToCartAction, GetProductAction, ProposedAction
from app.models.product import Product


@dataclass(frozen=True)
class ValidationError:
    code: str
    message: str


@dataclass(frozen=True)
class ValidationResult:
    approved: bool
    errors: list[ValidationError] = field(default_factory=list)


def check_product_exists(product: Product | None) -> ValidationError | None:
    if product is None:
        return ValidationError("product_not_found", "product_id does not reference an existing product")
    return None


def check_product_belongs_to_merchant(product: Product, merchant_id: str) -> ValidationError | None:
    if product.merchant_id != merchant_id:
        return ValidationError("product_not_owned", "product belongs to a different merchant")
    return None


async def _check_product_ownership(
    session: AsyncSession, product_id: str, merchant_id: str
) -> list[ValidationError]:
    product = await session.get(Product, product_id)
    if (err := check_product_exists(product)) is not None:
        return [err]
    if (err := check_product_belongs_to_merchant(product, merchant_id)) is not None:
        return [err]
    return []


async def evaluate_action(
    session: AsyncSession, action: ProposedAction, *, merchant_id: str
) -> ValidationResult:
    """Runs SRD S20's DB-checkable validator rules for the given action.

    Quantity validity is enforced at the Pydantic schema layer (schemas.py) and
    is not re-checked here. Product status/stock/variant checks are deferred —
    Product has no status, stock, or structured-variant column yet (Global
    Constraints). search_products/update_cart/remove_from_cart/
    get_checkout_state/update_customer_info/create_order/search_store_knowledge
    have no DB-checkable rules beyond the schema layer today.
    """
    errors: list[ValidationError] = []
    if isinstance(action, (GetProductAction, AddToCartAction)):
        errors = await _check_product_ownership(session, action.product_id, merchant_id)
    return ValidationResult(approved=not errors, errors=errors)
