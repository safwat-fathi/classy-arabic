from app.domains.store_knowledge.service import search
from app.models import StoreKnowledge


async def test_search_returns_empty_list_when_nothing_seeded(db_session, merchant):
    results = await search(db_session, merchant.id, "الشحن بيوصل امتى؟")
    assert results == []


async def test_search_matches_on_keyword_substring(db_session, merchant):
    db_session.add(
        StoreKnowledge(
            merchant_id=merchant.id,
            knowledge_type="shipping",
            title="سياسة الشحن",
            content="بنشحن لكل محافظات مصر خلال يومين لأربعة أيام.",
            keywords=["شحن", "توصيل", "shipping"],
        )
    )
    await db_session.flush()

    results = await search(db_session, merchant.id, "الشحن بيوصل امتى؟")

    assert len(results) == 1
    assert results[0]["content"] == "بنشحن لكل محافظات مصر خلال يومين لأربعة أيام."


async def test_search_is_scoped_to_merchant(db_session, merchant):
    from app.models import Merchant

    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()
    db_session.add(
        StoreKnowledge(
            merchant_id=other_merchant.id, knowledge_type="shipping", title="x",
            content="not this merchant's answer", keywords=["شحن"],
        )
    )
    await db_session.flush()

    results = await search(db_session, merchant.id, "الشحن بيوصل امتى؟")
    assert results == []


async def test_search_filters_by_knowledge_type(db_session, merchant):
    db_session.add(
        StoreKnowledge(
            merchant_id=merchant.id, knowledge_type="returns", title="استبدال",
            content="تقدر تستبدل خلال 14 يوم.", keywords=["شحن"],
        )
    )
    await db_session.flush()

    results = await search(db_session, merchant.id, "الشحن بيوصل امتى؟", knowledge_type="shipping")
    assert results == []


async def test_search_ranks_more_specific_keyword_first(db_session, merchant):
    db_session.add(
        StoreKnowledge(
            merchant_id=merchant.id,
            knowledge_type="shipping",
            title="سياسات ومواعيد الشحن",
            content="يتم شحن الطلبات خلال 24 ساعة من تأكيد الطلب.",
            keywords=["مواعيد"],
        )
    )
    db_session.add(
        StoreKnowledge(
            merchant_id=merchant.id,
            knowledge_type="general",
            title="ساعات العمل",
            content="فريق خدمة العملاء متاح من السبت إلى الخميس، من 10 صباحاً حتى 10 مساءً.",
            keywords=["مواعيد العمل"],
        )
    )
    await db_session.flush()

    results = await search(db_session, merchant.id, "ايه هي مواعيد العمل؟")

    assert len(results) == 2
    assert results[0]["content"] == "فريق خدمة العملاء متاح من السبت إلى الخميس، من 10 صباحاً حتى 10 مساءً."
