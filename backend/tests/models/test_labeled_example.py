from sqlalchemy import delete, select

from app.models import LabeledExample, Merchant


async def test_labeled_example_merchant_id_fk_set_null_on_merchant_delete(db_session, merchant):
    example = LabeledExample(
        merchant_id=merchant.id,
        normalized_text="عايز اشوف الاحذية",
        intent="browse_catalog",
        source="test",
    )
    db_session.add(example)
    await db_session.flush()
    example_id = example.id

    await db_session.execute(delete(Merchant).where(Merchant.id == merchant.id))
    await db_session.flush()
    # The `example` instance still sitting in the session's identity map has
    # stale in-memory attributes (SET NULL is applied by Postgres as a side
    # effect of the DELETE above, not by SQLAlchemy) — expire it so the
    # select below re-reads merchant_id from the database instead of
    # returning the cached pre-delete value.
    db_session.expire_all()

    result = await db_session.execute(select(LabeledExample).where(LabeledExample.id == example_id))
    row = result.scalar_one()
    assert row.merchant_id is None
