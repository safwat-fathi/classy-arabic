from app.models import StoreKnowledge


async def test_store_knowledge_defaults(db_session, merchant):
    row = StoreKnowledge(
        merchant_id=merchant.id,
        knowledge_type="faq",
        title="مواعيد العمل",
        content="من 10 الصبح لحد 10 بالليل.",
        keywords=["مواعيد", "hours"],
    )
    db_session.add(row)
    await db_session.flush()

    assert row.id is not None
    assert row.created_at is not None
    assert row.keywords == ["مواعيد", "hours"]
