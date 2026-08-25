# Cart & Checkout Services + Order Service Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the two ROADMAP.md items "Cart & checkout services" and "Order service hardening" a real, deterministic backend implementation — `Cart`/`CartItem` storage, live subtotal calculation, and a hardened order-creation path that validates customer info and (as far as is buildable today) delivery area, snapshots product/price data, and assigns a human-readable order number — so the already-built AI tool layer's `add_to_cart` / `update_cart` / `remove_from_cart` / `get_checkout_state` / `create_order` tools stop being permanent `NotImplementedError` stubs and start doing real, persisted work.

**Architecture:** `app/domains/cart/service.py` and `app/domains/checkout/service.py` already exist as contract-only stubs (built by `docs/superpowers/plans/2026-08-25-ai-action-validator-tool-layer.md`, hereafter "the tool-layer plan") — this plan replaces their bodies with real implementations behind the *same* function signatures (plus a `session` parameter the stubs are missing) so the tool-layer's handlers, validator, and audit trail need no changes. Four new/changed models carry the actual state: `Cart` and `CartItem` (new, `app/models/`) hold in-progress carts scoped to a `Conversation`; `OrderItem` (new) gives `Order` real relational, price-frozen line items; `Order` itself gains the fields SRD §26–27 require. `Merchant` gains `currency` and an atomic order-number counter; `Product` gains `price`. A pre-existing, unrelated, still-live order-creation path in `pipeline.py` is explicitly *not* touched by this plan — see Global Constraints for why — so `orders` will hold two distinguishable populations from this point on, disambiguated by a new `source` column.

**Tech Stack:** Same as the rest of the engine — FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, pytest + pytest-asyncio, PostgreSQL (`pg_insert(...).on_conflict_do_update(...)` for atomic upserts).

