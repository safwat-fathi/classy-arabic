import pytest

from app.domains.store_knowledge.service import search


async def test_search_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await search("m1", "return policy", "faq")
