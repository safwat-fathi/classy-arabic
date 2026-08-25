from app.engine.action_validator import (
    ValidationError,
    check_product_belongs_to_merchant,
    check_product_exists,
    evaluate_action,
)
from app.engine.schemas import GetCheckoutStateAction, GetProductAction
from app.models.merchant import Merchant
from app.models.product import Product


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
