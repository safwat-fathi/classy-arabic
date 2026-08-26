# Commerce Layer Completion — Doc Reconciliation + Safe-to-Land Gaps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile `ROADMAP.md`/`README.md`/`CLAUDE.md` with the actual, now substantially more complete, implementation status of three roadmap items (AI action validator + tool layer, Cart & checkout services, Order service hardening), and close the small, unambiguous implementation gaps those docs surface — while explicitly flagging the larger gaps that need their own design pass rather than guessing at a design.

**Architecture:** No new subsystems. Task 1 edits three markdown docs only. Tasks 2–4 are narrow, additive changes inside the existing `app/domains/cart/service.py`, `app/domains/checkout/service.py`, and their tool-layer callers — no new files, no migrations, no new endpoints, no schema changes.

**Tech Stack:** Same as the rest of the engine — FastAPI, SQLAlchemy 2.0 async, Alembic, pytest + pytest-asyncio, real Postgres test DB via the `db_session` fixture (outer transaction + `SAVEPOINT`, rolled back at teardown — not SQLite, so Postgres-only behavior like `ON CONFLICT`/`RETURNING` is exercised faithfully).

**Spec:** `TijaratkBot_SRD.md` §20–§21 (AI Tool Layer), §25 (Cart Service), §26–§27 (Order Service / Order Snapshotting), §37 (Idempotency); `TijaratkBot_PRD.md` §14–§15 (AI Tool/Action Set). This plan's own trigger and Task 1's target is `ROADMAP.md`.

## Global Constraints

- No native tool-calling / multi-round loop — the AI proposes exactly one structured JSON action per turn via the existing `json_schema_response_format` mechanism. Not touched by this plan.
- No stock column and no structured `ProductVariant` model exist yet. SRD §25's "Resolve variant"/"Validate stock" and SRD §27's `variant_id`/`variant_snapshot` stay unbuilt — out of scope here (see Recommended Follow-Up Plans, item 1).
- No Delivery Service (SRD §29) exists yet. SRD §25's "Calculate delivery"/"Calculate final total" and SRD §26's "Validate delivery area" stay unbuilt — out of scope here (see Recommended Follow-Up Plans, item 2). `ROADMAP.md` already tracks this as its own item; don't re-describe it, cross-reference it.
- `backend/app/engine/classification.py`, `extraction.py`, `pipeline.py`, `dump.rdb`, and two test files currently have **uncommitted changes from a separate, unrelated workstream**. The working-tree `pipeline.py` right now has a genuine syntax error (confirmed via `ast.parse`: unexpected indent, line 239) — unrelated to this plan, but it means `make test` cannot currently collect. None of this plan's tasks touch those files. Verify HEAD's committed `pipeline.py` (`git show HEAD:backend/app/engine/pipeline.py`) still matches the snippets quoted below before executing Task 1's `CLAUDE.md`/`README.md` inventory lines or any future work against `pipeline.py` — if the dirty file is still broken when this plan executes, that's this session's own earlier in-flight edit; resolve or stash it first rather than building on top of a file that doesn't parse.
- All claims in this plan were verified by three read-only explore passes against the actual code (file:line evidence) and the exact cited SRD/PRD sections, and by running the existing test suites read-only (45 tool-layer tests + 27 cart/checkout tests, all passing against committed HEAD).

---

## Task 1: Documentation reconciliation

**Status: DONE** — applied to `ROADMAP.md`, `README.md`, `CLAUDE.md` on 2026-08-26. Verified via a grep sweep for `cart|checkout|stub|not yet|doesn't yet|order` across all three plus `message-classification-ai-engine-spec.md`; every remaining hit is either the updated text itself or independently still-true (Multi-tenancy, Delivery service, Store knowledge retrieval, Merchant dashboard, Billing, Security baseline all still correctly say not-built).

**Files:**
- Modify: `ROADMAP.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`

**Interfaces:** None (prose only, no code).

- [x] **Step 1: `ROADMAP.md` — line 16 preamble**

The preamble currently claims everything below it is "not yet in this repo," which line 18 already contradicted and lines 19–20 are about to contradict further.

```diff
-Everything below is in the PRD's MVP scope (§4) or Success Criteria (§35) but not yet in this repo:
+Everything below is in the PRD's MVP scope (§4) or Success Criteria (§35). Struck-through items have since landed — kept here (rather than moved to "Now") so the SRD/PRD gap accounting stays in one place; each still notes what's left:
```