**Spec:** `TijaratkBot_SRD.md` §5 Core Domain Entities (143-169), §6 Tenant/currency (173-193), §24 Commerce Engine (664-681), §25 Cart Service (683-699), §26 Order Service (701-717), §27 Order Snapshotting (719-734), §36 Conversation Concurrency (923-935), §37 Idempotency (937-947); `TijaratkBot_PRD.md` §4 MVP Scope (71-109), §14 AI Action Architecture / `add_to_cart` validation contract (401-443), §21 Commerce Truth Rules (600-616), §22 Conversational Ordering (618-636), §23 Conversational Checkout (638-659), §25 Address Handling (676-690), §26 AI Response Generation (692-712), §32 Merchant Dashboard Orders (831-840); `ROADMAP.md:19-20` (this repo's authoritative scope for these two items). Extends the tool-layer plan, which explicitly deferred all of this (its Non-Goals line: *"`Cart`/`CartItem` models, product pricing/currency, and the real Cart/Checkout/StoreKnowledge business logic behind the 6 stubbed tools ... — separate ROADMAP.md items"*).

## Global Constraints

- **Not greenfield — extend two existing stub files in place.** `app/domains/cart/service.py` (`add_item`, `update_item`, `remove_item`) and `app/domains/checkout/service.py` (`validate_delivery_area`, `get_checkout_state`, `create_order`) already exist, already raise spec-citing `NotImplementedError` (or, for `validate_delivery_area`, already return a structured "unavailable" dict), and are already called by `app/engine/tools/cart.py` / `app/engine/tools/checkout.py`. None of the six stub functions take a `session: AsyncSession` parameter today even though `AsyncSession` is imported — the tool-layer's `dispatch_action` already threads a session down to every handler, so this plan adds `session` as each function's first parameter and updates the ~5 one-line call sites accordingly. `validate_delivery_area` stays exactly as it is (see Non-Goals) — it is the one stub this plan does not touch.
- **The external contract is frozen.** The nine action Pydantic schemas in `app/engine/schemas.py` (`AddToCartAction(product_id, quantity: float=Field(gt=0), notes)`, `UpdateCartAction(line_item_id, quantity)`, `RemoveFromCartAction(line_item_id)`, `GetCheckoutStateAction()`, `CreateOrderAction(confirm: bool=True)`, etc.) are owned by the tool-layer plan and are not modified here. Note in particular: the AI never supplies `merchant_id`/`conversation_id`/`price` — those come from dispatch context or from the database, never from the model's proposed action.
- **No domain folder owns a `models.py`.** Confirmed convention across all eight existing domains (`channels/`, `conversations/`, `messages/`, `products/`, plus the stub `cart/`, `checkout/`, `store_knowledge/`): every SQLAlchemy model lives centrally in `app/models/`, one file per model, registered in `app/models/__init__.py`, with a matching Alembic revision. `Cart`, `CartItem`, `OrderItem` go in `app/models/`, not under `app/domains/cart/`.
- **Service-layer convention** (confirmed via `channels/service.py`, `products/service.py`): free functions taking `session: AsyncSession` + explicit scalar args, never a request object. Services build/execute statements and `add`/`flush` — **they never call `session.commit()`**. Local exceptions are defined in the same file. This plan's new cart/checkout service code follows the same rule.
- **A second, pre-existing, *live* order-creation path exists and is deliberately left alone.** `app/engine/pipeline.py::process_message` (completely unmodified by any recent work, not part of `git status`) already creates real `Order` rows today, for every merchant, on purchase-intent messages — `Order(conversation_id=..., message_id=..., extracted_payload=extraction.model_dump(...), status=..., confidence_score=..., extracted_by_tier=..., escalation_reason=...)`. This is an **extraction artifact**: "the AI thinks this message contained an order, a human should check" — `confidence_score`/`extracted_by_tier`/`escalation_reason`/`PENDING_REVIEW` are all review-workflow fields, and its line items come from raw LLM extraction (`{product_name, quantity, notes, product_id}`) with **no price**. It structurally cannot satisfy §27 snapshotting, which requires `unit_price` on every line item — there is no cart and no price to freeze. The hardened path this plan builds is a **commerce transaction**: a validated `Cart`, frozen prices, a real order number, validated customer/delivery info. These are two different kinds of object that happen to share the `orders` table; unifying them into one service would force every §27 field to be nullable-for-one-path and lose the distinction the tool-layer plan's own escalation workflow depends on. **This plan does not refactor `pipeline.py`.** The legacy path stays live and un-hardened — it is currently disconnected from the new tool layer anyway (see next point) — until a future decision is made to retire or convert it. Note also: SRD §26 states "AI cannot directly insert orders," which the legacy path already violates today; this plan documents that pre-existing tension rather than introducing it.
- **The `orders` table now holds two populations — disambiguated by a new `source` column**, not by inference from which fields are null. `PRD §32`'s merchant dashboard (a separate, future, unbuilt item) wants "Order number, Customer, Products, Total, Address, Status" per order; legacy rows will have none of those, so any dashboard query needs `WHERE source = 'CART_CHECKOUT'` to show only real commerce orders. This plan adds the column and backfills existing rows to `AI_EXTRACTION`; it does not build the dashboard.
- **The whole AI tool layer is currently "dark" in production** — confirmed by direct read: `resolve_action` (`app/engine/action_resolution.py`) has zero callers anywhere, and `Merchant.ai_tool_ordering_enabled` has zero readers. `pipeline.py` never invokes it. This plan's new cart/checkout logic is therefore not yet reachable from any live traffic either — wiring the tool layer to a live entry point is the tool-layer plan's own unfinished Task 9, out of scope here.
- **The tool-dispatch commit boundary is a real, small, currently-broken gap this plan must fix.** Confirmed by direct read of `app/engine/tools/registry.py::dispatch_action` and its only caller `app/engine/action_resolution.py::resolve_action`: neither ever calls `session.commit()` — `_record_ai_action` only `flush()`es. This means that even today, nothing `dispatch_action` does would ever durably persist, not even the `AIAction` audit row. Without fixing this, none of this plan's cart/order writes would survive past the request once the tool layer is eventually wired up. Task 1 fixes it.
- **Concurrency:** `app/core/locks.py::conversation_lock(redis, conversation_id)` (SRD §36) is a Redis SETNX+TTL+Lua-fenced-release mutex keyed `conversation:{id}:lock`. It currently wraps only the arq-worker entry point (`worker.py:24`), not the tool-dispatch path — a known, pre-existing gap (the tool-layer plan's own Task 9 was supposed to close it and never ran). **This plan does not assume cart mutations are lock-protected.** Every write this plan adds uses atomic single-statement DB operations (`UPDATE ... WHERE ...`, upserts, unique constraints) as the actual safety mechanism, not external locking.
- **Idempotency (SRD §37) is a named requirement.** "Must not add the same cart item twice from duplicate webhook delivery" is handled purely upstream by the existing `WebhookEvent` dedup, which remains the first and only line of defense against duplicate *messages* (the upsert in `add_item` is deliberately additive, not idempotent, to support intentional quantity increments like "add 1 more"). "Must not create duplicate orders from retry" is handled by `Cart.status` transitioning `ACTIVE → CHECKED_OUT` via a single conditional `UPDATE ... WHERE status = 'ACTIVE' RETURNING id`; if that returns nothing, `create_order` is being retried against an already-converted cart and returns the existing order instead of creating a second one.
- **Currency belongs on `Merchant`, not `Product`.** SRD §6 gives `Tenant` a `currency` field (default `EGP`); `Tenant` doesn't exist yet, and per the tool-layer plan's own established constraint, everything scopes by `merchant_id` against `Merchant` today with no `tenant_id`. A single merchant trades in one currency — per-product currency would make cart subtotal arithmetic ambiguous for no benefit this app needs. `Merchant.currency` defaults to `EGP`.
- **Enum/migration gotcha (`CLAUDE.md`, `alembic/versions/2d17ac4bd857_...`) does not apply to any new enum in this plan.** `CartStatus` and `OrderSource` are each used by exactly one table (`carts` and `orders` respectively) — plain `sa.Enum(..., name="...")` is correct, the `postgresql.ENUM(create_type=False)` dance is only needed when an enum type is shared by 2+ tables (the existing worked example is `ModelTier`, used by both `messages` and `orders` — this plan does not touch `ModelTier`).
- **Stock and variant resolution stay deferred, using the pattern the codebase already established.** SRD §25 lists "Resolve variant" and "Validate stock" as Cart Service responsibilities, but `Product` has no `stock` column and no structured variant model (`variants` is an untyped JSON dict) — confirmed absent from every migration, and already explicitly acknowledged as a gap by the tool-layer plan (`get_product_variants`/`get_cart` were deliberately left out of the 9-tool scope for the same reason). This plan does not build a `ProductVariant` table or inventory system. `add_item` documents the deferral inline with a comment citing SRD §25 and the missing columns, the same way `validate_delivery_area` already documents its own deferral — not silently, and not with invented behavior.

## Non-Goals (explicit — do not build these here)

- Refactoring or modifying `pipeline.py`'s existing classify→extract→auto-order flow (see Global Constraints — structurally cannot share a service with the hardened path).
- Wiring the AI tool layer to any live entry point (`pipeline.py`, a new endpoint, etc.) — that's the tool-layer plan's unfinished Task 9.
- A `Tenant` entity / multi-tenancy (SRD §4, §6) — separate `ROADMAP.md` item.
- Real delivery-area/fee validation (SRD §29) — `validate_delivery_area` keeps returning `{"status": "unavailable", "reason": "delivery_service_not_built"}` exactly as it does today. This plan's "validate delivery area" (§26) is limited to what's buildable without a `DeliveryArea` table: confirming a non-empty address string was captured before `create_order` proceeds. Real governorate/area/fee matching is the separate "Delivery service" `ROADMAP.md` item.
- A dedicated `Customer` entity (SRD §5 lists it as a target entity, but it is not a near-term `ROADMAP.md` item and today's customer info is already conversation-scoped, ad hoc JSON). This plan validates and snapshots customer info onto `Order` as plain columns rather than introducing a new entity with its own lifecycle — see Task 4/7 for rationale. A first-class `Customer` table (repeat-customer matching, address book) is a reasonable future enhancement, not built here.
- Structured `ProductVariant` / stock / inventory tracking — see Global Constraints.
- Any HTTP router for cart/checkout (`app/domains/cart/router.py`, etc.) — SRD/PRD describe the customer-facing flow as conversational (AI tool calls), not a REST cart API, and no concrete need for one surfaced during research. If one is needed later, it's additive to this plan's service layer, not a redesign of it.
- Extending `conversation_lock` coverage to the tool-dispatch path — a real, pre-existing gap (noted in Global Constraints) that belongs to whoever wires up the tool layer (tool-layer plan Task 9), not this plan.
- Adding a DB-checkable validator rule for `line_item_id` in `app/engine/action_validator.py` (today only `product_id` on `add_to_cart`/`get_product` is validated; once `CartItem` exists, `update_cart`/`remove_from_cart`'s `line_item_id` could be validator-checked too). Left as a follow-up integration note — the service layer this plan builds still handles a bad `line_item_id` safely on its own (see Task 5), so nothing is unsafe without it, just less audit-friendly.
- Merchant dashboard UI (PRD §32) — this plan only makes the underlying data dashboard-ready (the `source` discriminator), it doesn't build any UI.

---

## Phase 1 — Schema Foundation & Infrastructure

### Task 1: Fix the `dispatch_action` commit gap

**Files:**
- Modify: `backend/app/engine/tools/registry.py`
- Modify: `backend/tests/engine/test_tool_registry.py`

**Interfaces:**
- No signature changes — `dispatch_action`'s contract is unchanged. Behavior changes: every branch now durably commits before returning, instead of only flushing.

This is foundational infrastructure, not a design decision — see Global Constraints. Every later task in this plan depends on writes made through `dispatch_action` actually persisting.

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/engine/test_tool_registry.py`:

```python
@pytest.mark.anyio
async def test_dispatch_action_commits_the_audit_row(db_session, merchant, conversation):
    action = GetProductAction(action="get_product", product_id="missing", confidence=0.9)

    # Spy on session.commit since the SAVEPOINT fixture auto-restarts a nested 
    # transaction immediately after an inner commit ends.
    original_commit = db_session.commit
    commit_calls = 0
    
    async def mock_commit():
        nonlocal commit_calls
        commit_calls += 1
        await original_commit()
        
    db_session.commit = mock_commit

    await dispatch_action(
        db_session, action, merchant_id=merchant.id,
        conversation_id=conversation.id, message_id="msg-commit-check",
    )
    
    assert commit_calls == 1
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/engine/test_tool_registry.py::test_dispatch_action_commits_the_audit_row -v`
Expected: FAIL — `assert True is False` (still in a transaction after `_record_ai_action`'s bare `flush()`).

- [ ] **Step 3: Implement**

In `backend/app/engine/tools/registry.py`, add `await session.commit()` immediately after every `_record_ai_action(...)` call in `dispatch_action` (all four branches: validator-rejected, no-handler, handler-raised, executed):

```python
    validation = await evaluate_action(session, action, merchant_id=merchant_id)
    if not validation.approved:
        await _record_ai_action(
            session, action, merchant_id, conversation_id, message_id,
            status="rejected", errors=validation.errors, result=None,
        )
        await session.commit()
        return ActionOutcome(status="rejected", result=None, errors=validation.errors)

    handler = _REGISTRY.get(action.action)
    if handler is None:
        errors = [ValidationError("tool_unavailable", f"no handler registered for action {action.action!r}")]
        await _record_ai_action(
            session, action, merchant_id, conversation_id, message_id,
            status="failed", errors=errors, result=None,
        )
        await session.commit()
        return ActionOutcome(status="failed", result=None, errors=errors)

    try:
        result = await handler(session, action, merchant_id, conversation_id)
    except ActionArgumentError as exc:
        errors = [ValidationError("argument_invalid", msg) for msg in exc.errors]
        await _record_ai_action(
            session, action, merchant_id, conversation_id, message_id,
            status="rejected", errors=errors, result=None,
        )
        await session.commit()
        return ActionOutcome(status="rejected", result=None, errors=errors)
    except ToolUnavailableError as exc:
        errors = [ValidationError("tool_unavailable", str(exc))]
        await _record_ai_action(
            session, action, merchant_id, conversation_id, message_id,
            status="failed", errors=errors, result=None,
        )
        await session.commit()
        return ActionOutcome(status="failed", result=None, errors=errors)

    await _record_ai_action(
        session, action, merchant_id, conversation_id, message_id,
        status="executed", errors=[], result=result,
    )
    await session.commit()
    return ActionOutcome(status="executed", result=result, errors=[])
```

This means a successful handler call (e.g. `add_item`) and its `AIAction` audit row commit together, atomically, in the same transaction — exactly the guarantee cart/order writes in later tasks depend on.

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/engine/test_tool_registry.py -v`
Expected: PASS, all existing tests in the file still pass (the SAVEPOINT-based `db_session` fixture already tolerates inner commits — this is the same pattern router-layer tests already exercise).

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/tools/registry.py backend/tests/engine/test_tool_registry.py
git commit -m "fix: commit dispatch_action's writes instead of only flushing"
```

---

### Task 2: `Merchant.currency` / `Merchant.next_order_number` / `Product.price`

**Files:**
- Modify: `backend/app/models/merchant.py`
- Modify: `backend/app/models/product.py`
- Create: `backend/alembic/versions/<hash>_add_merchant_currency_order_counter_and_product_price.py`
- Modify: `backend/tests/models/test_ai_action.py`'s sibling test dir if a `test_merchant.py`/`test_product.py` doesn't exist — check first, extend if present, else skip (not the focus of this plan; a round-trip is exercised indirectly by Task 5's/7's tests).

**Interfaces:**
- Produces: `Merchant.currency: str` (default `"EGP"`), `Merchant.next_order_number: int` (default `1`). Consumed by Task 7 (order-number generation).
- Produces: `Product.price: Decimal | None` (nullable — existing rows have no value; a migration cannot invent one). Consumed by Task 5 (`add_item` rejects a priceless product) and Task 6/7 (subtotal/snapshot calculation).

- [ ] **Step 1: Add the columns**

`backend/app/models/merchant.py` — add alongside existing columns:

```python
    currency: Mapped[str] = mapped_column(String, default="EGP", server_default="EGP")
    next_order_number: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
```

(add `Integer` to that file's existing `sqlalchemy` import line.)

`backend/app/models/product.py` — add:

```python
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
```

(add `from decimal import Decimal` and `Numeric` to the existing imports.)

- [ ] **Step 2: Generate and hand-verify the migration**

Run: `cd backend && make migrate` (message: `add merchant currency/order counter and product price`)

Expected: `ALTER TABLE merchants ADD COLUMN currency VARCHAR NOT NULL DEFAULT 'EGP'`, `ALTER TABLE merchants ADD COLUMN next_order_number INTEGER NOT NULL DEFAULT 1`, `ALTER TABLE products ADD COLUMN price NUMERIC(10, 2)` (nullable, no default). Hand-verify the generated `downgrade()` drops all three columns cleanly.

- [ ] **Step 3: Apply and verify**

Run: `cd backend && make upgrade` — expect a clean apply against the running dev Postgres.

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/merchant.py backend/app/models/product.py backend/alembic/versions/
git commit -m "feat: add Merchant.currency/next_order_number and Product.price"
```

---

### Task 3: `Cart` and `CartItem` models

**Files:**
- Create: `backend/app/models/cart.py`
- Create: `backend/app/models/cart_item.py`
- Modify: `backend/app/models/enums.py`
- Modify: `backend/app/models/__init__.py`
- Create: `backend/alembic/versions/<hash>_add_carts_and_cart_items.py`
- Test: `backend/tests/models/test_cart.py`

**Interfaces:**
- Produces: `CartStatus` enum (`ACTIVE`, `CHECKED_OUT`). Consumed by Tasks 5 and 7.
- Produces: `Cart` ORM model (`id`, `merchant_id`, `conversation_id`, `status`, `created_at`, `updated_at`) with `items` relationship. Consumed by Tasks 5, 6, 7.
- Produces: `CartItem` ORM model (`id`, `cart_id`, `product_id`, `quantity`, `notes`, `created_at`, `updated_at`). Consumed by Tasks 5, 6, 7.

**Design decision — price-freeze semantics:** `CartItem` stores **no price**. It holds only `product_id` (a live FK) + `quantity` + `notes`; every read (subtotal, checkout state) joins to `Product.price` live, so a price change is reflected in an open cart exactly as most storefronts behave. This directly mirrors the SRD's own vocabulary: Cart Service *"calculates"* a subtotal (§25, a live computation), while Order Snapshotting (§27) exists specifically to *freeze* values so *"later catalog changes [don't] alter historical orders"* — a concern the SRD states only for `Order`, never for `Cart`. Freezing happens once, at `create_order` time (Task 7), not at add-to-cart time.

**Design decision — one active cart per conversation, enforced atomically, not by convention:** a partial unique index on `(conversation_id) WHERE status = 'ACTIVE'` (not a plain column-level unique constraint) allows a *new* cart to start for the same conversation after a previous one is `CHECKED_OUT` — e.g. a returning customer placing a second order in the same ongoing chat — while still making "get or create the active cart" a race-safe, single-statement operation.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/models/test_cart.py
import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Cart, CartItem, CartStatus


@pytest.mark.anyio
async def test_cart_round_trip(db_session, merchant, conversation):
    cart = Cart(merchant_id=merchant.id, conversation_id=conversation.id)
    db_session.add(cart)
    await db_session.flush()
    await db_session.refresh(cart)

    assert cart.id is not None
    assert cart.status == CartStatus.ACTIVE


@pytest.mark.anyio
async def test_only_one_active_cart_per_conversation(db_session, merchant, conversation):
    db_session.add(Cart(merchant_id=merchant.id, conversation_id=conversation.id))
    await db_session.flush()
    db_session.add(Cart(merchant_id=merchant.id, conversation_id=conversation.id))
    with pytest.raises(IntegrityError):
        await db_session.flush()


@pytest.mark.anyio
async def test_cart_item_round_trip(db_session, merchant, conversation):
    from app.models.product import Product

    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    cart = Cart(merchant_id=merchant.id, conversation_id=conversation.id)
    db_session.add_all([product, cart])
    await db_session.flush()

    item = CartItem(cart_id=cart.id, product_id=product.id, quantity=2)
    db_session.add(item)
    await db_session.flush()
    await db_session.refresh(item)

    assert item.id is not None
    assert item.quantity == 2
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/models/test_cart.py -v`
Expected: FAIL — `ImportError: cannot import name 'Cart' from 'app.models'`

- [ ] **Step 3: Implement**

`backend/app/models/enums.py` — add:

```python
class CartStatus(enum.StrEnum):
    ACTIVE = "ACTIVE"
    CHECKED_OUT = "CHECKED_OUT"
```

`backend/app/models/cart.py`:

```python
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import CartStatus


class Cart(Base):
    __tablename__ = "carts"
    __table_args__ = (
        Index(
            "uq_carts_one_active_per_conversation",
            "conversation_id",
            unique=True,
            postgresql_where=text("status = 'ACTIVE'"),
        ),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(String, ForeignKey("merchants.id"), nullable=False, index=True)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    status: Mapped[CartStatus] = mapped_column(
        SAEnum(CartStatus, name="cartstatus"), nullable=False, default=CartStatus.ACTIVE, server_default="ACTIVE"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items: Mapped[list["CartItem"]] = relationship(back_populates="cart", cascade="all, delete-orphan")
```

(Verify the emitted DDL in Step 4 reads `CREATE UNIQUE INDEX ... ON carts (conversation_id) WHERE (status = 'ACTIVE')` — if Alembic autogenerate doesn't pick up the partial predicate correctly, hand-write that one line in the migration rather than dropping the partial condition.)

`backend/app/models/cart_item.py`:

```python
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("cart_id", "product_id", name="uq_cart_items_cart_product"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    cart_id: Mapped[str] = mapped_column(String, ForeignKey("carts.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cart: Mapped["Cart"] = relationship(back_populates="items")
```

The `(cart_id, product_id)` unique constraint is what makes Task 5's `add_item` a safe atomic upsert instead of a read-then-write race.

Export both from `backend/app/models/__init__.py` (`Cart`, `CartItem`, `CartStatus`).

- [ ] **Step 4: Generate, hand-verify, and apply the migration**

Run: `cd backend && make migrate` (message: `add carts and cart_items`)
Hand-verify: the partial unique index predicate survived autogenerate (see Step 3 note); `cartstatus` is created as a plain enum type (not `create_type=False` — single-table, per Global Constraints).
Run: `cd backend && make upgrade`

- [ ] **Step 5: Run to verify pass**

Run: `cd backend && uv run pytest tests/models/test_cart.py -v`
Expected: PASS (3 passed)

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/cart.py backend/app/models/cart_item.py backend/app/models/enums.py backend/app/models/__init__.py backend/alembic/versions/ backend/tests/models/test_cart.py
git commit -m "feat: add Cart and CartItem models"
```

---

### Task 4: `OrderItem` model + `Order` hardening fields

**Files:**
- Create: `backend/app/models/order_item.py`
- Modify: `backend/app/models/order.py`
- Modify: `backend/app/models/enums.py`
- Modify: `backend/app/models/__init__.py`
- Create: `backend/alembic/versions/<hash>_harden_order_and_add_order_items.py`
- Test: `backend/tests/models/test_order_item.py`

**Interfaces:**
- Produces: `OrderSource` enum (`AI_EXTRACTION`, `CART_CHECKOUT`).
- Produces: `OrderItem` ORM model (`id`, `order_id`, `product_id` nullable FK, `name_snapshot`, `variant_snapshot`, `unit_price`, `quantity`) — SRD §27's fields, minus `variant_id` (see note below).
- Modifies: `Order` gains `merchant_id`, `source`, `cart_id`, `order_number`, `customer_name`, `customer_phone`, `delivery_address`, `subtotal`, `total`. Consumed by Task 7.

**Design decision — `variant_id` omitted from `OrderItem`.** SRD §27 lists `product_id, variant_id, name_snapshot, variant_snapshot, unit_price, quantity`. There is no `ProductVariant` table to reference (Global Constraints), so `variant_id` has nothing to point at — `variant_snapshot` (a free-text description, e.g. `"Size L, Red"`, sourced from whatever the AI captured against `Product.variants`' untyped JSON) covers what's actually buildable today. Add `variant_id` back once a structured variant model exists; don't fake a reference to nothing.

**Design decision — `product_id` is a nullable FK with `ON DELETE SET NULL`.** A snapshot's whole purpose is to survive catalog changes, including a product being deleted later — losing the *link* on delete is correct, losing `name_snapshot`/`unit_price` would defeat the point of §27.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/models/test_order_item.py
import pytest

from app.models import Order, OrderItem, OrderSource, OrderStatus
from app.models.enums import ModelTier


@pytest.mark.anyio
async def test_order_item_round_trip(db_session, merchant, conversation, message):
    order = Order(
        merchant_id=merchant.id, conversation_id=conversation.id, message_id=message.id,
        extracted_payload={}, status=OrderStatus.PENDING_REVIEW, confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK, source=OrderSource.CART_CHECKOUT,
    )
    db_session.add(order)
    await db_session.flush()

    item = OrderItem(order_id=order.id, name_snapshot="Blue Shirt", unit_price=199.99, quantity=2)
    db_session.add(item)
    await db_session.flush()
    await db_session.refresh(item)

    assert item.id is not None
    assert item.unit_price == 199.99


@pytest.mark.anyio
async def test_order_source_defaults_to_ai_extraction(db_session, merchant, conversation, message):
    order = Order(
        merchant_id=merchant.id, conversation_id=conversation.id, message_id=message.id,
        extracted_payload={}, status=OrderStatus.PENDING_REVIEW, confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK,
    )
    db_session.add(order)
    await db_session.flush()
    await db_session.refresh(order)

    assert order.source == OrderSource.AI_EXTRACTION
    assert order.order_number is None
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/models/test_order_item.py -v`
Expected: FAIL — `ImportError: cannot import name 'OrderItem' from 'app.models'`

- [ ] **Step 3: Implement**

`backend/app/models/enums.py` — add:

```python
class OrderSource(enum.StrEnum):
    AI_EXTRACTION = "AI_EXTRACTION"
    CART_CHECKOUT = "CART_CHECKOUT"
```

`backend/app/models/order.py` — add columns (existing columns unchanged):

```python
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    source: Mapped[OrderSource] = mapped_column(
        SAEnum(OrderSource, name="ordersource"), nullable=False,
        default=OrderSource.AI_EXTRACTION, server_default="AI_EXTRACTION",
    )
    cart_id: Mapped[str | None] = mapped_column(ForeignKey("carts.id"), nullable=True, unique=True)
    order_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(String, nullable=True)
    subtotal: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    total: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
```

Add a unique constraint `UniqueConstraint("merchant_id", "order_number", name="uq_orders_merchant_order_number")` to `Order.__table_args__` — Postgres treats every `NULL` as distinct for uniqueness purposes, so this allows unlimited legacy rows with `order_number IS NULL` while still enforcing per-merchant uniqueness once it's set (Task 7).

`backend/app/models/order_item.py`:

```python
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    variant_snapshot: Mapped[str | None] = mapped_column(String, nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
```

Export `OrderItem`, `OrderSource` from `backend/app/models/__init__.py`.

- [ ] **Step 4: Generate, hand-verify, and apply the migration**

Run: `cd backend && make migrate` (message: `harden order and add order_items`)

Hand-verify the generated migration includes a **data backfill**, not just DDL — existing `Order` rows need `merchant_id` populated (there's no way to add a `NOT NULL` FK column to a table with existing rows otherwise). Edit the autogenerated `op.add_column('orders', sa.Column('merchant_id', ...), nullable=False)` to be `nullable=True` first, then add the backfill, and finally alter it to be not null:

```python
# 1. Edit the autogenerated add_column to be nullable=True initially
op.add_column("orders", sa.Column("merchant_id", sa.String(), nullable=True))

# 2. Add the backfill
op.execute(
    """
    UPDATE orders SET merchant_id = conversations.merchant_id
    FROM conversations WHERE orders.conversation_id = conversations.id
    """
)

# 3. Add the alter_column to enforce NOT NULL
op.alter_column("orders", "merchant_id", nullable=False)
```

(`source` and `cart_id`/`order_number`/etc. don't need a backfill statement — their `server_default`/nullability already give existing rows a correct value.) `ordersource` is a plain enum (single-table, per Global Constraints).

Run: `cd backend && make upgrade`

- [ ] **Step 5: Run to verify pass**

Run: `cd backend && uv run pytest tests/models/test_order_item.py -v`
Expected: PASS (2 passed)

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/order_item.py backend/app/models/order.py backend/app/models/enums.py backend/app/models/__init__.py backend/alembic/versions/ backend/tests/models/test_order_item.py
git commit -m "feat: add OrderItem and harden Order with merchant_id/source/order_number/customer fields"
```

---

## Phase 2 — Cart Service

### Task 5: Real `cart/service.py` (`add_item`, `update_item`, `remove_item`)

**Files:**
- Modify: `backend/app/domains/cart/service.py`
- Modify: `backend/app/engine/tools/cart.py` (pass `session` through — one line per handler)
- Modify: `backend/tests/domains/cart/test_service.py`

**Interfaces:**
- Changes: `add_item(session: AsyncSession, merchant_id, conversation_id, product_id, quantity) -> dict`, `update_item(session, merchant_id, conversation_id, line_item_id, quantity) -> dict`, `remove_item(session, merchant_id, conversation_id, line_item_id) -> None` — same names/purpose as the stubs, `session` added as the new first parameter, now doing real work instead of raising.
- New local exceptions in `cart/service.py`: `CartItemNotFoundError` (line item doesn't exist or belongs to a different cart's conversation — mapped by `tools/cart.py` to `ActionArgumentError`, since `update_cart`/`remove_from_cart`'s `line_item_id` isn't validator-checked today, see Non-Goals).

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/domains/cart/test_service.py
import pytest

from app.domains.cart.service import CartItemNotFoundError, add_item, remove_item, update_item
from app.models.product import Product


@pytest.mark.anyio
async def test_add_item_creates_cart_and_item(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()

    result = await add_item(db_session, merchant.id, conversation.id, product.id, 2)
    assert result["quantity"] == 2
    assert result["product_id"] == product.id


@pytest.mark.anyio
async def test_add_item_twice_increments_quantity_not_duplicates_row(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()

    await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    result = await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    assert result["quantity"] == 2


@pytest.mark.anyio
async def test_add_item_rejects_priceless_product(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="No Price Yet")
    db_session.add(product)
    await db_session.flush()

    with pytest.raises(ValueError, match="no price set"):
        await add_item(db_session, merchant.id, conversation.id, product.id, 1)


@pytest.mark.anyio
async def test_update_item_changes_quantity(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    added = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    result = await update_item(db_session, merchant.id, conversation.id, added["line_item_id"], 5)
    assert result["quantity"] == 5


@pytest.mark.anyio
async def test_update_item_raises_for_unknown_line_item(db_session, merchant, conversation):
    with pytest.raises(CartItemNotFoundError):
        await update_item(db_session, merchant.id, conversation.id, "does-not-exist", 1)


@pytest.mark.anyio
async def test_remove_item_deletes_row(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    added = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    await remove_item(db_session, merchant.id, conversation.id, added["line_item_id"])
    with pytest.raises(CartItemNotFoundError):
        await update_item(db_session, merchant.id, conversation.id, added["line_item_id"], 1)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/cart/test_service.py -v`
Expected: FAIL — every test raises the old `NotImplementedError`.

- [ ] **Step 3: Implement**

```python
# backend/app/domains/cart/service.py
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.enums import CartStatus
from app.models.product import Product


class CartItemNotFoundError(Exception):
    """line_item_id does not reference an existing cart item for this conversation's cart."""


async def _get_or_create_active_cart(session: AsyncSession, merchant_id: str, conversation_id: str) -> Cart:
    result = await session.execute(
        select(Cart).where(
            Cart.conversation_id == conversation_id, 
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE
        )
    )
    cart = result.scalar_one_or_none()
    if cart is not None:
        return cart
    cart = Cart(merchant_id=merchant_id, conversation_id=conversation_id)
    session.add(cart)
    await session.flush()
    return cart


async def add_item(
    session: AsyncSession, merchant_id: str, conversation_id: str, product_id: str, quantity: float, notes: str | None = None
) -> dict:
    # product_id ownership is already validator-checked for the add_to_cart
    # action (app/engine/action_validator.py) before this is ever called; a
    # fresh lookup here is still needed to read `price`, not to re-validate
    # ownership.
    product = await session.get(Product, product_id)
    if product is None:
        raise ValueError(f"product {product_id!r} not found")
    if product.price is None:
        raise ValueError(f"product {product_id!r} has no price set - cannot add to cart")

    cart = await _get_or_create_active_cart(session, merchant_id, conversation_id)

    # Stock/variant resolution deferred: SRD S25 lists "Resolve variant" and
    # "Validate stock" as Cart Service responsibilities, but Product has no
    # stock column and no structured variant model (Global Constraints) -
    # see the sibling tool-layer plan's Global Constraints for the same
    # acknowledged gap. Nothing to check yet.
    stmt = (
        pg_insert(CartItem)
        .values(cart_id=cart.id, product_id=product_id, quantity=quantity, notes=notes)
        .on_conflict_do_update(
            index_elements=["cart_id", "product_id"],
            set_={"quantity": CartItem.quantity + quantity, "notes": notes},
        )
        .returning(CartItem.id, CartItem.quantity)
    )
    row = (await session.execute(stmt)).one()
    return {"line_item_id": row.id, "product_id": product_id, "quantity": row.quantity}


async def _get_item_for_conversation(session: AsyncSession, merchant_id: str, conversation_id: str, line_item_id: str) -> CartItem:
    result = await session.execute(
        select(CartItem)
        .join(Cart, Cart.id == CartItem.cart_id)
        .where(
            CartItem.id == line_item_id, 
            Cart.conversation_id == conversation_id,
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise CartItemNotFoundError(f"line_item_id {line_item_id!r} not found in this conversation's active cart")
    return item


async def update_item(
    session: AsyncSession, merchant_id: str, conversation_id: str, line_item_id: str, quantity: float
) -> dict:
    item = await _get_item_for_conversation(session, merchant_id, conversation_id, line_item_id)
    item.quantity = quantity
    await session.flush()
    return {"line_item_id": item.id, "product_id": item.product_id, "quantity": item.quantity}


async def remove_item(session: AsyncSession, merchant_id: str, conversation_id: str, line_item_id: str) -> None:
    item = await _get_item_for_conversation(session, merchant_id, conversation_id, line_item_id)
    await session.delete(item)
    await session.flush()
```

Update `backend/app/engine/tools/cart.py`'s three handlers to pass `session` through (each is currently something like `await cart_service.add_item(merchant_id, conversation_id, action.product_id, action.quantity)` — add `session` as the first argument) and to translate the new exceptions: catch `ValueError`/`CartItemNotFoundError` and re-raise as `ActionArgumentError([str(exc)])`, matching the existing pattern for argument-level failures elsewhere in the tool layer.

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/cart/test_service.py tests/engine/test_tools_cart.py -v`
Expected: PASS. (`test_tools_cart.py`'s existing three tests, which today assert `NotImplementedError`/`ToolUnavailableError`, must be rewritten in this step to assert real success — check them before assuming they still pass unmodified.)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/cart/service.py backend/app/engine/tools/cart.py backend/tests/domains/cart/test_service.py backend/tests/engine/test_tools_cart.py
git commit -m "feat: implement real Cart service (add/update/remove item)"
```

---

### Task 6: Real `checkout/service.py::get_checkout_state`

**Files:**
- Modify: `backend/app/domains/checkout/service.py`
- Modify: `backend/app/engine/tools/checkout.py` (pass `session` through for this handler)
- Modify: `backend/tests/domains/checkout/test_service.py`

**Interfaces:**
- Changes: `get_checkout_state(session: AsyncSession, merchant_id, conversation_id) -> dict` — returns the active cart's items with live prices and a computed subtotal, or an explicit "cart is empty" shape if there's no active cart.

- [ ] **Step 1: Write the failing tests**

```python
# add to backend/tests/domains/checkout/test_service.py
from app.domains.cart.service import add_item
from app.domains.checkout.service import get_checkout_state
from app.models.product import Product


@pytest.mark.anyio
async def test_get_checkout_state_empty_cart(db_session, merchant, conversation):
    state = await get_checkout_state(db_session, merchant.id, conversation.id)
    assert state == {"items": [], "subtotal": "0.00", "currency": merchant.currency}


@pytest.mark.anyio
async def test_get_checkout_state_computes_live_subtotal(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 2)

    state = await get_checkout_state(db_session, merchant.id, conversation.id)
    assert state["subtotal"] == "500.00"
    assert state["items"][0]["product_id"] == product.id
    assert state["items"][0]["line_total"] == "500.00"
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py -v`
Expected: FAIL — `get_checkout_state` still raises `NotImplementedError`.

- [ ] **Step 3: Implement**

```python
# add to backend/app/domains/checkout/service.py
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.enums import CartStatus
from app.models.merchant import Merchant
from app.models.product import Product


async def get_checkout_state(session: AsyncSession, merchant_id: str, conversation_id: str) -> dict:
    merchant = await session.get(Merchant, merchant_id)
    result = await session.execute(
        select(CartItem, Product)
        .join(Cart, Cart.id == CartItem.cart_id)
        .join(Product, Product.id == CartItem.product_id)
        .where(
            Cart.conversation_id == conversation_id,
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE
        )
    )
    rows = result.all()

    items = []
    subtotal = Decimal("0.00")
    for item, product in rows:
        line_total = product.price * Decimal(str(item.quantity))
        subtotal += line_total
        items.append({
            "line_item_id": item.id,
            "product_id": product.id,
            "name": product.name,
            "quantity": item.quantity,
            "unit_price": str(product.price),
            "line_total": str(line_total),
        })

    return {"items": items, "subtotal": str(subtotal), "currency": merchant.currency}
```

Update `backend/app/engine/tools/checkout.py`'s `handle_get_checkout_state` to pass `session` through.

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: PASS. (As in Task 5, `test_tools_checkout.py`'s existing `get_checkout_state` test currently asserts `NotImplementedError`/`ToolUnavailableError` and must be rewritten to assert real output.)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/checkout/service.py backend/app/engine/tools/checkout.py backend/tests/domains/checkout/test_service.py backend/tests/engine/test_tools_checkout.py
git commit -m "feat: implement real get_checkout_state with live pricing"
```

---

## Phase 3 — Order Hardening

### Task 7: Real `checkout/service.py::create_order`

**Files:**
- Modify: `backend/app/domains/checkout/service.py`
- Modify: `backend/app/engine/tools/checkout.py` (pass `session` through for this handler)
- Modify: `backend/tests/domains/checkout/test_service.py`

**Interfaces:**
- Changes: `create_order(session: AsyncSession, merchant_id, conversation_id, confirm: bool) -> dict` — validates the active cart is non-empty and that customer info was captured, snapshots every line item, generates a per-merchant order number, creates the `Order` + `OrderItem` rows, marks the cart `CHECKED_OUT`, and returns the created order's summary. Idempotent against retry (see below).

**Design decision — customer-info source and validation.** `update_customer_info` (already functional, unmodified by this plan) writes `customer_name`/`customer_phone`/`customer_address` into `Conversation.slots`. `create_order` reads those three keys, requires `customer_name` and `customer_phone` to be present (SRD §26 "validate customer information"), and requires `customer_address` to be a non-empty string (this plan's buildable subset of "validate delivery area" — see Non-Goals for what's *not* checked: no real governorate/area/fee matching, that's SRD §29). Missing/empty fields raise `ActionArgumentError` naming exactly which field is missing, not a generic failure.

**Design decision — order-number generation.** Per-merchant sequential integer, generated by a single atomic statement inside the same transaction as order creation — safe without relying on `conversation_lock` coverage (Global Constraints):

```sql
UPDATE merchants SET next_order_number = next_order_number + 1
WHERE id = :merchant_id RETURNING next_order_number - 1
```

The returned value is the new order's `order_number`. This is a plain integer, not a formatted string (e.g. not `"ORD-00042"`) — display formatting belongs to whatever eventually renders it (dashboard, customer-facing message), not to the stored value. Uniqueness is enforced by Task 4's `UniqueConstraint("merchant_id", "order_number")` as a backstop, not as the primary mechanism (the atomic `UPDATE ... RETURNING` is).

**Design decision — idempotency against retry.** Converting the cart is itself the guard: `create_order` first attempts `UPDATE carts SET status = 'CHECKED_OUT' WHERE id = :cart_id AND status = 'ACTIVE' RETURNING id`. If that returns a row, this call is the one creating the order — proceed. If it returns nothing, the cart was already checked out (by a previous attempt of the *same* logical request, or a genuine second attempt) — look up and return the existing `Order` for that `cart_id` instead of creating a duplicate.

- [ ] **Step 1: Write the failing tests**

```python
# add to backend/tests/domains/checkout/test_service.py
from app.domains.cart.service import add_item
from app.domains.checkout.service import create_order
from app.engine.tools.errors import ActionArgumentError
from app.models.product import Product
from sqlalchemy import select
from app.models.order import Order


@pytest.mark.anyio
async def test_create_order_rejects_empty_cart(db_session, merchant, conversation):
    with pytest.raises(ActionArgumentError, match="cart is empty"):
        await create_order(db_session, merchant.id, conversation.id, True)


@pytest.mark.anyio
async def test_create_order_rejects_missing_customer_info(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    with pytest.raises(ActionArgumentError, match="customer_name"):
        await create_order(db_session, merchant.id, conversation.id, True)


@pytest.mark.anyio
async def test_create_order_snapshots_and_assigns_order_number(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 2)
    conversation.slots = {
        "customer_name": "Sara", "customer_phone": "01012345678", "customer_address": "Nasr City",
    }
    await db_session.flush()

    result = await create_order(db_session, merchant.id, conversation.id, True)

    assert result["order_number"] == 1
    assert result["total"] == "500.00"

    order = (await db_session.execute(select(Order).where(Order.id == result["order_id"]))).scalar_one()
    assert order.source.value == "CART_CHECKOUT"
    assert order.customer_name == "Sara"
    await db_session.refresh(order, attribute_names=["items"])
    assert order.items[0].name_snapshot == "Shoes"
    assert order.items[0].unit_price == 250


@pytest.mark.anyio
async def test_create_order_is_idempotent_against_retry(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    conversation.slots = {
        "customer_name": "Sara", "customer_phone": "01012345678", "customer_address": "Nasr City",
    }
    await db_session.flush()

    first = await create_order(db_session, merchant.id, conversation.id, True)
    second = await create_order(db_session, merchant.id, conversation.id, True)
    assert first["order_id"] == second["order_id"]

    count = (await db_session.execute(select(Order).where(Order.merchant_id == merchant.id))).scalars().all()
    assert len(count) == 1
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py -v`
Expected: FAIL — `create_order` still raises the old `NotImplementedError`.

- [ ] **Step 3: Implement**

```python
# add to backend/app/domains/checkout/service.py
from sqlalchemy import text, update

from app.engine.tools.errors import ActionArgumentError
from app.models.conversation import Conversation
from app.models.enums import ModelTier, OrderSource, OrderStatus
from app.models.order import Order
from app.models.order_item import OrderItem


async def _get_active_cart_items(session: AsyncSession, merchant_id: str, conversation_id: str) -> list[tuple[CartItem, Product]]:
    result = await session.execute(
        select(CartItem, Product)
        .join(Cart, Cart.id == CartItem.cart_id)
        .join(Product, Product.id == CartItem.product_id)
        .where(
            Cart.conversation_id == conversation_id,
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE
        )
    )
    return result.all()


async def create_order(session: AsyncSession, merchant_id: str, conversation_id: str, confirm: bool) -> dict:
    cart_result = await session.execute(
        select(Cart).where(
            Cart.conversation_id == conversation_id,
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE
        )
    )
    cart = cart_result.scalar_one_or_none()
    rows = await _get_active_cart_items(session, merchant_id, conversation_id) if cart else []
    if cart is None or not rows:
        raise ActionArgumentError(["cart is empty - nothing to check out"])

    conversation = await session.get(Conversation, conversation_id)
    slots = conversation.slots or {}
    missing = [
        field for field, key in (("customer_name", "customer_name"), ("customer_phone", "customer_phone"))
        if not slots.get(key)
    ]
    if not slots.get("customer_address"):
        missing.append("customer_address")
    if missing:
        raise ActionArgumentError([f"missing required customer info: {', '.join(missing)}"])

    # Atomic conversion guard - see "idempotency against retry" above.
    converted = await session.execute(
        update(Cart).where(Cart.id == cart.id, Cart.status == CartStatus.ACTIVE)
        .values(status=CartStatus.CHECKED_OUT).returning(Cart.id)
    )
    if converted.scalar_one_or_none() is None:
        existing = await session.execute(select(Order).where(Order.cart_id == cart.id))
        order = existing.scalar_one()
        return {"order_id": order.id, "order_number": order.order_number, "total": str(order.total)}

    order_number_result = await session.execute(
        text("UPDATE merchants SET next_order_number = next_order_number + 1 WHERE id = :mid RETURNING next_order_number - 1"),
        {"mid": merchant_id},
    )
    order_number = order_number_result.scalar_one()

    subtotal = sum((product.price * Decimal(str(item.quantity)) for item, product in rows), Decimal("0.00"))

    # message_id: no single inbound message "caused" a tool-triggered order the
    # way pipeline.py's extraction flow has one - dispatch_action already
    # threads message_id through as the message that triggered this specific
    # tool call (the confirming message), which is the correct value here too.
    order = Order(
        merchant_id=merchant_id, conversation_id=conversation_id, message_id=None,  # see note in Task 7 write-up
        extracted_payload={}, status=OrderStatus.CONFIRMED, confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK, source=OrderSource.CART_CHECKOUT, cart_id=cart.id,
        order_number=order_number, customer_name=slots["customer_name"], customer_phone=slots["customer_phone"],
        delivery_address=slots["customer_address"], subtotal=subtotal, total=subtotal,
    )
    session.add(order)
    await session.flush()

    for item, product in rows:
        session.add(OrderItem(
            order_id=order.id, product_id=product.id, name_snapshot=product.name,
            unit_price=product.price, quantity=item.quantity,
        ))
    await session.flush()

    return {"order_id": order.id, "order_number": order_number, "total": str(subtotal)}
```

**Flag before implementing, don't silently resolve:** the sketch above passes `message_id=None`, but `Order.message_id` is a **non-nullable FK** (Task 4 did not change this). `dispatch_action` already receives a real `message_id` (the message that triggered this tool call) and could thread it into `create_order`'s signature — but that changes the frozen action-handler call shape (`handler(session, action, merchant_id, conversation_id)`, no `message_id`) documented in the tool-layer plan's Task 4. Resolve this explicitly during implementation as one of: (a) add `message_id` as a fifth parameter to every tool handler's signature (small, mechanical, touches all handler call sites), or (b) look it up from the cart's most recent associated message some other way. Don't ship code with a `None` passed to a non-nullable column — this needs a real decision at implementation time, flagged here so it isn't missed.

Update `backend/app/engine/tools/checkout.py`'s `handle_create_order` to pass `session` through and translate `ActionArgumentError` (already the right exception type, no translation needed — it propagates as-is through `dispatch_action`, which already handles it).

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: PASS. (`test_tools_checkout.py`'s existing `create_order` test currently asserts `NotImplementedError` and must be rewritten.)

- [ ] **Step 5: Full regression check**

Run: `cd backend && make test && make lint`
Expected: full suite green, no lint violations, including all of Phase 1/2's tests still passing together (cart → checkout state → order creation is one coherent flow by this point).

- [ ] **Step 6: Commit**

```bash
git add backend/app/domains/checkout/service.py backend/app/engine/tools/checkout.py backend/tests/domains/checkout/test_service.py backend/tests/engine/test_tools_checkout.py
git commit -m "feat: implement real create_order with snapshotting, order numbers, and idempotent retry"
```

---

## Follow-ups (explicitly not built in this plan)

- **`message_id` on tool-triggered orders** — flagged as an open implementation-time decision in Task 7, not resolved here.
- **`action_validator.py` line_item_id check** — once `CartItem` exists (Task 3), `update_cart`/`remove_from_cart` could get a DB-checked validator rule the same way `add_to_cart`'s `product_id` does today. Not required for correctness (Task 5's service layer already handles an unknown `line_item_id` safely), just for a cleaner audit trail.
- **`conversation_lock` coverage** — still only wraps the arq-worker path, not the tool-dispatch path. This plan's atomic-statement approach (Task 3's partial unique index, Task 5's upsert, Task 7's conditional `UPDATE`) means correctness doesn't depend on this being fixed, but closing the gap (tool-layer plan's own unfinished Task 9) would still be worth doing for defense in depth.
- **Wiring the tool layer to a live entry point** — `resolve_action` has zero callers today; nothing this plan builds is reachable in production until that's done.
- **Dashboard queries filtering by `source = 'CART_CHECKOUT'`** — the data is dashboard-ready (Global Constraints), the dashboard itself is a separate, unbuilt `ROADMAP.md` item.
- **A dedicated `Customer` entity** — SRD's ultimate target (§5), deliberately not built now (Non-Goals); revisit if repeat-customer features are ever prioritized.
- **Real delivery-area/fee validation (SRD §29)** and **structured stock/variant modeling (SRD §25)** — both remain explicitly deferred stubs, unchanged by this plan.
