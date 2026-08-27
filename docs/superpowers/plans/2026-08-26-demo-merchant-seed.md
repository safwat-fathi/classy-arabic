# Demo Merchant Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed a rich, realistic demo merchant ("Classy Boutique") that exercises every feature the public `/demo` page can actually show today — non-AI product catalog browsing with real prices, AI purchase-intent classification/extraction with embedding-based product matching, and (newly built here) AI-answered FAQ/policy questions — and make the seed script idempotent so it can be re-run safely.

**Architecture:** No new subsystem or router. `store_knowledge.service.search()` (currently a permanent `NotImplementedError` stub — SRD §23 was never built) becomes a real, minimal keyword-match implementation backed by a new `StoreKnowledge` table; `pipeline.py`'s existing non-tool-ordering branch gets one small addition — when a message doesn't produce an order, try a knowledge-base lookup and carry the matched answer text back through `PipelineResult` → `MessageIngestResponse` — so `POST /messages` (today's actual, if unhardened, demo wiring) can return a real FAQ answer instead of only classification metadata. `ProductRead` gains the `price` field it was always missing, closing the gap where the catalog UI fabricates prices from product names. `backend/scripts/seed.py` is rewritten to be idempotent (find-or-create by stable natural keys, not `new_id()` every run) and to populate all of the above. Everything the demo's own AI features already depend on — `ai_tool_ordering_enabled`, cart, checkout — is left untouched and **off** for this merchant, matching the (unexecuted) `2026-08-25-demo-page-security-hardening.md` plan's own explicit non-goal for the demo.

**Tech Stack:** Same as the rest of the engine — FastAPI, SQLAlchemy 2.0 async, Alembic, pytest + pytest-asyncio (auto mode), real Postgres test DB via the `db_session` fixture (outer transaction + `SAVEPOINT`), `pytest-httpx2`'s `mock_ai` fixture for AI HTTP mocking. Frontend: Next.js 16.3.2 (App Router, Server Actions — confirmed **not** stock Next.js per `frontend/AGENTS.md`), `@inlang/paraglide-next` for i18n (Arabic default at `/`, English at `/en`).

**Spec:** `TijaratkBot_SRD.md` §23 (Store Knowledge Retrieval — this plan implements its MVP shape: `id, tenant_id→merchant_id, type, title, content, keywords, created_at`, keyword/full-text retrieval, tenant-filtered) and §25/§9 (`Product.price`, already a column, just never exposed over the API). `ROADMAP.md:23` ("Store knowledge retrieval — FAQ/shipping/returns content, keyword/full-text retrieval") is the tracked gap this plan closes to a keyword-match MVP. `docs/superpowers/plans/2026-08-25-demo-page-security-hardening.md` is prior art for the demo's target architecture (ephemeral `/demo/*` endpoints, `DEMO_MERCHANT_ID`) but its Phase 2/3 (Tasks 6–12) are **not implemented** — confirmed via `grep -rn "DEMO_MERCHANT_ID\|INTERNAL_API_SECRET" backend/app/core/config.py` (no output) and no `backend/app/domains/demo/` directory. This plan therefore targets today's actual wiring (`GET /products/?merchant_id=`, `GET /conversations/?merchant_id=`, `POST /messages` via `frontend/app/demo/page.tsx`'s `DEMO_STOPGAP_MERCHANT_ID`) rather than the unbuilt ephemeral endpoints — the seed data itself (merchant, products, knowledge rows) is identical either way, so nothing here needs redoing if that hardening plan lands later.

## Global Constraints

- **`Merchant.ai_tool_ordering_enabled` stays `False` for the demo merchant, set explicitly.** Confirmed via user decision: the demo stays read-only (catalog + AI insights + FAQ answers), no cart/checkout UI. This matches the security-hardening plan's own non-goal. Do not seed `Product.price` as a reason to also flip this flag — price is needed for catalog display (Task 4/6), not for enabling ordering.
- **FAQ/policy answering is a real, minimal implementation, not a demo-only hack.** `store_knowledge.service.search()` (Task 2) becomes the actual SRD §23 MVP (keyword match), reachable from any merchant's `POST /messages` traffic, not gated to the demo. This deletes a permanent stub instead of routing around it. It adds zero new AI/network calls (pure DB query).
- **Knowledge lookup is gated on "no order was produced," not on `intent == "question"`.** A visitor's phrasing can classify as `question`, `other`, or even `purchase_intent` depending on the model that turn; gating on the label would make the demo's headline feature flaky for reasons the visitor can't see. The correct, robust gate is: if the purchase-extraction branch didn't produce an `Order`, try a knowledge match. Order takes priority when both could theoretically apply.
- **Product re-seeding is safe only because ordering stays off for this merchant.** The seed script deletes and recreates this merchant's `Product`/`StoreKnowledge` rows on every run (see Task 5). `OrderItem.product_id` has `ondelete="SET NULL"`, and no `CartItem`/`OrderItem` can reference this merchant's products while `ai_tool_ordering_enabled=False` (that's the only path that ever calls `add_to_cart`). **If this flag is ever flipped for this merchant later, delete-and-recreate reseeding is no longer safe** — switch to an upsert-by-name strategy first.
- **Seeding requires a live embedding endpoint.** `seed.py` already calls `embed_text()` per product (existing pattern, unchanged) and `match_line_items_to_products` (`app/engine/product_matching.py`) does a live `cosine_distance` nearest-neighbor lookup against `Product.embedding` with a `max_distance=0.45` cutoff at *query* time too. Seeded product names/aliases must be embedded for AI extraction → catalog-highlight matching to work at all; this is exercised in the Verification section below, not just unit-mocked.
- **All product-catalog images stay within the 3 existing static assets** (`frontend/public/images/{denim_jacket,linen_dress,black_tshirt}.jpg`) — no new image assets are added by this plan. Seeded product names are chosen to match all three via the existing (extended) name-substring `getImageForProduct` matcher.
- **Currency label stays hardcoded** (`m.demo_catalog_egp()` in `product-catalog.tsx`). `Merchant.currency` exists and defaults to `"EGP"`, but plumbing it through is out of scope here — noted so a future reader doesn't think it was missed.
- **Keyword matching is a Python substring check on the seeded `keywords` array**, not the existing `Product.aliases.any(query)` SQLAlchemy idiom (`products/service.py:27`) — that operator matches only when the query string equals an entire array element, which is the wrong shape for "does the customer's free-text message contain one of our trigger phrases." Task 2 does the match in Python: `any(keyword.lower() in query.lower() for keyword in row.keywords)`.
- **No changes to the AI tool-ordering path's user-facing rendering.** `action_resolution.py::_render_response` still falls through to `"Done."` for `search_store_knowledge` once it stops raising — that's a pre-existing gap in a code path this plan doesn't exercise (the demo merchant never reaches it, since `ai_tool_ordering_enabled=False`). Flagged in "Out of scope" below, not fixed here.

---

## Task 1: `StoreKnowledge` model and migration

**Files:**
- Create: `backend/app/models/store_knowledge.py`
- Modify: `backend/app/models/merchant.py`
- Modify: `backend/app/models/__init__.py`
- Create: `backend/alembic/versions/<generated>_add_store_knowledge_table.py`
- Test: `backend/tests/models/test_store_knowledge.py`

**Interfaces:**
- Produces: `StoreKnowledge(id, merchant_id, knowledge_type, title, content, keywords, created_at)` ORM class, importable from `app.models`. Consumed by Task 2 (`store_knowledge.service.search`) and Task 5 (seed script).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/models/test_store_knowledge.py`:

```python
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
```

(`backend/tests/models/__init__.py` already exists per the channel-ingestion models test package — confirm with `ls backend/tests/models/` before assuming; create it empty if missing.)

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && uv run pytest tests/models/test_store_knowledge.py -v`
Expected: FAIL — `ImportError: cannot import name 'StoreKnowledge' from 'app.models'`.

- [ ] **Step 3: Add the model**

Create `backend/app/models/store_knowledge.py`:

```python
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id

if TYPE_CHECKING:
    from app.models.merchant import Merchant


class StoreKnowledge(Base):
    __tablename__ = "store_knowledge"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    knowledge_type: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    keywords: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    merchant: Mapped[Merchant] = relationship(back_populates="store_knowledge")
```

`backend/app/models/merchant.py` — add the reciprocal relationship (matches the existing `products`/`conversations` pattern):

```python
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.product import Product
    from app.models.store_knowledge import StoreKnowledge


class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    ai_tool_ordering_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    currency: Mapped[str] = mapped_column(String, default="EGP", server_default="EGP")
    next_order_number: Mapped[int] = mapped_column(Integer, default=1, server_default="1")

    products: Mapped[list[Product]] = relationship(back_populates="merchant")
    conversations: Mapped[list[Conversation]] = relationship(back_populates="merchant")
    store_knowledge: Mapped[list[StoreKnowledge]] = relationship(back_populates="merchant")
```

`backend/app/models/__init__.py` — register it:

```python
from app.models.ai_action import AIAction
from app.models.ai_usage_event import AIUsageEvent
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.channel_connection import ChannelConnection
from app.models.conversation import Conversation
from app.models.enums import CartStatus, Channel, ConvState, Direction, ModelTier, OrderSource, OrderStatus
from app.models.labeled_example import LabeledExample
from app.models.merchant import Merchant
from app.models.message import Message
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.store_knowledge import StoreKnowledge
from app.models.webhook_event import WebhookEvent

__all__ = [
    "AIAction",
    "AIUsageEvent",
    "Cart",
    "CartItem",
    "CartStatus",
    "Channel",
    "ChannelConnection",
    "ConvState",
    "Conversation",
    "Direction",
    "LabeledExample",
    "Merchant",
    "Message",
    "ModelTier",
    "Order",
    "OrderItem",
    "OrderSource",
    "OrderStatus",
    "Product",
    "StoreKnowledge",
    "WebhookEvent",
]
```

- [ ] **Step 4: Run to verify it fails differently (model registered, no table yet)**

Run: `cd backend && uv run pytest tests/models/test_store_knowledge.py -v`
Expected: FAIL with a DB-level error (`UndefinedTableError: relation "store_knowledge" does not exist`), not an `ImportError` — confirms the model is wired correctly and the only remaining gap is the migration.

- [ ] **Step 5: Generate and write the migration**

Run: `cd backend && uv run alembic revision -m "add store knowledge table"`
This creates `backend/alembic/versions/<hash>_add_store_knowledge_table.py` with `down_revision` auto-filled to the current head. **Verify it reads `down_revision: str | Sequence[str] | None = "258125eec0a2"`** (confirmed current head via `uv run alembic heads` before writing this plan) — if a different plan landed a migration in the meantime, re-check the head and use that instead.

Replace the generated file's `upgrade()`/`downgrade()` (keep the auto-generated header/revision lines):

```python
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

from alembic import op


def upgrade() -> None:
    op.create_table(
        "store_knowledge",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("merchant_id", sa.String(), nullable=False),
        sa.Column("knowledge_type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("keywords", ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_store_knowledge_merchant_id"), "store_knowledge", ["merchant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_store_knowledge_merchant_id"), table_name="store_knowledge")
    op.drop_table("store_knowledge")
```

- [ ] **Step 6: Apply the migration and verify the test passes**

Run: `cd backend && uv run alembic upgrade head`
Run: `cd backend && uv run pytest tests/models/test_store_knowledge.py -v`
Expected: PASS.

Run the full suite once to confirm no regressions: `cd backend && uv run pytest -q`

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/store_knowledge.py backend/app/models/merchant.py backend/app/models/__init__.py backend/alembic/versions/*_add_store_knowledge_table.py backend/tests/models/test_store_knowledge.py
git commit -m "feat: add StoreKnowledge model and migration (SRD §23 schema)"
```

---

## Task 2: Real `store_knowledge.service.search()` — keyword-match MVP

**Files:**
- Modify: `backend/app/domains/store_knowledge/service.py`
- Modify: `backend/app/engine/tools/knowledge.py`
- Modify: `backend/tests/domains/store_knowledge/test_service.py`
- Modify: `backend/tests/engine/test_pipeline.py` (one existing assertion changes — see Step 5)

**Interfaces:**
- Changes: `search(session: AsyncSession, merchant_id: str, query: str, knowledge_type: str | None = None) -> list[dict]` (was `search(merchant_id, query, knowledge_type)`, always raised `NotImplementedError`). Returns `[{"id", "knowledge_type", "title", "content"}, ...]` for every seeded row whose `keywords` contains a substring of `query` (case-insensitive), optionally filtered to `knowledge_type`. Consumed by Task 3 (`pipeline.py`) and the existing `handle_search_store_knowledge` tool.

- [ ] **Step 1: Write the failing tests**

Replace `backend/tests/domains/store_knowledge/test_service.py`:

```python
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
```

(`db_session`/`merchant` fixtures already exist in `backend/tests/conftest.py`.)

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/store_knowledge/test_service.py -v`
Expected: FAIL — `TypeError: search() missing 1 required positional argument: 'session'` (old signature took only `merchant_id, query, knowledge_type`, always raised).

- [ ] **Step 3: Implement**

Replace `backend/app/domains/store_knowledge/service.py`:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import StoreKnowledge


async def search(
    session: AsyncSession, merchant_id: str, query: str, knowledge_type: str | None = None
) -> list[dict]:
    """Keyword-match MVP for SRD §23 ("keyword/full-text retrieval"). Matches
    when any of a row's seeded trigger `keywords` appears as a substring of
    the customer's free-text query — the reverse direction from
    `Product.aliases.any(query)` (which requires an exact element match and
    is the wrong shape for this)."""
    stmt = select(StoreKnowledge).where(StoreKnowledge.merchant_id == merchant_id)
    if knowledge_type:
        stmt = stmt.where(StoreKnowledge.knowledge_type == knowledge_type)
    result = await session.execute(stmt)
    rows = result.scalars().all()

    query_lower = query.lower()
    matches = [row for row in rows if any(keyword.lower() in query_lower for keyword in row.keywords)]

    return [
        {"id": row.id, "knowledge_type": row.knowledge_type, "title": row.title, "content": row.content}
        for row in matches
    ]
```

`backend/app/engine/tools/knowledge.py` — thread `session` through (it's already in scope):

```python
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.store_knowledge import service as knowledge_service
from app.engine.schemas import SearchStoreKnowledgeAction
from app.engine.tools.registry import register_tool


@register_tool("search_store_knowledge")
async def handle_search_store_knowledge(
    session: AsyncSession, action: SearchStoreKnowledgeAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    results = await knowledge_service.search(session, merchant_id, action.query, action.knowledge_type)
    return {"results": results}
```

(`ToolUnavailableError`/`try`/`except` are removed — `search()` no longer raises. Drop the now-unused `from app.engine.tools.errors import ToolUnavailableError` import.)

- [ ] **Step 4: Run to verify the new tests pass**

Run: `cd backend && uv run pytest tests/domains/store_knowledge/test_service.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Fix the one test this breaks elsewhere**

`backend/tests/engine/test_pipeline.py`'s `test_process_message_routes_to_action_resolution_when_enabled` (around line 260) asserts `result.message.escalation_reason == "tool_unavailable:search_store_knowledge"` — that was only true because the tool always raised. With a real, empty-result `search()` (no `StoreKnowledge` rows seeded for the test's `merchant` fixture), `dispatch_action` now returns `status="executed"` and `escalation_reason` stays `None`. Update:

```python
async def test_process_message_routes_to_action_resolution_when_enabled(db_session, conversation, mock_ai):
    # Set the feature flag on the merchant
    merchant = await db_session.get(Merchant, conversation.merchant_id)
    merchant.ai_tool_ordering_enabled = True
    await db_session.flush()

    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(
            200, json=_chat_response('{"action": "search_store_knowledge", "query": "test", "confidence": 0.95}')
        )
    )

    result = await process_message(
        db_session, conversation, _inbound_message(conversation, "order status", "order status")
    )

    # search_store_knowledge now runs for real (Task 2) — with no StoreKnowledge
    # rows seeded for this merchant it returns zero matches, executes
    # successfully, and needs no escalation.
    assert result.message.model_tier == ModelTier.DEEPSEEK
    assert result.message.escalation_reason is None
    assert result.order is None
```

- [ ] **Step 6: Run the full suite**

Run: `cd backend && uv run pytest -q`
Expected: PASS, no other regressions (`grep -rn "search_store_knowledge\|ToolUnavailableError" backend/tests/` to confirm no other test still asserts the old stub behavior — expected zero further hits beyond what was just fixed).

- [ ] **Step 7: Commit**

```bash
git add backend/app/domains/store_knowledge/service.py backend/app/engine/tools/knowledge.py backend/tests/domains/store_knowledge/test_service.py backend/tests/engine/test_pipeline.py
git commit -m "feat: implement store_knowledge.search as a real keyword-match MVP"
```

---

## Task 3: Thread the answer back through the pipeline

**Files:**
- Modify: `backend/app/engine/pipeline.py`
- Modify: `backend/app/domains/messages/schemas.py`
- Modify: `backend/app/domains/messages/service.py`
- Modify: `backend/tests/engine/test_pipeline.py`
- Modify: `backend/tests/domains/test_messages_router.py`

**Interfaces:**
- Changes: `PipelineResult(message: Message, order: Order | None, answer_text: str | None = None)` (new optional field, default preserves every existing call site). `MessageIngestResponse` gains `answer_text: str | None = None`.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/engine/test_pipeline.py` (add `from app.models import StoreKnowledge` to the existing `from app.models import (...)` import line):

```python
async def test_question_intent_returns_seeded_knowledge_answer(db_session, conversation, mock_ai):
    db_session.add(
        StoreKnowledge(
            merchant_id=conversation.merchant_id,
            knowledge_type="shipping",
            title="سياسة الشحن",
            content="بنشحن لكل محافظات مصر خلال يومين لأربعة أيام.",
            keywords=["شحن", "توصيل"],
        )
    )
    await db_session.flush()

    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "question", "confidence": 0.9}'))
    )
    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    result = await process_message(
        db_session, conversation, _inbound_message(conversation, "الشحن بيوصل امتى؟", "الشحن بيوصل امتى؟")
    )

    assert result.answer_text == "بنشحن لكل محافظات مصر خلال يومين لأربعة أيام."


async def test_no_matching_knowledge_leaves_answer_text_none(db_session, conversation, mock_ai):
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "question", "confidence": 0.9}'))
    )
    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    result = await process_message(
        db_session, conversation, _inbound_message(conversation, "الاسعار كام؟", "الاسعار كام؟")
    )

    assert result.answer_text is None


async def test_purchase_intent_with_order_skips_knowledge_lookup(db_session, conversation, mock_ai):
    db_session.add(
        StoreKnowledge(
            merchant_id=conversation.merchant_id, knowledge_type="general", title="x",
            content="should not appear when an order was produced", keywords=["رز"],
        )
    )
    await db_session.flush()

    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        side_effect=[
            httpx.Response(200, json=_chat_response('{"intent": "purchase_intent", "confidence": 0.9}')),
            httpx.Response(
                200,
                json=_chat_response(
                    '{"line_items": [{"product_name": "رز", "quantity": 1}], "ambiguous_fields": [], "confidence": 0.9}'
                ),
            ),
        ]
    )
    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    result = await process_message(
        db_session, conversation, _inbound_message(conversation, "عايز اطلب رز", "عايز اطلب رز")
    )

    assert result.order is not None
    assert result.answer_text is None
```

Add to `backend/tests/domains/test_messages_router.py` (add `from app.models import StoreKnowledge` alongside the existing `from app.models import Product`):

```python
async def test_ingest_question_returns_answer_text(db_session, conversation, mock_ai):
    db_session.add(
        StoreKnowledge(
            merchant_id=conversation.merchant_id, knowledge_type="shipping", title="سياسة الشحن",
            content="بنشحن لكل محافظات مصر خلال يومين لأربعة أيام.", keywords=["شحن"],
        )
    )
    await db_session.flush()

    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "question", "confidence": 0.9}'))
    )
    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/messages",
                json={
                    "conversation_id": conversation.id,
                    "raw_text": "بتشحنوا فين؟",
                    "normalized_text": "بتشحنوا فين؟",
                },
            )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    assert response.json()["answer_text"] == "بنشحن لكل محافظات مصر خلال يومين لأربعة أيام."
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py::test_question_intent_returns_seeded_knowledge_answer tests/domains/test_messages_router.py::test_ingest_question_returns_answer_text -v`
Expected: FAIL — `AttributeError: 'PipelineResult' object has no attribute 'answer_text'` / `KeyError: 'answer_text'`.

- [ ] **Step 3: Implement**

`backend/app/engine/pipeline.py` — add the import, extend the dataclass, and add the lookup right before the final flush/return:

```python
from app.domains.store_knowledge import service as knowledge_service
```

(add alongside the existing `app.engine.*` imports)

```python
@dataclass
class PipelineResult:
    message: Message
    order: Order | None
    answer_text: str | None = None
```

Replace the function's final two lines (`await session.flush()` / `return PipelineResult(message=message, order=order)`, currently right after the purchase-intent/extraction `if` block) with:

```python
    answer_text = None
    if order is None:
        knowledge_matches = await knowledge_service.search(session, conversation.merchant_id, normalized_text)
        if knowledge_matches:
            answer_text = knowledge_matches[0]["content"]

    await session.flush()
    return PipelineResult(message=message, order=order, answer_text=answer_text)
```

`backend/app/domains/messages/schemas.py` — add the field to `MessageIngestResponse`:

```python
class MessageIngestResponse(BaseModel):
    message_id: str
    intent: str | None
    intent_confidence: float | None
    model_tier: str | None
    escalation_reason: str | None
    order_id: str | None
    order_status: str | None
    order: OrderDetail | None = None
    answer_text: str | None = None
```

`backend/app/domains/messages/service.py` — pass it through:

```python
    return MessageIngestResponse(
        message_id=result.message.id,
        intent=result.message.intent,
        intent_confidence=result.message.intent_confidence,
        model_tier=result.message.model_tier.value if result.message.model_tier else None,
        escalation_reason=result.message.escalation_reason,
        order_id=result.order.id if result.order else None,
        order_status=result.order.status.value if result.order else None,
        order=order_detail,
        answer_text=result.answer_text,
    )
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py tests/domains/test_messages_router.py -v`
Expected: PASS, full files (new tests plus every pre-existing one — the new field is additive and defaults to `None`/absent from prior assertions that only check specific keys).

Run the full suite: `cd backend && uv run pytest -q` and `cd backend && make lint`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/pipeline.py backend/app/domains/messages/schemas.py backend/app/domains/messages/service.py backend/tests/engine/test_pipeline.py backend/tests/domains/test_messages_router.py
git commit -m "feat: answer FAQ/policy questions from seeded store knowledge when no order is produced"
```

---

## Task 4: Expose `Product.price` over the API

**Files:**
- Modify: `backend/app/domains/products/schemas.py`
- Modify: `backend/app/domains/products/service.py`
- Modify: `backend/tests/domains/test_products_router.py`
- Modify: `backend/tests/domains/products/test_service.py`

**Interfaces:**
- Changes: `ProductRead` gains `price: float | None = None`. `list_products`/`search_products`/`get_product` all populate it from `Product.price` (a `Decimal | None` column — cast to `float` for JSON transport).

- [ ] **Step 1: Write the failing test**

Extend `backend/tests/domains/test_products_router.py`'s existing `test_list_products_returns_only_merchant_scoped_products`:

```python
async def test_list_products_returns_only_merchant_scoped_products(db_session, merchant):
    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()

    other = Product(merchant_id=other_merchant.id, name="Other Merchant Product")
    mine = Product(
        merchant_id=merchant.id,
        name="My Product",
        aliases=["alias1"],
        variants={"sizes": ["M"]},
        price=Decimal("249.00"),
    )
    db_session.add_all([other, mine])
    await db_session.flush()

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/products/", params={"merchant_id": merchant.id})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["name"] == "My Product"
    assert body[0]["aliases"] == ["alias1"]
    assert body[0]["variants"] == {"sizes": ["M"]}
    assert body[0]["price"] == 249.0
```

Add `from decimal import Decimal` to the top of the file.

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/test_products_router.py -v`
Expected: FAIL — `KeyError: 'price'`.

- [ ] **Step 3: Implement**

`backend/app/domains/products/schemas.py`:

```python
from pydantic import BaseModel


class ProductRead(BaseModel):
    id: str
    merchant_id: str
    name: str
    aliases: list[str]
    variants: dict
    price: float | None = None
```

`backend/app/domains/products/service.py` — all three constructors:

```python
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.products.schemas import ProductRead
from app.models import Product


def _to_product_read(p: Product) -> ProductRead:
    return ProductRead(
        id=p.id,
        merchant_id=p.merchant_id,
        name=p.name,
        aliases=p.aliases,
        variants=p.variants,
        price=float(p.price) if p.price is not None else None,
    )


async def list_products(db: AsyncSession, merchant_id: str) -> list[ProductRead]:
    stmt = select(Product).where(Product.merchant_id == merchant_id).order_by(Product.name)
    result = await db.execute(stmt)
    return [_to_product_read(p) for p in result.scalars().all()]


async def search_products(db: AsyncSession, merchant_id: str, query: str, filters: dict) -> list[ProductRead]:
    stmt = select(Product).where(
        Product.merchant_id == merchant_id,
        or_(Product.name.ilike(f"%{query}%"), Product.aliases.any(query)),
    )
    result = await db.execute(stmt)
    return [_to_product_read(p) for p in result.scalars().all()]


async def get_product(db: AsyncSession, merchant_id: str, product_id: str) -> ProductRead | None:
    product = await db.get(Product, product_id)
    if product is None or product.merchant_id != merchant_id:
        return None
    return _to_product_read(product)
```

(Consolidating the three near-identical constructors into `_to_product_read` is a small, in-scope simplification since all three now need the same `Decimal → float` cast — not adding an abstraction beyond what this one change requires.)

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/test_products_router.py tests/domains/products/test_service.py -v`
Expected: PASS — including the pre-existing service tests (`test_search_products_matches_name_substring`, etc.), which never set `price` and so get `price=None`, unaffected by their existing assertions.

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/products/schemas.py backend/app/domains/products/service.py backend/tests/domains/test_products_router.py backend/tests/domains/products/test_service.py
git commit -m "feat: expose Product.price through GET /products/"
```

---

## Task 5: Rewrite `backend/scripts/seed.py` — idempotent, richer demo merchant

**Files:**
- Modify: `backend/scripts/seed.py`

**Interfaces:**
- No importable interface change — this is a standalone script (`make seed`). Produces: one `Merchant` ("Classy Boutique"), 3 `Product` rows (priced, aliased, embedded), 5 `StoreKnowledge` rows, 1 `Conversation` + 1 seed `Message`, all safe to re-create on every run.

This task has no unit test (it's an operator-run script, consistent with the existing `seed.py` and every other seed/verification script in this repo) — its correctness is proven by the Verification section at the end of this plan, which runs it for real against a live DB and embedding endpoint.

- [ ] **Step 1: Replace `backend/scripts/seed.py`**

```python
import asyncio
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import delete, select

from app.core.database import async_session_maker
from app.engine.embeddings import embed_text
from app.models import (
    Conversation,
    ConvState,
    Direction,
    Merchant,
    Message,
    Product,
    StoreKnowledge,
)
from app.models._ids import new_id

MERCHANT_NAME = "Classy Boutique"
DEMO_CUSTOMER_REF = "demo-visitor"

PRODUCTS = [
    {
        "name": "Classic Denim Jacket",
        "aliases": ["جاكيت جينز", "جاكيت ازرق", "denim jacket", "jacket"],
        "variants": {"sizes": ["S", "M", "L", "XL"], "colors": ["Blue", "Black"]},
        "price": Decimal("899.00"),
    },
    {
        "name": "Summer Linen Dress",
        "aliases": ["فستان صيفي", "فستان كتان", "linen dress"],
        "variants": {"sizes": ["S", "M", "L"], "colors": ["White", "Beige"]},
        "price": Decimal("1299.00"),
    },
    {
        "name": "Essential Black T-Shirt",
        "aliases": ["تيشيرت اسود", "تيشيرت أساسي", "black tshirt", "tshirt"],
        "variants": {"sizes": ["S", "M", "L", "XL"]},
        "price": Decimal("249.00"),
    },
]

STORE_KNOWLEDGE = [
    {
        "knowledge_type": "shipping",
        "title": "سياسة الشحن والتوصيل",
        "content": (
            "بنشحن لكل محافظات مصر، والتوصيل بياخد من يومين لأربعة أيام عمل حسب "
            "المنطقة. مصاريف الشحن بتتحدد حسب المحافظة وبتتقال للعميل قبل تأكيد الأوردر."
        ),
        "keywords": ["شحن", "توصيل", "التوصيل", "الشحن", "بيوصل", "هيوصل", "shipping", "delivery"],
    },
    {
        "knowledge_type": "returns",
        "title": "سياسة الاستبدال والإرجاع",
        "content": (
            "تقدر تستبدل أو ترجع أي قطعة خلال 14 يوم من الاستلام، بشرط إنها لسه "
            "بالتيكيت وملهاش استخدام. الاستبدال مجاني، والإرجاع بيتم خصم مصاريف الشحن."
        ),
        "keywords": ["استبدال", "ارجاع", "إرجاع", "استرجاع", "تغيير المقاس", "return", "exchange"],
    },
    {
        "knowledge_type": "payment",
        "title": "طرق الدفع المتاحة",
        "content": (
            "بنقبل الدفع كاش عند الاستلام، أو InstaPay، أو فودافون كاش. تقدر تختار "
            "الطريقة اللي تريحك وقت تأكيد الأوردر."
        ),
        "keywords": ["دفع", "ادفع", "الدفع", "فلوس", "كاش", "انستا", "instapay", "vodafone cash", "payment"],
    },
    {
        "knowledge_type": "general",
        "title": "مواعيد العمل",
        "content": "متجرنا شغال من الساعة 10 الصبح لحد 10 بالليل كل يوم، وبنرد على رسايلكم أول بأول.",
        "keywords": ["مواعيد", "فاتحين", "شغالين", "بتفتحوا", "hours", "متاحين"],
    },
    {
        "knowledge_type": "faq",
        "title": "دليل المقاسات",
        "content": (
            "المقاسات عندنا من S لحد XL. لو مش متأكد من مقاسك، ابعتلنا طولك ووزنك "
            "وهنرشحلك المقاس المناسب."
        ),
        "keywords": ["مقاس", "مقاسات", "سايز", "size", "sizing"],
    },
]


async def seed_data():
    async with async_session_maker() as session:
        # 1. Find-or-create the merchant by its stable name, so re-running this
        # script doesn't create duplicate "Classy Boutique" merchants (Merchant
        # has no unique constraint on name; the operator-facing DEMO_STOPGAP_MERCHANT_ID
        # env var must keep pointing at the same id across re-seeds).
        merchant = (
            await session.execute(select(Merchant).where(Merchant.name == MERCHANT_NAME))
        ).scalar_one_or_none()
        if merchant is None:
            merchant = Merchant(id=new_id(), name=MERCHANT_NAME, ai_tool_ordering_enabled=False)
            session.add(merchant)
            await session.flush()

        # 2. Replace this merchant's products every run. Safe only because
        # ai_tool_ordering_enabled stays False for this merchant — no Cart/Order
        # row can ever reference these product ids (see plan's Global Constraints).
        await session.execute(delete(Product).where(Product.merchant_id == merchant.id))
        for spec in PRODUCTS:
            product = Product(
                id=new_id(),
                merchant_id=merchant.id,
                name=spec["name"],
                aliases=spec["aliases"],
                variants=spec["variants"],
                price=spec["price"],
            )
            product.embedding = await embed_text(f"{product.name} " + " ".join(product.aliases))
            session.add(product)

        # 3. Replace this merchant's FAQ/policy content every run.
        await session.execute(delete(StoreKnowledge).where(StoreKnowledge.merchant_id == merchant.id))
        for spec in STORE_KNOWLEDGE:
            session.add(
                StoreKnowledge(
                    id=new_id(),
                    merchant_id=merchant.id,
                    knowledge_type=spec["knowledge_type"],
                    title=spec["title"],
                    content=spec["content"],
                    keywords=spec["keywords"],
                )
            )

        # 4. Find-or-create ONE stable seed conversation — the demo page picks
        # conversations[0] (most recently active), so keeping this stable
        # across re-seeds keeps the demo's picked conversation id stable too.
        # Message history is not touched on re-seed (harmless clutter; nothing
        # in the demo reads conversation history for display).
        conversation = (
            await session.execute(
                select(Conversation).where(
                    Conversation.merchant_id == merchant.id, Conversation.customer_ref == DEMO_CUSTOMER_REF
                )
            )
        ).scalar_one_or_none()
        if conversation is None:
            conversation = Conversation(
                id=new_id(),
                merchant_id=merchant.id,
                customer_ref=DEMO_CUSTOMER_REF,
                state=ConvState.GATHERING,
                slots={},
                last_message_at=datetime.now(UTC),
            )
            session.add(conversation)
            await session.flush()

            m1 = Message(
                id=new_id(),
                conversation_id=conversation.id,
                direction=Direction.INBOUND,
                raw_text="السلام عليكم، بكام الفستان الصيفي؟",
                normalized_text="السلام عليكم، بكام الفستان الصيفي؟",
                intent="question",
                intent_confidence=0.95,
                created_at=datetime.now(UTC),
            )
            m1.embedding = await embed_text(m1.normalized_text)
            session.add(m1)

        await session.commit()
        print(f"Merchant ID: {merchant.id}")
        print(f"Conversation ID: {conversation.id}")
        print(f"Seeded {len(PRODUCTS)} products and {len(STORE_KNOWLEDGE)} store knowledge entries.")


if __name__ == "__main__":
    asyncio.run(seed_data())
```

- [ ] **Step 2: Run it and verify idempotency manually**

Run: `cd backend && make seed`
Expected: prints a `Merchant ID:`/`Conversation ID:`/counts line with no errors. Requires a reachable `EMBEDDING_BASE_URL` (per Global Constraints) — if this fails with a connection error, start the local embedding server first; do not work around it by stripping the `embed_text()` calls, since that would silently break Task 3's extraction→catalog-highlight matching.

Run `cd backend && make seed` **a second time** and confirm: (a) the printed `Merchant ID:` is identical to the first run, (b) no error, (c) inspect the DB (`psql` or any client) to confirm exactly 3 `products` rows and 5 `store_knowledge` rows for that merchant — not 6/10 (proves delete-and-recreate, not duplication).

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/seed.py
git commit -m "feat: seed a richer, idempotent demo merchant with priced products and FAQ/policy content"
```

---

## Task 6: Frontend — real prices, FAQ answers, and a policy-question example

**Files:**
- Modify: `frontend/lib/products.ts`
- Modify: `frontend/lib/messages.ts`
- Modify: `frontend/app/demo/product-catalog.tsx`
- Modify: `frontend/app/demo/ai-insights.tsx`
- Modify: `frontend/messages/ar.json`
- Modify: `frontend/messages/en.json`

**Interfaces:**
- Changes: `Product.price: number | null` (`lib/products.ts`), `MessageIngestResponse.answer_text: string | null` (`lib/messages.ts`) — both mirror the backend schema changes from Tasks 3–4.

No backend tests apply here; this is pure frontend rendering of fields the backend now returns. Verified manually in the Verification section (this repo has no frontend test suite — confirmed no `*.test.tsx`/`vitest`/`jest` config in `frontend/package.json`).

- [ ] **Step 1: `frontend/lib/products.ts`** — add `price`:

```ts
export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  aliases: string[];
  variants: Record<string, unknown>;
  price: number | null;
}

export async function getProducts(merchantId: string): Promise<Product[]> {
  const baseUrl = process.env.BASE_API_URL;
  if (!baseUrl) {
    throw new Error("BASE_API_URL not configured");
  }
  const response = await fetch(
    `${baseUrl}/products/?merchant_id=${encodeURIComponent(merchantId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return (await response.json()) as Product[];
}
```

- [ ] **Step 2: `frontend/lib/messages.ts`** — add `answer_text`:

```ts
export interface MessageIngestResponse {
  message_id: string;
  intent: string | null;
  intent_confidence: number | null;
  model_tier: string | null;
  escalation_reason: string | null;
  order_id: string | null;
  order_status: string | null;
  order: OrderDetail | null;
  answer_text: string | null;
}
```

(Leave `MessageIngestRequest`, `OrderLineItem`, `OrderDetail` unchanged.)

- [ ] **Step 3: `frontend/app/demo/product-catalog.tsx`** — real prices, extend the image matcher for t-shirts:

```tsx
import Image from "next/image";
import type { Product } from "@/lib/products";
import * as m from "@/paraglide/messages";

function formatVariants(variants: Record<string, unknown>) {
  return Object.entries(variants).map(([key, value]) => {
    const values = Array.isArray(value) ? value.join(", ") : String(value);
    return { key, values };
  });
}

function getImageForProduct(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("denim")) return "/images/denim_jacket.jpg";
  if (lower.includes("linen")) return "/images/linen_dress.jpg";
  if (lower.includes("shirt")) return "/images/black_tshirt.jpg";
  return "/images/denim_jacket.jpg"; // fallback
}

export function ProductCatalog({
  products,
  highlightedProductIds = [],
}: {
  products: Product[];
  highlightedProductIds?: string[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold tracking-tight">{m.demo_catalog_title()}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {products.map((product) => {
          const isHighlighted = highlightedProductIds.includes(product.id);
          const variants = formatVariants(product.variants);

          return (
            <div
              key={product.id}
              className={`relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 ${
                isHighlighted
                  ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-1 ring-emerald-500"
                  : "border-gray-200 bg-white shadow-sm hover:shadow-md"
              }`}
            >
              {isHighlighted && (
                <div className="absolute end-2 top-2 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                  {m.demo_catalog_matched()}
                </div>
              )}
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <Image
                  src={getImageForProduct(product.name)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  {product.price !== null && (
                    <span className="font-semibold text-gray-900">
                      {product.price} {m.demo_catalog_egp()}
                    </span>
                  )}
                </div>
                {product.aliases.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {m.demo_catalog_aka()} {product.aliases.join(", ")}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <span
                      key={v.key}
                      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                    >
                      {v.key}: {v.values}
                    </span>
                  ))}
                  {variants.length === 0 && (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {m.demo_catalog_no_options()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            {m.demo_catalog_empty()}
          </div>
        )}
      </div>
    </section>
  );
}
```

(`getDummyPrice` is deleted entirely — real seeded prices replace it.)

- [ ] **Step 4: `frontend/app/demo/ai-insights.tsx`** — render `answer_text` as a third, mutually-exclusive state alongside the existing order/no-order branches:

Replace the `{state.data.order ? ( ... ) : ( ... )}` block (currently the last thing inside the success-state `content` JSX) with:

```tsx
        {state.data.order ? (
          <div className="flex flex-col gap-4 border-t border-emerald-100 pt-4">
            <h3 className="font-semibold text-gray-900">{m.demo_ai_order_details()}</h3>

            <ul className="flex flex-col gap-2 text-sm text-gray-700">
              {state.data.order.address && (
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">{m.demo_ai_address()}</span>
                  <span>{state.data.order.address}</span>
                </li>
              )}
              {state.data.order.phone && (
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">{m.demo_ai_phone()}</span>
                  <span>{state.data.order.phone}</span>
                </li>
              )}
              {state.data.order.payment_method && (
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">{m.demo_ai_payment()}</span>
                  <span>{state.data.order.payment_method}</span>
                </li>
              )}
            </ul>

            <div className="mt-2">
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                {m.demo_ai_products()}
              </h4>
              <ul className="flex flex-col gap-2">
                {state.data.order.line_items.map((item, i) => {
                  const matched = findProduct(products, item.product_id);
                  return (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-3 text-sm shadow-sm"
                    >
                      <div>
                        <span className="font-semibold text-gray-900">
                          {item.quantity}×
                        </span>{" "}
                        {item.product_name}
                        {item.notes && (
                          <span className="mt-1 block text-xs text-gray-500">
                            {m.demo_ai_specs()} {item.notes}
                          </span>
                        )}
                      </div>
                      {matched ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          {m.demo_ai_in_catalog()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          {m.demo_ai_not_found()}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : state.data.answer_text ? (
          <div className="flex flex-col gap-2 border-t border-emerald-100 pt-4">
            <h3 className="font-semibold text-gray-900">{m.demo_ai_answer_title()}</h3>
            <p className="text-sm text-gray-700">{state.data.answer_text}</p>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            {m.demo_ai_no_order()}
          </div>
        )}
```

- [ ] **Step 5: Add i18n copy — `frontend/messages/ar.json`**

Add one new key (anywhere alongside the other `demo_ai_*` keys, e.g. right after `"demo_ai_title": "طلب العميل من خلال الرسالة:",`):

```json
  "demo_ai_answer_title": "رد المساعد الذكي:",
```

Change `demo_msg_ph_3`'s existing value from a second product question (redundant with `demo_msg_ph_1`) to a policy question, so the placeholder rotation actually showcases the new FAQ feature:

```json
  "demo_msg_ph_3": "إيه سياسة الاستبدال عندكم؟",
```

- [ ] **Step 6: Mirror both changes in `frontend/messages/en.json`**

Add the equivalent English key (same position, alongside the other `demo_ai_*` keys):

```json
  "demo_ai_answer_title": "AI assistant's answer:",
```

Update `demo_msg_ph_3` to the English equivalent of the new Arabic placeholder:

```json
  "demo_msg_ph_3": "What's your exchange policy?",
```

- [ ] **Step 7: Regenerate Paraglide output and typecheck**

Run: `cd frontend && pnpm build` (the Paraglide Next.js plugin regenerates `frontend/paraglide/` from `frontend/messages/*.json` as part of the build — per `next.config.ts`'s `paraglide({ project: "./project.inlang", outdir: "./paraglide" })`).
Expected: build succeeds with no missing-message-key errors, confirming `m.demo_ai_answer_title()` resolves in both locales and `frontend/paraglide/messages.js`/`runtime.js` picked up the new/changed keys.

- [ ] **Step 8: Commit**

```bash
git add frontend/lib/products.ts frontend/lib/messages.ts frontend/app/demo/product-catalog.tsx frontend/app/demo/ai-insights.tsx frontend/messages/ar.json frontend/messages/en.json frontend/paraglide
git commit -m "feat: show real product prices and AI FAQ answers on the demo page"
```

---

## Task 7: Documentation reconciliation

**Files:**
- Modify: `ROADMAP.md`
- Modify: `README.md`

**Interfaces:** None (prose only).

- [ ] **Step 1: `ROADMAP.md`** — reword the "Store knowledge retrieval" line (currently listed as a Near-term/not-built gap) to reflect the keyword-match MVP landed by Task 2:

```diff
-- **Store knowledge retrieval** — FAQ/shipping/returns content, keyword/full-text retrieval (SRD §23)
+- ~~**Store knowledge retrieval**~~ **Built (keyword-match MVP)** — `StoreKnowledge` table (FAQ/shipping/returns/exchange/payment/general), keyword-substring search scoped per merchant (SRD §23). Reachable both from `search_store_knowledge` (AI tool-ordering path) and from `POST /messages`'s classify/extract path when no order is produced. Not built: full-text/semantic retrieval, an authoring UI (seed-script-only today).
```

- [ ] **Step 2: `README.md`** — update the corresponding "Not yet built" bullet:

```diff
 **Not yet built** (see `ROADMAP.md` for the full breakdown against PRD MVP scope):
 - Multi-tenancy enforcement (the SRD's `Tenant` entity/isolation model)
-- Delivery-area/fee service, store-knowledge retrieval, human handoff
+- Delivery-area/fee service, human handoff
 - Merchant dashboard (conversations inbox, order management, AI settings) beyond the `/demo` page
 - Billing (base plans, AI add-on, fair-use tracking)
```

Add a "Built" bullet near the existing AI action validator / tool layer bullet:

```diff
+- **Store knowledge retrieval (keyword-match MVP)** — `StoreKnowledge` model + keyword-substring search per merchant (SRD §23); answers FAQ/shipping/returns/payment questions from `POST /messages` when no order is produced, and via the `search_store_knowledge` AI tool. Not built: full-text/semantic retrieval, an authoring UI.
```

- [ ] **Step 3: Commit**

```bash
git add ROADMAP.md README.md
git commit -m "docs: mark store knowledge retrieval as built (keyword-match MVP)"
```

---

## Out of scope, flagged for follow-up

- **The AI tool-ordering path's `_render_response` still returns `"Done."` for `search_store_knowledge`** once it stops raising (Task 2) — the demo merchant never reaches this (`ai_tool_ordering_enabled=False`), so it's not exercised here. Worth a small follow-up (`if action.action == "search_store_knowledge": return outcome.result["results"][0]["content"] if ... else "..."`) whenever that path is actually enabled for a real merchant.
- **The shared seed conversation's history can silently suppress FAQ answers over time.** Every demo visitor writes into the same seeded `Conversation` (`page.tsx` always picks `conversations[0]`), and `process_message` feeds that conversation's last `CONTEXT_HISTORY_TURNS` (10) messages into the classification prompt for every new message (`pipeline.py:129-135`). After enough unrelated visitor traffic, a policy question can classify as `purchase_intent` under the weight of prior strangers' order-shaped history, extraction runs, an `Order` is produced, and Task 3's `if order is None` gate — correctly, per this plan's own reasoning — skips the knowledge lookup, so the FAQ answer just doesn't appear with no visible explanation. This is a property of today's shared-conversation stopgap wiring, not a bug in Task 2/3; `docs/superpowers/plans/2026-08-25-demo-page-security-hardening.md`'s `POST /demo/classify` (Phase 3, unexecuted) is single-turn by construction and fixes this for free whenever it lands. Until then, a periodic `make seed` re-run resets the conversation's practical staleness (though not its row, per Task 5's design) as a mitigation, not a fix.
- **`docs/superpowers/plans/2026-08-25-demo-page-security-hardening.md` Phase 2/3** (rate limiting, `INTERNAL_API_SECRET`, ephemeral `/demo/*` endpoints) is unexecuted and unaffected by this plan — today's demo still writes real `Conversation`/`Message` rows through `POST /messages` with no rate limit, a pre-existing exposure this plan does not touch or worsen (the new knowledge lookup adds zero AI/network calls). Executing that plan remains a separate, already-fully-specified piece of work.
- **Full-text or embedding-based knowledge retrieval** — the keyword-substring match (Task 2) is the documented SRD §23 MVP shape, not a placeholder; upgrading it to `bge-m3`-embedding-based retrieval (already wired for product/message embeddings) is a real follow-up if keyword coverage proves too brittle in practice, not assumed here.
- **A `role: "ai"` chat bubble for `answer_text` inside `message-composer.tsx`** — `ai-insights.tsx` (Task 6) is the one surface every other AI output already renders on; adding a second render path for the same string in the chat log itself is UX polish, not required for the feature to work, and was deliberately cut from this plan's scope.
- **Currency plumbing** — `product-catalog.tsx` keeps its hardcoded "EGP" label (see Global Constraints) rather than reading `Merchant.currency`.

## Self-Review

**Spec coverage:** SRD §23 (Store Knowledge Retrieval) — Task 1 (schema) + Task 2 (keyword-match MVP search) implement its documented MVP shape exactly (`id/tenant_id→merchant_id/type/title/content`, keyword retrieval, tenant-filtered); Task 3 makes the answer actually reachable by a caller, which the spec's own tool description implies but nothing in the existing codebase did. User's explicit scope decisions — FAQ via "narrow demo-only answer path" (delivered as a real, minimal, non-demo-gated implementation per the design correction the advisor caught: implementing the real stub is narrower and better than a demo-only special case) and "read-only demo, `ai_tool_ordering_enabled` stays False" (Global Constraints, Task 5) — are both honored and stated explicitly, not silently assumed.

**Placeholder scan:** No task contains "TBD"/"add appropriate handling"/"similar to Task N" — every step is real, current-source-verified code (every backend file quoted above was read directly from the working tree during this planning session, not paraphrased) or an exact diff against quoted current text.

**Type/signature consistency:** `search(session, merchant_id, query, knowledge_type=None)` (Task 2) is called identically in Task 3's `pipeline.py` (`knowledge_service.search(session, conversation.merchant_id, normalized_text)`, relying on the default for `knowledge_type`) and in the unchanged `handle_search_store_knowledge` tool call (`knowledge_service.search(session, merchant_id, action.query, action.knowledge_type)`). `PipelineResult.answer_text` (Task 3) flows through `messages/service.py::ingest_message` → `MessageIngestResponse.answer_text` → `frontend/lib/messages.ts`'s `MessageIngestResponse.answer_text` → `ai-insights.tsx`'s `state.data.answer_text` — same name, same optionality, at every hop. `ProductRead.price: float | None` (Task 4) matches `frontend/lib/products.ts`'s `Product.price: number | null` (Task 6).

---

## Verification (end-to-end, after all tasks land)

1. **Backend up:** `cd backend && make upgrade && make dev` (separate terminal). Confirm a reachable `EMBEDDING_BASE_URL` (required by both seeding and query-time product matching).
2. **Seed:** `cd backend && make seed`. Note the printed `Merchant ID`. Run it again — confirm the same `Merchant ID` prints and the DB still has exactly 3 products / 5 knowledge rows (idempotency).
3. **Frontend up:** set `DEMO_STOPGAP_MERCHANT_ID` in `frontend/.env.local` to the printed merchant id, then `cd frontend && pnpm dev`. Load `/demo`.
4. **Non-AI feature — catalog:** confirm all 3 products render with their real seeded prices (899/1299/249 EGP) and the correct image each (denim jacket, linen dress, black t-shirt — not all three falling back to the same image).
5. **AI feature — purchase extraction + embedding match:** type the `demo_msg_ph_4` example ("...جاكت جينز مقاس لارج...InstaPay..."). Confirm the AI Insights panel shows `purchase_intent`, an order with address/phone/payment method, and the denim jacket line item shows "موجود في الكتالوج" (matched) — this is the step that actually proves the seeded embeddings are close enough under the `max_distance=0.45` cutoff; a fabricated/unverified embedding would silently show "مش موجود" instead.
6. **AI feature — FAQ/policy answer (this plan's headline addition):** type the new `demo_msg_ph_3` ("إيه سياسة الاستبدال عندكم؟"). Confirm the AI Insights panel shows the new "رد المساعد الذكي:" block with the seeded returns-policy text — not the "مفيش تفاصيل طلب واضحة" fallback.
7. **Negative check:** type something matching no seeded keyword and no purchase intent (e.g. "ازيك"). Confirm no crash and the panel falls back to the no-order message, confirming `answer_text: None` is handled gracefully end to end.
8. **History-poisoning check (see "Out of scope" note above):** in the same browser session, send 5-6 more purchase-shaped messages first (reusing `demo_msg_ph_1`/`ph_2`/`ph_4`), then re-send the `demo_msg_ph_3` policy question from step 6. If the FAQ answer no longer appears, that's the documented shared-conversation-history effect, not a regression in Task 2/3 — confirm by re-seeding (`make seed`) to reset the conversation and re-running step 6 alone.