- [x] **Step 2: `ROADMAP.md` — line 18 (AI action validator + tool layer)**

Current text overstates the stub count (says 6 of 9 tools stubbed; actually 1 of 9 is a true stub) and "all 9 tool contracts" reads as "all of them" when the spec lists 11.

```diff
-- ~~**AI action validator + tool layer**~~ **Built** — validator, registry, `AIAction` audit trail, and all 9 tool contracts exist; `search_products`/`get_product`/`update_customer_info` are functional, the other 6 are validated-and-audited but stubbed pending the items below (SRD §21, PRD §15)
+- ~~**AI action validator + tool layer**~~ **Built** — validator, registry, `AIAction` audit trail, and 9 of the 11 SRD §21/PRD §15 tool contracts exist (`get_product_variants`/`get_cart` deliberately deferred — no variant model). 8 of 9 are functional (`search_products`, `get_product`, `add_to_cart`, `update_cart`, `remove_from_cart`, `get_checkout_state`, `update_customer_info`, `create_order`); only `search_store_knowledge` is still a stub, and `update_customer_info`'s delivery-area sub-check stubs out pending **Delivery service** below. Gated behind `Merchant.ai_tool_ordering_enabled` (default off; no admin UI yet to enable it per merchant). (SRD §20–§21, PRD §14–§15)
```

- [x] **Step 3: `ROADMAP.md` — line 19 (Cart & checkout services)**

Move from open gap to struck-through/Built with residual gaps named.

```diff
-- **Cart & checkout services** — `Cart`, `CartItem` entities and the deterministic cart/checkout flow (SRD §25)
+- ~~**Cart & checkout services**~~ **Built** — `Cart`/`CartItem` models (one active cart per conversation, DB-enforced), add/update/remove item, live checkout-state subtotal, and order creation with atomic per-cart idempotency (SRD §25). Reached only through the AI tool layer above (no HTTP router, by design). Not built: variant resolution & stock validation (no variant/stock model yet); delivery fee and a real final total (blocked on **Delivery service** below — `total` == `subtotal` today)
```

- [x] **Step 4: `ROADMAP.md` — line 20 (Order service hardening)**

Same treatment. The current trailing clause ("the surrounding service layer doesn't yet [exist]") is flatly false — `checkout/service.py::create_order` is that service layer.

```diff
-- **Order service hardening** — validate customer info/delivery area, order snapshotting, order numbers (SRD §26–§27); the `Order` model exists but the surrounding service layer doesn't yet
+- ~~**Order service hardening**~~ **Built** — customer-info presence validation, product/price snapshotting onto `OrderItem`, and atomic per-merchant sequential order numbers (SRD §26–§27). Not built: delivery-area validation (blocked on **Delivery service** below), order-status transitions after creation, `variant_id`/`variant_snapshot` (no variant model). The legacy AI-extraction path in `pipeline.py` still inserts `Order` rows directly, bypassing this service — SRD §26's "AI cannot directly insert orders" isn't enforced there yet
```

Lines 21–27 (Multi-tenancy, Delivery service, Store knowledge retrieval, Human handoff, Merchant dashboard, Billing, Security baseline) — **left unchanged**; independently reconfirmed still accurate.

- [x] **Step 5: `README.md` — lines 9–11 (Status intro)**

```diff
-This repo currently implements the **AI message-classification/routing engine** (the SRD's L0/L1/L2 pipeline, §14–§22) and a thin API around it. It does **not** yet implement the full commerce platform described in the PRD/SRD.
+This repo currently implements the **AI message-classification/routing engine** (the SRD's L0/L1/L2 pipeline, §14–§22) plus an early, flag-gated commerce layer (cart, checkout, order creation — reachable only through the AI tool layer, not yet through any dashboard). It does **not** yet implement the full commerce platform described in the PRD/SRD — billing, multi-tenancy, delivery, and a merchant dashboard are still missing.
```

- [x] **Step 6: `README.md` — line 23 (AI action validator + tool layer bullet)**

