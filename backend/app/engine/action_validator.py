from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.schemas import AddToCartAction, GetProductAction, ProposedAction
from app.models.enums import VariantStatus
from app.models.product import Product
from app.models.product_variant import ProductVariant


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


async def _check_product_ownership(session: AsyncSession, product_id: str, merchant_id: str) -> list[ValidationError]:
    product = await session.get(Product, product_id)
    if (err := check_product_exists(product)) is not None:
        return [err]
    if (err := check_product_belongs_to_merchant(product, merchant_id)) is not None:
        return [err]
    return []


def check_variant_exists(variant: ProductVariant | None) -> ValidationError | None:
    if variant is None:
        return ValidationError("variant_not_found", "variant_id does not reference an existing variant")
    return None


def check_variant_belongs_to_product(variant: ProductVariant, product_id: str) -> ValidationError | None:
    if variant.product_id != product_id:
        return ValidationError("variant_not_owned", "variant belongs to a different product")
    return None


def check_variant_is_active(variant: ProductVariant) -> ValidationError | None:
    if variant.status != VariantStatus.ACTIVE:
        return ValidationError("variant_not_active", "variant is not active")
    return None


async def _check_variant_ownership(session: AsyncSession, variant_id: str, product_id: str) -> list[ValidationError]:
    variant = await session.get(ProductVariant, variant_id)
    if (err := check_variant_exists(variant)) is not None:
        return [err]
    if (err := check_variant_belongs_to_product(variant, product_id)) is not None:
        return [err]
    if (err := check_variant_is_active(variant)) is not None:
        return [err]
    return []


async def evaluate_action(session: AsyncSession, action: ProposedAction, *, merchant_id: str) -> ValidationResult:
    """Runs SRD S20's DB-checkable validator rules for the given action.

    Quantity validity is enforced at the Pydantic schema layer (schemas.py) and
    is not re-checked here. Product status/stock checks are deferred — Product
    has no status or stock column yet (Global Constraints). Variant
    ownership/status is checked for add_to_cart when a variant_id is given
    (variant→product is transitive since ProductVariant has no direct
    merchant_id; product ownership against the merchant is checked first, so
    the variant check only runs once that has already passed).
    search_products/update_cart/remove_from_cart/get_checkout_state/
    update_customer_info/create_order/search_store_knowledge/get_delivery_info
    have no DB-checkable rules beyond the schema layer today.
    """
    errors: list[ValidationError] = []
    if isinstance(action, (GetProductAction, AddToCartAction)):
        errors = await _check_product_ownership(session, action.product_id, merchant_id)
    if not errors and isinstance(action, AddToCartAction) and action.variant_id is not None:
        errors = await _check_variant_ownership(session, action.variant_id, action.product_id)
    return ValidationResult(approved=not errors, errors=errors)
