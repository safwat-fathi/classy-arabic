from app.engine.action_validator import (
    ValidationError,
    check_product_belongs_to_merchant,
    check_product_exists,
    check_variant_belongs_to_product,
    check_variant_exists,
    check_variant_is_active,
    evaluate_action,
)
from app.engine.schemas import AddToCartAction, GetCheckoutStateAction, GetProductAction
from app.models.enums import VariantStatus
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.product_variant import ProductVariant


def test_check_product_exists_none():
    err = check_product_exists(None)
    assert err == ValidationError("product_not_found", "product_id does not reference an existing product")


def test_check_product_exists_ok():
    assert check_product_exists(Product(id="p1", merchant_id="m1", name="Shirt")) is None


def test_check_product_belongs_to_merchant_mismatch():
    product = Product(id="p1", merchant_id="other-merchant", name="Shirt")
    err = check_product_belongs_to_merchant(product, "m1")
    assert err == ValidationError("product_not_owned", "product belongs to a different merchant")


def test_check_product_belongs_to_merchant_ok():
    product = Product(id="p1", merchant_id="m1", name="Shirt")
    assert check_product_belongs_to_merchant(product, "m1") is None


async def test_evaluate_action_rejects_unknown_product(db_session, merchant):
    action = GetProductAction(action="get_product", product_id="does-not-exist", confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is False
    assert result.errors[0].code == "product_not_found"


async def test_evaluate_action_rejects_other_merchants_product(db_session, merchant):
    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()
    other = Product(id="p-other", merchant_id=other_merchant.id, name="Shoes")
    db_session.add(other)
    await db_session.flush()
    action = GetProductAction(action="get_product", product_id="p-other", confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is False
    assert result.errors[0].code == "product_not_owned"


async def test_evaluate_action_approves_owned_product(db_session, merchant):
    product = Product(id="p-mine", merchant_id=merchant.id, name="Shoes")
    db_session.add(product)
    await db_session.flush()
    action = GetProductAction(action="get_product", product_id="p-mine", confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is True
    assert result.errors == []


async def test_evaluate_action_approves_actions_with_no_db_checkable_rules(db_session, merchant):
    action = GetCheckoutStateAction(action="get_checkout_state", confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is True


def test_check_variant_exists_none():
    err = check_variant_exists(None)
    assert err == ValidationError("variant_not_found", "variant_id does not reference an existing variant")


def test_check_variant_exists_ok():
    assert check_variant_exists(ProductVariant(id="v1", product_id="p1", label="M / Blue")) is None


def test_check_variant_belongs_to_product_mismatch():
    variant = ProductVariant(id="v1", product_id="other-product", label="M / Blue")
    err = check_variant_belongs_to_product(variant, "p1")
    assert err == ValidationError("variant_not_owned", "variant belongs to a different product")


def test_check_variant_belongs_to_product_ok():
    variant = ProductVariant(id="v1", product_id="p1", label="M / Blue")
    assert check_variant_belongs_to_product(variant, "p1") is None


def test_check_variant_is_active_rejects_discontinued():
    variant = ProductVariant(id="v1", product_id="p1", label="M / Blue", status=VariantStatus.DISCONTINUED)
    err = check_variant_is_active(variant)
    assert err == ValidationError("variant_not_active", "variant is not active")


def test_check_variant_is_active_ok():
    variant = ProductVariant(id="v1", product_id="p1", label="M / Blue", status=VariantStatus.ACTIVE)
    assert check_variant_is_active(variant) is None


async def test_evaluate_action_add_to_cart_rejects_unknown_variant(db_session, merchant):
    product = Product(id="p-mine", merchant_id=merchant.id, name="Shirt")
    db_session.add(product)
    await db_session.flush()
    action = AddToCartAction(
        action="add_to_cart", product_id="p-mine", variant_id="does-not-exist", quantity=1, confidence=0.9
    )
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is False
    assert result.errors[0].code == "variant_not_found"


async def test_evaluate_action_add_to_cart_rejects_variant_belonging_to_different_product(db_session, merchant):
    product = Product(id="p-mine", merchant_id=merchant.id, name="Shirt")
    other_product = Product(id="p-other", merchant_id=merchant.id, name="Shoes")
    db_session.add_all([product, other_product])
    await db_session.flush()
    variant = ProductVariant(id="v-other", product_id="p-other", label="M / Blue")
    db_session.add(variant)
    await db_session.flush()

    action = AddToCartAction(
        action="add_to_cart", product_id="p-mine", variant_id="v-other", quantity=1, confidence=0.9
    )
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is False
    assert result.errors[0].code == "variant_not_owned"


async def test_evaluate_action_add_to_cart_allows_valid_variant(db_session, merchant):
    product = Product(id="p-mine", merchant_id=merchant.id, name="Shirt")
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(id="v-mine", product_id="p-mine", label="M / Blue")
    db_session.add(variant)
    await db_session.flush()

    action = AddToCartAction(action="add_to_cart", product_id="p-mine", variant_id="v-mine", quantity=1, confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is True
    assert result.errors == []