```diff
-- **AI action validator + tool layer** — `search_products`/`get_product`/`update_customer_info` fully functional; `add_to_cart`/`update_cart`/`remove_from_cart`/`get_checkout_state`/`create_order`/`search_store_knowledge` fully validated and audited (`AIAction`) but stubbed pending Cart/Order/StoreKnowledge services. Opt-in per merchant via `Merchant.ai_tool_ordering_enabled` (off by default); the existing classify→extract→auto-order flow is unchanged for merchants that don't opt in. (SRD §20-21, PRD §14-15)
+- **AI action validator + tool layer** — validator, registry, `AIAction` audit trail; 8 of 9 tool contracts fully functional (`search_products`/`get_product`/`add_to_cart`/`update_cart`/`remove_from_cart`/`get_checkout_state`/`update_customer_info`/`create_order`), only `search_store_knowledge` still stubbed. Opt-in per merchant via `Merchant.ai_tool_ordering_enabled` (off by default); the existing classify→extract→auto-order flow is unchanged for merchants that don't opt in. (SRD §20-21, PRD §14-15)
```

- [x] **Step 7: `README.md` — new bullet directly after line 23**

```diff
+- **Cart, checkout & order creation** — `Cart`/`CartItem` models (one active cart per conversation), add/update/remove item, checkout-state subtotal, and order creation with product/price snapshotting, atomic order numbers, and retry-idempotency (`app/domains/cart`, `app/domains/checkout`; SRD §25–§27). Reachable only through the AI tool layer above — no HTTP router — and only for merchants with `ai_tool_ordering_enabled=True`. Not built: variant/stock validation, delivery fee calculation, order-status transitions after creation.
```

- [x] **Step 8: `README.md` — line 26 ("Not yet built" list)**

```diff
 **Not yet built** (see `ROADMAP.md` for the full breakdown against PRD MVP scope):
-- Cart, checkout, and order-processing services beyond the `Order` model itself
 - Multi-tenancy enforcement (the SRD's `Tenant` entity/isolation model)
 - Delivery-area/fee service, store-knowledge retrieval, human handoff
 - Merchant dashboard (conversations inbox, order management, AI settings) beyond the `/demo` page
 - Billing (base plans, AI add-on, fair-use tracking)
```

- [x] **Step 9: `README.md` — project structure block (~lines 107–121)**

```diff
-    models/     # merchant, conversation, message, product, order, labeled_example
-    engine/     # tier0_rules, classification, extraction, routing_policy, pipeline, embeddings, clients, schemas
-    domains/    # health, messages, products, conversations — feature routers + schemas
+    models/     # merchant, conversation, message, product, order, order_item, cart, cart_item, ai_action, labeled_example, channel_connection, webhook_event
+    engine/     # tier0_rules, classification, extraction, routing_policy, pipeline, embeddings, clients, schemas, action_validator, action_resolution, tools/
+    domains/    # health, messages, products, conversations, channels, cart, checkout, store_knowledge — feature routers + schemas (cart/checkout/store_knowledge are service-only, no router — reached via the AI tool layer)
```

- [x] **Step 10: `CLAUDE.md` — line 67 (the highest-leverage stale claim — every future session loads this file as ground truth)**

```diff
-- No cart, checkout, billing, delivery, or multi-tenant dashboard layer yet — see the root `ROADMAP.md` for the full list against the PRD's MVP scope.
+- Cart, checkout, and order-creation services exist (`app/domains/cart`, `app/domains/checkout`) and are reachable through the AI tool layer (`app/engine/tools/`) — but only for merchants with `Merchant.ai_tool_ordering_enabled=True`, which defaults off with no admin UI yet to flip it. Billing, delivery, and a multi-tenant dashboard layer are still not built — see the root `ROADMAP.md` for the full list against the PRD's MVP scope.
```

- [x] **Step 11: `CLAUDE.md` — line 48 (`app/models/` inventory)**

```diff
-- `app/models/` — one file per ORM model (`merchant.py`, `conversation.py`, `message.py`, `product.py`, `order.py`, `labeled_example.py`) plus shared `enums.py` and an id helper `_ids.py` (UUID4 strings, not autoincrement ints). `app/models/__init__.py` re-exports everything; `alembic/env.py` imports `app.models` to register tables on `Base.metadata` before autogenerate.
+- `app/models/` — one file per ORM model (`merchant.py`, `conversation.py`, `message.py`, `product.py`, `order.py`, `order_item.py`, `cart.py`, `cart_item.py`, `ai_action.py`, `ai_usage_event.py`, `labeled_example.py`, `channel_connection.py`, `webhook_event.py`) plus shared `enums.py` and an id helper `_ids.py` (UUID4 strings, not autoincrement ints). `app/models/__init__.py` re-exports everything; `alembic/env.py` imports `app.models` to register tables on `Base.metadata` before autogenerate.
```

- [x] **Step 12: `CLAUDE.md` — line 49 (`app/engine/` inventory — currently doesn't mention the very subsystem this plan is about)**

```diff
-- `app/engine/` — the classification/routing logic described above. Pure functions where possible (`tier0_rules`, `context_budget`, `routing_policy`) so they're unit-testable without a DB or network call; `pipeline.py::process_message` wires them together and is the one function with DB/network side effects.
+- `app/engine/` — the classification/routing logic described above, plus the AI action/tool layer: `action_validator.py` (schema/ownership checks before execution), `tools/` (registry + `catalog`/`cart`/`checkout`/`knowledge` handlers), and `action_resolution.py` (LLM-driven tool selection, gated behind `Merchant.ai_tool_ordering_enabled`). Pure functions where possible (`tier0_rules`, `context_budget`, `routing_policy`) so they're unit-testable without a DB or network call; `pipeline.py::process_message` wires them together and is the one function with DB/network side effects.
```

- [x] **Step 13: `CLAUDE.md` — line 50 (`app/domains/<name>/` inventory)**

```diff
-- `app/domains/<name>/` — feature-oriented routers + schemas (currently `health`, `messages`, `products`, `conversations`). New API features should follow this domain-folder pattern rather than a flat `routers/` directory.
+- `app/domains/<name>/` — feature-oriented routers + schemas (currently `health`, `messages`, `products`, `conversations`, `channels`). `cart`, `checkout`, `store_knowledge` also live here but are service-only — no router; reached exclusively through the AI tool layer (`app/engine/tools/`), by design. New API features should follow this domain-folder pattern rather than a flat `routers/` directory.
```

- [x] **Step 14: Verify prose self-consistency** — grep sweep done, clean (see Status note above).

- [ ] **Step 15: Commit**

```bash
git add ROADMAP.md README.md CLAUDE.md
git commit -m "docs: reconcile roadmap/readme/claude.md with landed cart, checkout, and order-hardening work"
```

**Explicitly not touched by Task 1:** `TijaratkBot_SRD.md`/`TijaratkBot_PRD.md` (define required behavior, not actual state — not status trackers), `message-classification-ai-engine-spec.md` (out of scope, verified in Step 14), `docs/superpowers/plans/2026-08-25-*.md` (point-in-time implementation plans, already executed — historical record, not living docs), `docs/review-current-implementation.md` (a separate, already-closed remediation effort scoped to old pipeline wiring).

---

## Task 2: Make `create_order`'s `confirm` parameter do something

`CreateOrderAction.confirm: bool = True` (`backend/app/engine/schemas.py:128`) and `create_order`'s `confirm` parameter (`backend/app/domains/checkout/service.py:63-65`) are accepted but never read again in the function body — an AI proposing `confirm=False` still creates a real order. **Confirmed with user:** `confirm=False` is a preview/dry-run gate — validate everything (cart non-empty, customer info present) but don't write anything, and return the same shape `get_checkout_state` already returns (plus a `confirmed: False` marker) instead of an order. (Considered and rejected: creating a `PENDING_REVIEW` order instead — deferred because there's no order-status-transition endpoint yet for it to ever leave that state; dropping the field entirely — rejected in favor of closing the dead-parameter gap now.)

**Files:**
- Modify: `backend/app/domains/checkout/service.py:63-160` (`create_order`)
- Test: `backend/tests/domains/checkout/test_service.py`

**Interfaces:**
- Consumes: existing `get_checkout_state(session, merchant_id, conversation_id) -> dict` (`checkout/service.py:24-50`, returns `{"items": [...], "subtotal": "...", "currency": "..."}`).
- Produces: `create_order(...)` return value gains a new shape for the `confirm=False` case: `{"confirmed": False, "items": [...], "subtotal": "...", "currency": "..."}`. The `confirm=True` return shape (`{"order_id", "order_number", "total"}`) is unchanged.

- [ ] **Step 1: Write the failing tests**

```python
async def test_create_order_confirm_false_previews_without_creating_order(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 2)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Nasr City",
    }
    await db_session.flush()

    result = await create_order(db_session, merchant.id, conversation.id, False, message_id=message.id)

    assert result["confirmed"] is False
    assert result["subtotal"] == "500.00"
    assert result["items"][0]["product_id"] == product.id

    from sqlalchemy import select

    from app.models.order import Order

    orders = (await db_session.execute(select(Order).where(Order.merchant_id == merchant.id))).scalars().all()
    assert orders == []


async def test_create_order_confirm_true_after_preview_still_creates_order(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Nasr City",
    }
    await db_session.flush()

    preview = await create_order(db_session, merchant.id, conversation.id, False, message_id=message.id)
    assert preview["confirmed"] is False

    result = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)
    assert result["order_number"] == 1
```

Add both to `backend/tests/domains/checkout/test_service.py`.

- [ ] **Step 2: Run and verify both fail**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py::test_create_order_confirm_false_previews_without_creating_order tests/domains/checkout/test_service.py::test_create_order_confirm_true_after_preview_still_creates_order -v`
Expected: first test FAILs with `KeyError: 'confirmed'` (a real order is created instead); second currently passes coincidentally (confirm is ignored either way) — note that, then proceed.

- [ ] **Step 3: Implement**

In `backend/app/domains/checkout/service.py`, insert a preview branch right after the existing missing-customer-info check (`if missing: raise ActionArgumentError(...)`) and before the "Atomic conversion guard" comment:

```python
    if missing:
        raise ActionArgumentError([f"missing required customer info: {', '.join(missing)}"])

    if not confirm:
        state = await get_checkout_state(session, merchant_id, conversation_id)
        return {"confirmed": False, **state}

    # Atomic conversion guard (SRD S37): ...
```

- [ ] **Step 4: Run and verify both pass**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: PASS, including the two new tests and all pre-existing ones (no regressions).

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/checkout/service.py backend/tests/domains/checkout/test_service.py
git commit -m "feat: make create_order's confirm=False return a preview instead of ignoring it"
```

---

## Task 3: Thread `notes` from `add_to_cart` through to `CartItem`

`AddToCartAction.notes: str | None = None` (`backend/app/engine/schemas.py:101`) and `CartItem.notes` (`backend/app/models/cart_item.py:24`) both already exist, but `cart_service.add_item`'s signature has no `notes` parameter, and `handle_add_to_cart` silently drops `action.notes` — the column is permanently `NULL`.

**Files:**
- Modify: `backend/app/domains/cart/service.py:28-56` (`add_item`)
- Modify: `backend/app/engine/tools/cart.py:10-18` (`handle_add_to_cart`)
- Test: `backend/tests/domains/cart/test_service.py`, `backend/tests/engine/test_tools_cart.py`

**Interfaces:**
- Produces: `add_item(session, merchant_id, conversation_id, product_id, quantity, notes=None) -> dict`. Return dict gains a `"notes"` key. On a repeat add to an existing line, a new non-`None` `notes` replaces the stored one; omitting `notes` (the schema default) **preserves** whatever was already stored via `COALESCE(excluded.notes, cart_items.notes)` — quantity accumulates, notes does not get erased by a follow-up quantity-only add.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/domains/cart/test_service.py
async def test_add_item_persists_notes(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()

    result = await add_item(db_session, merchant.id, conversation.id, product.id, 1, notes="size 42")
    assert result["notes"] == "size 42"

    from sqlalchemy import select

    from app.models.cart_item import CartItem

    item = (await db_session.execute(select(CartItem).where(CartItem.id == result["line_item_id"]))).scalar_one()
    assert item.notes == "size 42"


async def test_add_item_repeat_without_notes_preserves_existing_notes(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()

    await add_item(db_session, merchant.id, conversation.id, product.id, 1, notes="size 42")
    again = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    assert again["notes"] == "size 42"
    assert again["quantity"] == 2
```

The second test is the one that matters most: a naive `set_={"notes": notes}` on conflict passes the first test but **silently overwrites the note with `NULL`** on this second, more realistic sequence (AI adds with a note, then a plain follow-up add with no note). Both must pass together.

```python
# backend/tests/engine/test_tools_cart.py
async def test_handle_add_to_cart_threads_notes_through(db_session, merchant, conversation):
    db_session.add(Product(id="p3", merchant_id=merchant.id, name="Shoes", price=250, aliases=[]))
    await db_session.flush()
    action = AddToCartAction(action="add_to_cart", product_id="p3", quantity=1, notes="size 42", confidence=0.9)
    result = await handle_add_to_cart(db_session, action, merchant.id, conversation.id, "msg-1")
    assert result["notes"] == "size 42"
```

- [ ] **Step 2: Run and verify both fail**

Run: `cd backend && uv run pytest tests/domains/cart/test_service.py::test_add_item_persists_notes tests/domains/cart/test_service.py::test_add_item_repeat_without_notes_preserves_existing_notes tests/engine/test_tools_cart.py::test_handle_add_to_cart_threads_notes_through -v`
Expected: FAIL with `TypeError: add_item() got an unexpected keyword argument 'notes'`.

- [ ] **Step 3: Implement**

`backend/app/domains/cart/service.py` — top-of-file import gains `func`:

```python
from sqlalchemy import func, select
```

`add_item` — note the `on_conflict_do_update`'s `notes` uses `COALESCE(excluded.notes, cart_items.notes)`, not the bare `notes` parameter, so an omitted `notes` on a repeat add preserves the existing value instead of nulling it out:

```python
async def add_item(
    session: AsyncSession,
    merchant_id: str,
    conversation_id: str,
    product_id: str,
    quantity: float,
    notes: str | None = None,
) -> dict:
    product = await session.get(Product, product_id)
    if product is None or product.price is None:
        raise ValueError(f"product {product_id!r} has no price set - cannot add to cart")

    cart = await _get_or_create_active_cart(session, merchant_id, conversation_id)

    insert_stmt = pg_insert(CartItem).values(cart_id=cart.id, product_id=product_id, quantity=quantity, notes=notes)
    stmt = insert_stmt.on_conflict_do_update(
        index_elements=["cart_id", "product_id"],
        set_={
            "quantity": CartItem.quantity + quantity,
            "notes": func.coalesce(insert_stmt.excluded.notes, CartItem.notes),
        },
    ).returning(CartItem.id, CartItem.quantity, CartItem.notes)
    row = (await session.execute(stmt)).one()
    return {"line_item_id": row.id, "product_id": product_id, "quantity": row.quantity, "notes": row.notes}
```

`backend/app/engine/tools/cart.py`:

```python
@register_tool("add_to_cart")
async def handle_add_to_cart(
    session: AsyncSession, action: AddToCartAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    try:
        return await cart_service.add_item(
            session, merchant_id, conversation_id, action.product_id, action.quantity, notes=action.notes
        )
    except ValueError as exc:
        raise ActionArgumentError([str(exc)]) from exc
```

- [ ] **Step 4: Run and verify all three pass, plus no regressions**

Run: `cd backend && uv run pytest tests/domains/cart/test_service.py tests/engine/test_tools_cart.py tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: PASS. (Checkout tests included because `checkout/service.py` also calls `add_item` — confirm the added optional `notes` parameter with its default doesn't break any existing positional call.)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/cart/service.py backend/app/engine/tools/cart.py backend/tests/domains/cart/test_service.py backend/tests/engine/test_tools_cart.py
git commit -m "feat: persist add_to_cart's notes field instead of discarding it"
```

---

## Task 4: Scope cart-item lookups to merchant + active cart

Today `_get_or_create_active_cart` accepts `merchant_id` but never filters by it, and `_get_item_for_conversation` (used by `update_item`/`remove_item`) doesn't accept `merchant_id` at all and doesn't filter by `Cart.status`. In current usage `merchant_id` and `conversation_id` are always correctly paired by the caller (derived from the same conversation), so this is defense-in-depth, not a fix for an observed exploit — but it's the same tightening direction as the rest of this codebase's multi-tenant scoping and it's cheap to add now.

**Files:**
- Modify: `backend/app/domains/cart/service.py:15-25` (`_get_or_create_active_cart`), `:59-83` (`_get_item_for_conversation`, `update_item`, `remove_item`)
- Test: `backend/tests/domains/cart/test_service.py`

**Interfaces:**
- Produces: `_get_item_for_conversation(session, merchant_id, conversation_id, line_item_id) -> CartItem` (gains a `merchant_id` parameter and an active-cart-only filter). `update_item`/`remove_item`'s public signatures are unchanged — they already take `merchant_id`, they just start using it.

- [ ] **Step 1: Write the failing tests**

```python
async def test_update_item_rejects_line_item_from_another_merchant(db_session, merchant, conversation):
    from app.models.merchant import Merchant

    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()

    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    added = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    with pytest.raises(CartItemNotFoundError):
        await update_item(db_session, other_merchant.id, conversation.id, added["line_item_id"], 5)


async def test_update_item_rejects_line_item_from_checked_out_cart(db_session, merchant, conversation):
    from sqlalchemy import select

    from app.models.cart import Cart
    from app.models.enums import CartStatus

    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    added = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    cart = (await db_session.execute(select(Cart).where(Cart.conversation_id == conversation.id))).scalar_one()
    cart.status = CartStatus.CHECKED_OUT
    await db_session.flush()

    with pytest.raises(CartItemNotFoundError):
        await update_item(db_session, merchant.id, conversation.id, added["line_item_id"], 5)
```

- [ ] **Step 2: Run and verify both fail**

Run: `cd backend && uv run pytest tests/domains/cart/test_service.py::test_update_item_rejects_line_item_from_another_merchant tests/domains/cart/test_service.py::test_update_item_rejects_line_item_from_checked_out_cart -v`
Expected: FAIL — both currently succeed (no `CartItemNotFoundError` raised) because merchant/status aren't filtered.

- [ ] **Step 3: Implement**

```python
async def _get_or_create_active_cart(session: AsyncSession, merchant_id: str, conversation_id: str) -> Cart:
    result = await session.execute(
        select(Cart).where(
            Cart.conversation_id == conversation_id,
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE,
        )
    )
    cart = result.scalar_one_or_none()
    if cart is not None:
        return cart
    cart = Cart(merchant_id=merchant_id, conversation_id=conversation_id)
    session.add(cart)
    await session.flush()
    return cart


async def _get_item_for_conversation(
    session: AsyncSession, merchant_id: str, conversation_id: str, line_item_id: str
) -> CartItem:
    result = await session.execute(
        select(CartItem)
        .join(Cart, Cart.id == CartItem.cart_id)
        .where(
            CartItem.id == line_item_id,
            Cart.conversation_id == conversation_id,
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE,
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

- [ ] **Step 4: Run and verify all pass, no regressions**

Run: `cd backend && uv run pytest tests/domains/cart/test_service.py tests/engine/test_tools_cart.py tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: PASS, including all pre-existing tests (`test_remove_item_deletes_row`, `test_update_item_raises_for_unknown_line_item`, etc. — none of them exercise cross-merchant or checked-out-cart access, so none should change behavior).

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/cart/service.py backend/tests/domains/cart/test_service.py
git commit -m "fix: scope cart item lookups to owning merchant and active cart"
```

---

## Deferred (mechanical, but blocked on other in-flight work)

**`PipelineResult.action_resolution` field.** `action_resolution.py::resolve_action` computes a customer-facing `response_text` (`ActionResolution.response_text`, `action_resolution.py:21`) but `pipeline.py`'s tool-ordering branch (`pipeline.py:165-172`) discards the whole `ActionResolution` object except `.escalation_reason`, and `PipelineResult` (`pipeline.py:36-38`) has no field to carry it even if it wanted to. The fix is mechanical — add `action_resolution: ActionResolution | None = None` to the `PipelineResult` dataclass and pass `resolution` through at `pipeline.py:172` — but `pipeline.py` is one of the files with uncommitted, currently-broken changes from a separate workstream (see Global Constraints). Do this once that lands or is reverted, not on top of a file that doesn't currently parse. Note even once done, `response_text` still has no consumer until outbound sending exists (README/ROADMAP's already-documented "outbound replies not implemented" gap) — this only makes it reachable in-process for whatever's built next.

## Recommended follow-up plans (need their own design pass — not tasked here)

Per the writing-plans skill's Scope Check: these are independent subsystems, each blocking a "Not built" line left in Task 1's doc edits. Writing fully-specified TDD tasks for any of them now would mean inventing a schema or an API surface with no product decision behind it — that's a plan risk, not a shortcut. Recommend `/superpowers:brainstorming` scoped to one of these at a time before turning it into a plan.

1. **`ProductVariant` + stock model** (SRD §9; unblocks SRD §25 "Resolve variant"/"Validate stock" and SRD §27's `variant_id`/`variant_snapshot`). Open questions a brainstorm needs to settle: does a variant have its own price/SKU or inherit the parent product's with overrides? Does stock decrement at `add_to_cart` time or `create_order` time, and how does that interact with two customers racing for the last unit across two different active carts?

2. **Delivery Service** (SRD §29) — already its own `ROADMAP.md` line; unblocks SRD §25 "Calculate delivery"/"Calculate final total" and SRD §26 "Validate delivery area". Open questions: matching algorithm (area-name string match vs. a governorate enum vs. geocoding/radius) and fee model (flat per area vs. distance-based).

3. **Store knowledge retrieval** (SRD §23) — already its own `ROADMAP.md` line; unblocks `search_store_knowledge`. Open questions: content source (merchant-authored FAQ text, structured Q&A, or scraped) and retrieval mechanism (SRD specifies keyword/full-text; `BAAI/bge-m3` embeddings are already wired for clustering and could be reused instead/also).

4. **Legacy `pipeline.py` AI-extraction path vs. SRD §26 "AI cannot directly insert orders."** The non-tool-ordering branch of `process_message` still builds `Order` rows directly from raw LLM extraction — no cart, no snapshot guarantees, no order number — coexisting with the hardened checkout path. Three directions, each with real tradeoffs: (a) migrate all merchants to tool-ordering and delete the legacy branch, (b) keep both but route the legacy branch through `checkout.service` too (needs a cart-less order-creation entry point), (c) accept the tension as a permanent, tool-ordering-gated MVP shortcut. This is a product/rollout decision as much as a technical one. Also blocked on the same dirty-`pipeline.py` constraint as the deferred item above.

5. **No admin surface for `Merchant.ai_tool_ordering_enabled`.** No merchants router or dashboard exists to flip this flag for a real merchant — today it's DB-edit-only. A full fix is coupled to Security baseline (RBAC, not built) and Merchant dashboard (not built), both already separate `ROADMAP.md` items. If testing tool-ordering against a real merchant is needed sooner, the lowest-risk interim is a one-off `scripts/enable_tool_ordering.py` admin script mirroring the existing `scripts/seed.py` pattern, not a new unauthenticated HTTP endpoint.

6. **Order-status-transition capability** (SRD §26 "Update order status"). No order ever transitions after creation, and there's no orders router at all. Same coupling as item 5 — an endpoint that can flip `Order.status` needs RBAC in front of it or it's just a new way to tamper with orders unauthenticated. Recommend building alongside the Merchant dashboard's order-management surface, not standalone.

---

## Self-review

**Spec coverage:** SRD §20–§21 (validator/registry/9-tool count) — Task 1 Step 2. §25 (Cart Service's 9 responsibilities) — Task 1 Step 3 names all 4 unbuilt ones explicitly; Tasks 3–4 close two small implementation gaps within the built responsibilities (notes persistence, merchant/status scoping) without claiming to close "resolve variant"/"validate stock"/"delivery". §26–§27 (Order Service, Order Snapshotting) — Task 1 Step 4 names all remaining gaps (delivery-area validation, status transitions, variant fields, legacy-path violation) explicitly rather than glossing over them. §37 (Idempotency) — already correctly documented as built (atomic conditional `UPDATE`), not re-litigated here.

**Placeholder scan:** No task above contains TBD/"add appropriate handling"/"similar to Task N" — every code step is real, current-source-verified code (read directly from the files, not paraphrased from agent summaries) or a real diff against quoted current text. The 6 "Recommended follow-up" items are deliberately *not* written as tasks, and are labeled as needing a design pass rather than disguised as ready-to-execute steps.

**Type/signature consistency:** `add_item`'s new `notes` parameter (Task 3) and `_get_item_for_conversation`'s new `merchant_id` parameter (Task 4) both touch `backend/app/domains/cart/service.py` in different functions — verified no overlap in the exact lines each diff touches. Task 3's `handle_add_to_cart` change and Task 4's service-layer change don't conflict (different call sites). Task 2 is isolated to `checkout/service.py`.

---

## Execution log

- 2026-08-26: Plan drafted, reviewed by advisor twice (once on the doc-reconciliation scope, once on Tasks 2–4's code — caught and fixed a real bug in Task 3's original `on_conflict_do_update` that would have silently nulled out notes on a repeat add), `confirm` semantics for Task 2 confirmed with the user via AskUserQuestion (preview/dry-run, chosen over PENDING_REVIEW or dropping the field). Task 1 executed and verified. Tasks 2–4 executed inline immediately after (see commits).
