# AI Action Validator + Tool Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the AI pipeline a safe way to take real backend actions during a conversation — search/inspect the product catalog and capture customer contact info today, and (for the cart/checkout/order/store-knowledge actions whose backing services don't exist yet) propose those actions through a fully real, fully validated, fully audited contract that fails safely until those services land — without changing the behavior of the classify→extract→auto-order path already shipped today.

**Architecture:** A new `app/engine/action_validator.py` + `app/engine/tools/` package implement SRD §20's "Action Validator": the AI proposes exactly one structured JSON action per turn (PRD §14's envelope, reusing the existing `json_schema_response_format` mechanism — no native tool-calling, no multi-round loop; see Global Constraints). A new `AIAction` model audits every proposed action, executed or rejected. A registry dispatches validator-approved actions to per-tool handlers under `app/engine/tools/`, which call into domain services (`app/domains/products/service.py` extended; new `app/domains/cart/`, `app/domains/checkout/`, `app/domains/store_knowledge/` stub services for the 6 tools blocked on schema that doesn't exist). `pipeline.py::process_message` gains one new internal branch, gated by a new `Merchant.ai_tool_ordering_enabled` flag, that calls the new `resolve_action` instead of today's `extract_order` step for opted-in merchants — everything else about `process_message` is unchanged.

**Tech Stack:** Same stack as the rest of the engine — FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2 discriminated unions, the existing `openai` SDK client against OpenRouter/DeepSeek, pytest + pytest-asyncio + respx.

**Spec:** `TijaratkBot_SRD.md` §20 Action Validator (538-569), §21 Tool inventory (570-588), §4/§6 multi-tenancy (119-142/173-196), §23 Store Knowledge (625-663), §25 Cart Service (683-700), §26-27 Order Service/Snapshotting (701-735), §29 Delivery Service (759-783), §36 Conversation Concurrency (923-935), §37 Idempotency (937-947), §44 Failure Handling (1068-1096), §54 module structure (1383-1409), §56 Architectural Invariants (1440-1460); `TijaratkBot_PRD.md` §9 pipeline diagram (251-292), §14 Action Architecture (401-444), §15 Action set (445-475), §21-23 Commerce Truth/Conversational Ordering/Checkout (600-659), §25 Address Handling (676-690), §31 Model Abstraction (788-807); `ROADMAP.md:18` (this repo's authoritative 9-tool scope). Supersedes the Non-Goal recorded in `docs/superpowers/plans/2026-08-24-ai-engine-correctness-gateway-eval.md:25`.

## Global Constraints

- Tool inventory is the **9 tools from `ROADMAP.md:18`**: `search_products`, `get_product`, `add_to_cart`, `update_cart`, `remove_from_cart`, `get_checkout_state`, `update_customer_info`, `create_order`, `search_store_knowledge`. SRD §21 (`TijaratkBot_SRD.md:570-588`) and PRD §15 (`TijaratkBot_PRD.md:445-470`) each list **11**, additionally naming `get_product_variants` and `get_cart` — deliberately deferred (see Non-Goals), because PRD §14's own `add_to_cart` example keys off a `variant_id` that nothing in the 9-tool scope can resolve against (`Product` has no structured variant model, only an unstructured `variants` JSON dict — see Task 10).
- Action invocation is **one structured-JSON action proposal per message turn** (PRD §14 envelope: `{"action": "...", ...fields}`), **not** a multi-round tool-calling loop and **not** native OpenAI `tools=`/`tool_choice=`. Per SRD §14 steps 8-10 and §55 step 14 (one action resolved and executed per turn) and SRD §20/PRD §14 (custom validated JSON envelope, not function-calling). This reuses the existing `json_schema_response_format` + `parse_json_content()` mechanism already used for `IntentClassification`/`ExtractionResult` (`gateway.py`, `clients.py`) — **no changes to `gateway.py` or `clients.py`**. Native tool-calling was considered and rejected: DeepSeek v4 Flash via OpenRouter does support `tools=`/`tool_choice=`, but no spec section asks for it, and adopting it would also require reworking `clients.py::parse_json_content()`, which reads `message.content` and fails on the `content=None` shape of real tool-call responses.
- All new/modified entities scope by **`merchant_id`** against the existing `Merchant` model — **no `Tenant`/`tenant_id` is introduced**. SRD §4/§6 describe a `Tenant` entity that does not exist in this repo yet (`ROADMAP.md:21` tracks it separately); this follows the precedent set in `docs/superpowers/plans/2026-08-24-ai-engine-correctness-gateway-eval.md:674` ("no config/columns for values that can't be set yet").
- Validator checks reconcile SRD §20 (`TijaratkBot_SRD.md:556-566`: schema / tenant(merchant) ownership / product status / variant existence / stock / quantity / business rules) with PRD §14's `add_to_cart` example (`TijaratkBot_PRD.md:401-444`: variant exists / belongs to merchant / product active / variant available / quantity valid). Today's schema can only support **product existence** and **merchant ownership** as DB-checked rules; **quantity validity** is enforced at the Pydantic schema layer (Task 2); **product status/active, stock, and variant checks are explicitly deferred** — `Product` has no `status`, `stock`, or structured-variant column (confirmed absent from every migration). Each deferred check is cited at its point of use, not silently dropped.
- **6 of the 9 tools** (`add_to_cart`, `update_cart`, `remove_from_cart`, `get_checkout_state`, `create_order`, `search_store_knowledge`) get a full contract — argument schema, validator rules, and tests — dispatched to a named service seam (`app/domains/cart/service.py`, `app/domains/checkout/service.py`, `app/domains/store_knowledge/service.py`) that deterministically raises/returns "not available yet" and is recorded/escalated accordingly. The underlying business logic (Cart/CartItem storage, pricing, order snapshotting/numbering, delivery-area validation, the FAQ knowledge table) is **out of scope** — see Non-Goals. This was a deliberate scope decision, not a default.
- The new action-resolution path is **additive**: the existing single-shot classify→extract→auto-create-`Order` flow in `pipeline.py` is unchanged for every current caller. The new path is gated by a new `Merchant.ai_tool_ordering_enabled` boolean (default `False`) and only replaces the extraction step, internally, for merchants that opt in — this was a deliberate scope decision, not a default.
- `AIAction` (named as a core entity in SRD §5:166; required by Architectural Invariant #10, `TijaratkBot_SRD.md:1453`, "every AI action must be observable and auditable" — a requirement the SRD states but never backs with a field schema anywhere in its 57 sections) is a new audit-log model recording **every** proposed action, both executed and rejected, scoped by `merchant_id`, modeled in the same spirit as the `AIUsageEvent` audit pattern SRD §32 describes (conversation/message-scoped, `created_at`).
- §36 lock coverage (`TijaratkBot_SRD.md:923-935`, "a conversation must have a processing lock... prevents two customer messages from being processed against stale cart/conversation state simultaneously"): the new action-resolution path mutates state, so `conversation_lock` (`app/core/locks.py`) must wrap `process_message` at **both** existing entry points. Today it only wraps the arq-worker path (`worker.py:24`); the HTTP `POST /messages` path takes no lock at all. This plan fixes that gap (Task 9) — a spec violation shipped by construction is not acceptable.
- §44 error contract (`TijaratkBot_SRD.md:1068-1096`): invalid JSON from the model retries once, then escalates (reuses the existing `AICallError` retry handling already in `classification.py`/`extraction.py`'s pattern). A rejected or unavailable action must **never** be described to the customer as having succeeded — the response is always rendered from the actually-recorded outcome, never from what the model claimed. The 6 stubbed tools' deterministic "not available yet" response **is** §44 compliance, not a placeholder.
- §37 idempotency (`TijaratkBot_SRD.md:937-947`): out of full scope (no cart/order mutation is live yet to be duplicated), but the `AIAction` audit row plus the validator's reject-before-execute ordering means a retried/duplicate action is at minimum fully observable — flagged here so a future cart/order plan inherits an audit trail, not a blind spot.
- Enum/migration gotcha (`CLAUDE.md`, citing `alembic/versions/2d17ac4bd857_add_classification_schema.py`): does **not** apply here. `AIAction.action_type` and `AIAction.status` are plain `String` columns, not a shared Postgres `ENUM` — deliberately, since the action-type set will grow as tools are added, and a DB enum would need a migration per addition. Confirmed this was a choice, not an oversight that happened to dodge the gotcha.
- `AIAction.message_id` is a plain indexed `String`, **not** a `ForeignKey("messages.id")` — deliberately. `merchant_id`/`conversation_id` are real FKs (both fixtures are confirmed to exist per `CLAUDE.md`'s Testing section), but `Message`'s exact required columns and whether a `message` test fixture exists were not confirmed during research. An audit-log table recording a rejected or failed action doesn't strictly need relational integrity against the triggering message to be useful, and a hard FK would force every test (and every future caller) to guaratee message-row flush ordering that's incidental to what `AIAction` is for. State this if a future migration adds the FK back once `Message`'s schema is confirmed — don't add it silently.

## Non-Goals (explicit — do not build these here)

- `get_product_variants` and `get_cart` (SRD §21:570-588, PRD §15:445-470) — not in `ROADMAP.md`'s 9-tool list this plan implements. Add if/when a structured product-variant model exists.
- `Cart`/`CartItem` models, product pricing/currency, and the real Cart/Checkout/StoreKnowledge business logic behind the 6 stubbed tools (SRD §25, §26-27, §23, §29) — separate `ROADMAP.md` items ("Cart & checkout services", "Order service hardening", "Store knowledge retrieval", "Delivery service").
- A `Tenant` entity (SRD §4, §6) — separate `ROADMAP.md` item ("Multi-tenancy").
- Multi-round/agentic tool-calling loops — not what the spec describes (see Global Constraints).
- Replacing or modifying the existing classify→extract→auto-order flow's behavior for merchants that don't opt in.
- Full delivery-area validation (SRD §29) — `update_customer_info` captures and format-validates customer info but reports delivery-area checking as unavailable.
- AI-generated natural-language narration of action results (SRD §30 "AI Response Service") — this plan renders deterministic template responses from verified outcome state. Model-generated narration is a reasonable follow-up, not built here.
- `HumanHandoff` entity / active handoff routing (SRD §31) — a stubbed-tool outcome sets `Message.escalation_reason` (the existing mechanism) but does not build handoff routing itself; that's a separate `ROADMAP.md` item.

---

## Phase 1 — Action Schema, Audit Model & Validator Core

### Task 1: `AIAction` audit model + migration

**Files:**
- Create: `backend/app/models/ai_action.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/models/merchant.py`
- Create: `backend/alembic/versions/<hash>_add_ai_actions_and_tool_ordering_flag.py`
- Test: `backend/tests/models/test_ai_action.py`

**Interfaces:**
- Produces: `AIAction` ORM model (`id`, `merchant_id`, `conversation_id`, `message_id`, `action_type: str`, `arguments: dict`, `status: str` — one of `"executed"|"rejected"|"failed"`, `errors: list`, `result: dict | None`, `created_at`). Consumed by Task 4 (`registry.py::_record_ai_action`).
- Produces: `Merchant.ai_tool_ordering_enabled: bool` (default `False`). Consumed by Task 9.

- [ ] **Step 1: Write the model**

```python
# backend/app/models/ai_action.py
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models._ids import new_id


class AIAction(Base):
    __tablename__ = "ai_actions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(String, ForeignKey("merchants.id"), index=True)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"), index=True)
    message_id: Mapped[str] = mapped_column(String, ForeignKey("messages.id"), index=True)
    action_type: Mapped[str] = mapped_column(String, index=True)
    arguments: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String, index=True)
    errors: Mapped[list] = mapped_column(JSON, default=list)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

`message_id` is deliberately a plain `String`, not a `ForeignKey` — see Global Constraints for why.

- [ ] **Step 2: Add the merchant flag**

In `backend/app/models/merchant.py`, add alongside the existing columns:

```python
    ai_tool_ordering_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
```

(add `Boolean` to that file's existing `sqlalchemy` import line.)

- [ ] **Step 3: Export from `__init__.py`**

Add `AIAction` to `backend/app/models/__init__.py`'s imports and `__all__`, alongside the existing `Message`/`WebhookEvent`/etc. exports.

- [ ] **Step 4: Generate and hand-verify the migration**

Run: `cd backend && make migrate` (prompted message: `add ai_actions table and merchant tool-ordering flag`)
Expected: a new file under `alembic/versions/` creating table `ai_actions` (columns matching Step 1, indexes on `merchant_id`/`conversation_id`/`message_id`/`action_type`/`status`) and `ALTER TABLE merchants ADD COLUMN ai_tool_ordering_enabled BOOLEAN NOT NULL DEFAULT false`.

Hand-verify: no `sa.Enum(...)` in the generated file for `action_type`/`status` (they must autogenerate as `sa.String()` since the model uses plain `str` columns) — if Alembic emits anything else, fix the model, don't hand-edit the migration to paper over a model mismatch.

- [ ] **Step 5: Apply and verify**

Run: `cd backend && make upgrade`
Expected: migration applies cleanly against the running dev Postgres with no errors.

- [ ] **Step 6: Write and run a model round-trip test**

```python
# backend/tests/models/test_ai_action.py
import pytest

from app.models import AIAction


@pytest.mark.anyio
async def test_ai_action_round_trip(db_session, merchant, conversation):
    action = AIAction(
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id="msg-does-not-need-to-exist-for-this-round-trip",
        action_type="search_products",
        arguments={"query": "shoes"},
        status="executed",
        errors=[],
        result={"products": []},
    )
    db_session.add(action)
    await db_session.flush()
    await db_session.refresh(action)

    assert action.id is not None
    assert action.status == "executed"
    assert action.created_at is not None
```

Run: `cd backend && uv run pytest tests/models/test_ai_action.py -v`
Expected: PASS. (If `tests/models/` doesn't exist yet, create it with an empty `__init__.py` if the existing `tests/` tree uses package-style dirs — check `tests/engine/` for precedent before adding one.)

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/ai_action.py backend/app/models/__init__.py backend/app/models/merchant.py backend/alembic/versions/ backend/tests/models/test_ai_action.py
git commit -m "feat: add AIAction audit model and merchant tool-ordering flag"
```

---

### Task 2: Proposed-action schemas

**Files:**
- Modify: `backend/app/engine/schemas.py`
- Test: `backend/tests/engine/test_action_schemas.py`

**Interfaces:**
- Consumes: nothing new (same `pydantic.BaseModel`/`field_validator` machinery already in `schemas.py` for `IntentClassification`/`ExtractionResult`).
- Produces: `ProposedAction` (a `Field(discriminator="action")` union of 9 action models) and `ProposedActionEnvelope` (`RootModel[ProposedAction]`). Consumed by Task 3 (`action_validator.py`), Task 4 (`registry.py`), Task 8 (`resolve_action`).

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/engine/test_action_schemas.py
import pytest
from pydantic import ValidationError

from app.engine.schemas import ProposedActionEnvelope


def test_parses_add_to_cart_envelope():
    raw = '{"action": "add_to_cart", "product_id": "p1", "quantity": 2, "confidence": 0.9}'
    envelope = ProposedActionEnvelope.model_validate_json(raw)
    assert envelope.root.action == "add_to_cart"
    assert envelope.root.product_id == "p1"
    assert envelope.root.quantity == 2


def test_rejects_unknown_action():
    raw = '{"action": "delete_everything", "confidence": 0.9}'
    with pytest.raises(ValidationError):
        ProposedActionEnvelope.model_validate_json(raw)


def test_confidence_normalizes_over_one():
    raw = '{"action": "get_checkout_state", "confidence": 90}'
    envelope = ProposedActionEnvelope.model_validate_json(raw)
    assert envelope.root.confidence == 0.9


def test_add_to_cart_rejects_nonpositive_quantity():
    raw = '{"action": "add_to_cart", "product_id": "p1", "quantity": 0, "confidence": 0.9}'
    with pytest.raises(ValidationError):
        ProposedActionEnvelope.model_validate_json(raw)


def test_search_products_rejects_empty_query():
    raw = '{"action": "search_products", "query": "", "confidence": 0.9}'
    with pytest.raises(ValidationError):
        ProposedActionEnvelope.model_validate_json(raw)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/engine/test_action_schemas.py -v`
Expected: FAIL — `ImportError: cannot import name 'ProposedActionEnvelope' from 'app.engine.schemas'`

- [ ] **Step 3: Implement the schemas**

Append to `backend/app/engine/schemas.py` (reusing the file's existing `Literal`/`Field`/`field_validator` imports — add `RootModel` and `Annotated` to the existing `pydantic`/`typing` imports):

```python
class _ActionBase(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, v: float) -> float:
        if v > 1.0:
            return min(v / 100, 1.0)
        return v


class SearchProductsAction(_ActionBase):
    action: Literal["search_products"]
    query: str = Field(min_length=1)
    filters: dict[str, str | float | None] = Field(default_factory=dict)


class GetProductAction(_ActionBase):
    action: Literal["get_product"]
    product_id: str


class AddToCartAction(_ActionBase):
    action: Literal["add_to_cart"]
    product_id: str
    quantity: float = Field(gt=0)
    notes: str | None = None


class UpdateCartAction(_ActionBase):
    action: Literal["update_cart"]
    line_item_id: str
    quantity: float = Field(gt=0)


class RemoveFromCartAction(_ActionBase):
    action: Literal["remove_from_cart"]
    line_item_id: str


class GetCheckoutStateAction(_ActionBase):
    action: Literal["get_checkout_state"]


class UpdateCustomerInfoAction(_ActionBase):
    action: Literal["update_customer_info"]
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class CreateOrderAction(_ActionBase):
    action: Literal["create_order"]
    confirm: bool = True


class SearchStoreKnowledgeAction(_ActionBase):
    action: Literal["search_store_knowledge"]
    query: str = Field(min_length=1)
    knowledge_type: (
        Literal["faq", "shipping", "returns", "exchange", "payment", "general"] | None
    ) = None


ProposedAction = Annotated[
    SearchProductsAction
    | GetProductAction
    | AddToCartAction
    | UpdateCartAction
    | RemoveFromCartAction
    | GetCheckoutStateAction
    | UpdateCustomerInfoAction
    | CreateOrderAction
    | SearchStoreKnowledgeAction,
    Field(discriminator="action"),
]


class ProposedActionEnvelope(RootModel[ProposedAction]):
    pass
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/engine/test_action_schemas.py -v`
Expected: PASS (5 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/schemas.py backend/tests/engine/test_action_schemas.py
git commit -m "feat: add discriminated-union ProposedAction schemas"
```

---

### Task 3: Action validator

**Files:**
- Create: `backend/app/engine/action_validator.py`
- Test: `backend/tests/engine/test_action_validator.py`

**Interfaces:**
- Consumes: `ProposedAction`, `AddToCartAction`, `GetProductAction` (Task 2, `schemas.py`); `Product` model (`app/models/product.py`).
- Produces: `ValidationError(code: str, message: str)`, `ValidationResult(approved: bool, errors: list[ValidationError])`, `async def evaluate_action(session: AsyncSession, action: ProposedAction, *, merchant_id: str) -> ValidationResult`. Consumed by Task 4 (`registry.py::dispatch_action`).

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/engine/test_action_validator.py
import pytest

from app.engine.action_validator import (
    ValidationError,
    check_product_belongs_to_merchant,
    check_product_exists,
    evaluate_action,
)
from app.engine.schemas import GetCheckoutStateAction, GetProductAction
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


@pytest.mark.anyio
async def test_evaluate_action_rejects_unknown_product(db_session, merchant):
    action = GetProductAction(action="get_product", product_id="does-not-exist", confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is False
    assert result.errors[0].code == "product_not_found"


@pytest.mark.anyio
async def test_evaluate_action_rejects_other_merchants_product(db_session, merchant):
    other = Product(id="p-other", merchant_id="not-" + merchant.id, name="Shoes")
    db_session.add(other)
    await db_session.flush()
    action = GetProductAction(action="get_product", product_id="p-other", confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is False
    assert result.errors[0].code == "product_not_owned"


@pytest.mark.anyio
async def test_evaluate_action_approves_owned_product(db_session, merchant):
    product = Product(id="p-mine", merchant_id=merchant.id, name="Shoes")
    db_session.add(product)
    await db_session.flush()
    action = GetProductAction(action="get_product", product_id="p-mine", confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is True
    assert result.errors == []


@pytest.mark.anyio
async def test_evaluate_action_approves_actions_with_no_db_checkable_rules(db_session, merchant):
    action = GetCheckoutStateAction(action="get_checkout_state", confidence=0.9)
    result = await evaluate_action(db_session, action, merchant_id=merchant.id)
    assert result.approved is True
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/engine/test_action_validator.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.engine.action_validator'`

- [ ] **Step 3: Implement the validator**

```python
# backend/app/engine/action_validator.py
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.schemas import AddToCartAction, GetProductAction, ProposedAction
from app.models.product import Product


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


async def _check_product_ownership(
    session: AsyncSession, product_id: str, merchant_id: str
) -> list[ValidationError]:
    product = await session.get(Product, product_id)
    if (err := check_product_exists(product)) is not None:
        return [err]
    if (err := check_product_belongs_to_merchant(product, merchant_id)) is not None:
        return [err]
    return []


async def evaluate_action(
    session: AsyncSession, action: ProposedAction, *, merchant_id: str
) -> ValidationResult:
    """Runs SRD S20's DB-checkable validator rules for the given action.

    Quantity validity is enforced at the Pydantic schema layer (schemas.py) and
    is not re-checked here. Product status/stock/variant checks are deferred —
    Product has no status, stock, or structured-variant column yet (Global
    Constraints). search_products/update_cart/remove_from_cart/
    get_checkout_state/update_customer_info/create_order/search_store_knowledge
    have no DB-checkable rules beyond the schema layer today.
    """
    errors: list[ValidationError] = []
    if isinstance(action, (GetProductAction, AddToCartAction)):
        errors = await _check_product_ownership(session, action.product_id, merchant_id)
    return ValidationResult(approved=not errors, errors=errors)
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/engine/test_action_validator.py -v`
Expected: PASS (7 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/action_validator.py backend/tests/engine/test_action_validator.py
git commit -m "feat: add action validator for product ownership rules"
```

---

### Task 4: Tool registry & dispatch

**Files:**
- Create: `backend/app/engine/tools/__init__.py`
- Create: `backend/app/engine/tools/errors.py`
- Create: `backend/app/engine/tools/registry.py`
- Test: `backend/tests/engine/test_tool_registry.py`

**Interfaces:**
- Consumes: `ProposedAction` (Task 2); `evaluate_action`, `ValidationError` (Task 3); `AIAction` (Task 1).
- Produces: `ToolUnavailableError`, `ActionArgumentError` (`tools/errors.py`); `register_tool(name)`, `ActionOutcome(status, result, errors)`, `async def dispatch_action(session, action, *, merchant_id, conversation_id, message_id) -> ActionOutcome` (`tools/registry.py`). Consumed by Tasks 5, 10, 11, 12 (handlers register via `@register_tool`) and Task 8 (`resolve_action` calls `dispatch_action`).

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/engine/test_tool_registry.py
import pytest
from sqlalchemy import select

from app.engine.schemas import GetCheckoutStateAction, GetProductAction
from app.engine.tools import registry as registry_module
from app.engine.tools.errors import ToolUnavailableError
from app.engine.tools.registry import dispatch_action
from app.models.ai_action import AIAction
from app.models.product import Product


async def _unavailable(session, action, merchant_id, conversation_id):
    raise ToolUnavailableError("checkout state requires a Cart which does not exist yet")


async def _echo_product(session, action, merchant_id, conversation_id):
    return {"product": {"id": action.product_id}}


@pytest.mark.anyio
async def test_dispatch_rejects_unapproved_action(db_session, merchant, conversation):
    action = GetProductAction(action="get_product", product_id="missing", confidence=0.9)
    outcome = await dispatch_action(
        db_session, action, merchant_id=merchant.id,
        conversation_id=conversation.id, message_id="msg-1",
    )
    assert outcome.status == "rejected"
    assert outcome.errors[0].code == "product_not_found"

    rows = (
        await db_session.execute(select(AIAction).where(AIAction.conversation_id == conversation.id))
    ).scalars().all()
    assert len(rows) == 1
    assert rows[0].status == "rejected"


@pytest.mark.anyio
async def test_dispatch_records_tool_unavailable_as_failed(db_session, merchant, conversation, monkeypatch):
    # Scoped to this test via monkeypatch — must NOT permanently mutate the
    # module-global _REGISTRY, since Task 11 later registers a real handler
    # under this same action name and a leaked test double would shadow it.
    monkeypatch.setitem(registry_module._REGISTRY, "get_checkout_state", _unavailable)
    action = GetCheckoutStateAction(action="get_checkout_state", confidence=0.9)
    outcome = await dispatch_action(
        db_session, action, merchant_id=merchant.id,
        conversation_id=conversation.id, message_id="msg-2",
    )
    assert outcome.status == "failed"
    assert outcome.errors[0].code == "tool_unavailable"


@pytest.mark.anyio
async def test_dispatch_executes_approved_action(db_session, merchant, conversation, monkeypatch):
    product = Product(id="p-ok", merchant_id=merchant.id, name="Shoes")
    db_session.add(product)
    await db_session.flush()
    # Same scoping concern as above — Task 5 registers the real "get_product" handler.
    monkeypatch.setitem(registry_module._REGISTRY, "get_product", _echo_product)

    action = GetProductAction(action="get_product", product_id="p-ok", confidence=0.9)
    outcome = await dispatch_action(
        db_session, action, merchant_id=merchant.id,
        conversation_id=conversation.id, message_id="msg-3",
    )
    assert outcome.status == "executed"
    assert outcome.result == {"product": {"id": "p-ok"}}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/engine/test_tool_registry.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.engine.tools'`

- [ ] **Step 3: Implement errors and registry**

```python
# backend/app/engine/tools/errors.py
class ToolUnavailableError(Exception):
    """Raised by a tool handler whose backing service does not exist yet."""


class ActionArgumentError(Exception):
    """Raised by a handler when an argument fails a check the validator
    can't express generically."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__(", ".join(errors))
```

```python
# backend/app/engine/tools/registry.py
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.action_validator import ValidationError, evaluate_action
from app.engine.schemas import ProposedAction
from app.engine.tools.errors import ActionArgumentError, ToolUnavailableError
from app.models.ai_action import AIAction

ToolHandler = Callable[[AsyncSession, ProposedAction, str, str], Awaitable[dict]]

_REGISTRY: dict[str, ToolHandler] = {}


def register_tool(action_name: str) -> Callable[[ToolHandler], ToolHandler]:
    def _wrap(fn: ToolHandler) -> ToolHandler:
        _REGISTRY[action_name] = fn
        return fn

    return _wrap


@dataclass(frozen=True)
class ActionOutcome:
    status: Literal["executed", "rejected", "failed"]
    result: dict | None
    errors: list[ValidationError] = field(default_factory=list)


async def _record_ai_action(
    session: AsyncSession,
    action: ProposedAction,
    merchant_id: str,
    conversation_id: str,
    message_id: str,
    *,
    status: str,
    errors: list[ValidationError],
    result: dict | None,
) -> None:
    session.add(
        AIAction(
            merchant_id=merchant_id,
            conversation_id=conversation_id,
            message_id=message_id,
            action_type=action.action,
            arguments=action.model_dump(mode="json", exclude={"action", "confidence"}),
            status=status,
            errors=[{"code": e.code, "message": e.message} for e in errors],
            result=result,
        )
    )
    await session.flush()


async def dispatch_action(
    session: AsyncSession,
    action: ProposedAction,
    *,
    merchant_id: str,
    conversation_id: str,
    message_id: str,
) -> ActionOutcome:
    validation = await evaluate_action(session, action, merchant_id=merchant_id)
    if not validation.approved:
        await _record_ai_action(
            session, action, merchant_id, conversation_id, message_id,
            status="rejected", errors=validation.errors, result=None,
        )
        return ActionOutcome(status="rejected", result=None, errors=validation.errors)

    handler = _REGISTRY.get(action.action)
    if handler is None:
        # No handler registered yet (e.g. its tools/<module>.py hasn't landed
        # or hasn't been wired into tools/__init__.py) — fail the same way an
        # explicit ToolUnavailableError would, never raise a bare KeyError.
        errors = [ValidationError("tool_unavailable", f"no handler registered for action {action.action!r}")]
        await _record_ai_action(
            session, action, merchant_id, conversation_id, message_id,
            status="failed", errors=errors, result=None,
        )
        return ActionOutcome(status="failed", result=None, errors=errors)

    try:
        result = await handler(session, action, merchant_id, conversation_id)
    except ActionArgumentError as exc:
        errors = [ValidationError("argument_invalid", msg) for msg in exc.errors]
        await _record_ai_action(
            session, action, merchant_id, conversation_id, message_id,
            status="rejected", errors=errors, result=None,
        )
        return ActionOutcome(status="rejected", result=None, errors=errors)
    except ToolUnavailableError as exc:
        errors = [ValidationError("tool_unavailable", str(exc))]
        await _record_ai_action(
            session, action, merchant_id, conversation_id, message_id,
            status="failed", errors=errors, result=None,
        )
        return ActionOutcome(status="failed", result=None, errors=errors)

    await _record_ai_action(
        session, action, merchant_id, conversation_id, message_id,
        status="executed", errors=[], result=result,
    )
    return ActionOutcome(status="executed", result=result, errors=[])
```

`tools/__init__.py` is created **empty** in this task (no handler modules exist yet). It will **not stay empty**: `@register_tool` only runs its side effect (populating `_REGISTRY`) when the module defining it is imported, so something must import every handler module before `dispatch_action` can find it. Since importing any submodule of a package first runs that package's `__init__.py` (standard Python import semantics), and `action_resolution.py` (Task 8) already does `from app.engine.tools.registry import ...`, adding one `from app.engine.tools import <module>  # noqa: F401` line per handler module here guarantees registration happens automatically, with no explicit wiring anywhere else. **Task 5 is the first task that adds a line to this file** (for `catalog`); Tasks 6, 10, and 12 each add one more (for `checkout`, `cart`, `knowledge`). Leaving this step out is a real functional bug, not a style nit — without it, every handler is unreachable outside tests that `monkeypatch` the registry directly.

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/engine/test_tool_registry.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/tools/__init__.py backend/app/engine/tools/errors.py backend/app/engine/tools/registry.py backend/tests/engine/test_tool_registry.py
git commit -m "feat: add tool registry and action dispatch with audit recording"
```

---

## Phase 2 — Functional Tools

### Task 5: `search_products` and `get_product` handlers

**Files:**
- Modify: `backend/app/domains/products/service.py`
- Create: `backend/app/engine/tools/catalog.py`
- Modify: `backend/tests/domains/products/test_service.py` (create if it doesn't already exist — check first)
- Test: `backend/tests/engine/test_tools_catalog.py`

**Interfaces:**
- Consumes: `ProductRead` (existing `products/schemas.py`); `Product` model; `register_tool`, `ActionArgumentError` (Task 4); `SearchProductsAction`, `GetProductAction` (Task 2).
- Produces: `async def search_products(db, merchant_id, query, filters) -> list[ProductRead]`, `async def get_product(db, merchant_id, product_id) -> ProductRead | None` (added to `products/service.py`, alongside the existing `list_products`); `handle_search_products`, `handle_get_product` (registered handlers, `tools/catalog.py`). Consumed by Task 8.

- [ ] **Step 1: Write the failing tests**

```python
# add to backend/tests/domains/products/test_service.py
import pytest

from app.domains.products.service import get_product, search_products
from app.models.product import Product


@pytest.mark.anyio
async def test_search_products_matches_name_substring(db_session, merchant):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    db_session.add(Product(id="p2", merchant_id=merchant.id, name="Red Shoes", aliases=[]))
    await db_session.flush()

    results = await search_products(db_session, merchant.id, "shirt", {})
    assert [p.id for p in results] == ["p1"]


@pytest.mark.anyio
async def test_search_products_scoped_to_merchant(db_session, merchant):
    db_session.add(Product(id="p1", merchant_id="other-merchant", name="Blue Shirt", aliases=[]))
    await db_session.flush()

    results = await search_products(db_session, merchant.id, "shirt", {})
    assert results == []


@pytest.mark.anyio
async def test_get_product_returns_none_for_other_merchant(db_session, merchant):
    db_session.add(Product(id="p1", merchant_id="other-merchant", name="Blue Shirt", aliases=[]))
    await db_session.flush()

    assert await get_product(db_session, merchant.id, "p1") is None


@pytest.mark.anyio
async def test_get_product_returns_owned_product(db_session, merchant):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    result = await get_product(db_session, merchant.id, "p1")
    assert result.name == "Blue Shirt"
```

```python
# backend/tests/engine/test_tools_catalog.py
import pytest

from app.engine.schemas import GetProductAction, SearchProductsAction
from app.engine.tools.catalog import handle_get_product, handle_search_products
from app.engine.tools.errors import ActionArgumentError
from app.models.product import Product


@pytest.mark.anyio
async def test_handle_search_products(db_session, merchant, conversation):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    action = SearchProductsAction(action="search_products", query="shirt", confidence=0.9)
    result = await handle_search_products(db_session, action, merchant.id, conversation.id)
    assert result["products"][0]["id"] == "p1"


@pytest.mark.anyio
async def test_handle_get_product_returns_product(db_session, merchant, conversation):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    action = GetProductAction(action="get_product", product_id="p1", confidence=0.9)
    result = await handle_get_product(db_session, action, merchant.id, conversation.id)
    assert result["product"]["name"] == "Blue Shirt"
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/products/test_service.py tests/engine/test_tools_catalog.py -v`
Expected: FAIL — `ImportError: cannot import name 'search_products'` / `ModuleNotFoundError: No module named 'app.engine.tools.catalog'`

- [ ] **Step 3: Implement**

Append to `backend/app/domains/products/service.py` (reuses that file's existing `select`/`Product`/`ProductRead` imports):

```python
from sqlalchemy import or_


async def search_products(
    db: AsyncSession, merchant_id: str, query: str, filters: dict
) -> list[ProductRead]:
    stmt = select(Product).where(
        Product.merchant_id == merchant_id,
        or_(Product.name.ilike(f"%{query}%"), Product.aliases.any(query)),
    )
    result = await db.execute(stmt)
    return [
        ProductRead(id=p.id, merchant_id=p.merchant_id, name=p.name, aliases=p.aliases, variants=p.variants)
        for p in result.scalars().all()
    ]


async def get_product(db: AsyncSession, merchant_id: str, product_id: str) -> ProductRead | None:
    product = await db.get(Product, product_id)
    if product is None or product.merchant_id != merchant_id:
        return None
    return ProductRead(
        id=product.id, merchant_id=product.merchant_id, name=product.name,
        aliases=product.aliases, variants=product.variants,
    )
```

Note: `filters` (color/size/max_price, per PRD §14's example) is accepted for schema-compatibility with the spec's envelope but not yet applied — `Product` has no color/size/price columns to filter on (Global Constraints). This is a keyword substring/alias match, not semantic search — `ROADMAP.md`'s Phase 2 lists "Semantic/vector product search" as later work, so this intentionally does not use `Product.embedding`. `name` matches by substring (`ilike`) since customers rarely type an exact product name; `aliases` matches by exact element (`ARRAY.any()`) since aliases are merchant-curated short tags, not free text — intentionally two different match strategies, not an inconsistency.

```python
# backend/app/engine/tools/catalog.py
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.products import service as products_service
from app.engine.schemas import GetProductAction, SearchProductsAction
from app.engine.tools.registry import register_tool


@register_tool("search_products")
async def handle_search_products(
    session: AsyncSession, action: SearchProductsAction, merchant_id: str, conversation_id: str
) -> dict:
    products = await products_service.search_products(session, merchant_id, action.query, action.filters)
    return {"products": [p.model_dump() for p in products]}


@register_tool("get_product")
async def handle_get_product(
    session: AsyncSession, action: GetProductAction, merchant_id: str, conversation_id: str
) -> dict:
    # existence + merchant ownership already validated by evaluate_action (Task 3)
    product = await products_service.get_product(session, merchant_id, action.product_id)
    return {"product": product.model_dump()}
```

Update `backend/app/engine/tools/__init__.py` (created empty in Task 4) to register this module's handlers on import:

```python
# backend/app/engine/tools/__init__.py
from app.engine.tools import catalog  # noqa: F401
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/products/test_service.py tests/engine/test_tools_catalog.py -v`
Expected: PASS (8 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/products/service.py backend/app/engine/tools/catalog.py backend/app/engine/tools/__init__.py backend/tests/domains/products/test_service.py backend/tests/engine/test_tools_catalog.py
git commit -m "feat: implement search_products and get_product tool handlers"
```

---

### Task 6: `update_customer_info` handler

**Files:**
- Create: `backend/app/domains/checkout/__init__.py`
- Create: `backend/app/domains/checkout/service.py`
- Create: `backend/app/engine/tools/checkout.py`
- Test: `backend/tests/domains/checkout/test_service.py`
- Test: `backend/tests/engine/test_tools_checkout.py`

**Interfaces:**
- Consumes: `Conversation` model; `register_tool`, `ActionArgumentError` (Task 4); `UpdateCustomerInfoAction` (Task 2).
- Produces: `async def validate_delivery_area(merchant_id, address) -> dict` (`checkout/service.py` — stub; extended by Task 11 with `get_checkout_state`/`create_order`); `handle_update_customer_info` (registered handler, `tools/checkout.py` — extended by Task 11). Consumed by Task 8.

This tool is **not** one of the 6 stubbed tools: its core function (capturing and persisting customer contact info) works today against the existing `Conversation.slots` JSON bag. Only the delivery-area sub-check (SRD §29, PRD §25) is unavailable — it reports that honestly in its result rather than blocking the whole capture, per §44's "respond from actual backend state."

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/domains/checkout/test_service.py
import pytest

from app.domains.checkout.service import validate_delivery_area


@pytest.mark.anyio
async def test_validate_delivery_area_reports_unavailable():
    result = await validate_delivery_area("merchant-1", "Nasr City")
    assert result == {"status": "unavailable", "reason": "delivery_service_not_built"}
```

```python
# backend/tests/engine/test_tools_checkout.py
import pytest

from app.engine.schemas import UpdateCustomerInfoAction
from app.engine.tools.checkout import handle_update_customer_info
from app.engine.tools.errors import ActionArgumentError


@pytest.mark.anyio
async def test_handle_update_customer_info_captures_fields(db_session, merchant, conversation):
    action = UpdateCustomerInfoAction(
        action="update_customer_info", name="Sara", phone="01012345678",
        address="Nasr City", confidence=0.9,
    )
    result = await handle_update_customer_info(db_session, action, merchant.id, conversation.id)

    assert result["captured"] == {"name": "Sara", "phone": "01012345678", "address": "Nasr City"}
    assert result["delivery_validation"]["status"] == "unavailable"

    await db_session.refresh(conversation)
    assert conversation.slots["customer_name"] == "Sara"
    assert conversation.slots["customer_phone"] == "01012345678"


@pytest.mark.anyio
async def test_handle_update_customer_info_rejects_bad_phone(db_session, merchant, conversation):
    action = UpdateCustomerInfoAction(
        action="update_customer_info", phone="not-a-phone", confidence=0.9,
    )
    with pytest.raises(ActionArgumentError):
        await handle_update_customer_info(db_session, action, merchant.id, conversation.id)


@pytest.mark.anyio
async def test_handle_update_customer_info_partial_update_preserves_existing_slots(
    db_session, merchant, conversation
):
    conversation.slots = {"customer_name": "Existing Name"}
    await db_session.flush()

    action = UpdateCustomerInfoAction(action="update_customer_info", phone="01098765432", confidence=0.9)
    await handle_update_customer_info(db_session, action, merchant.id, conversation.id)

    await db_session.refresh(conversation)
    assert conversation.slots["customer_name"] == "Existing Name"
    assert conversation.slots["customer_phone"] == "01098765432"
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.domains.checkout'`

- [ ] **Step 3: Implement**

```python
# backend/app/domains/checkout/service.py
async def validate_delivery_area(merchant_id: str, address: str | None) -> dict:
    """Stub. Delivery Service (SRD S29) does not exist yet - see ROADMAP.md
    'Delivery service'. Always reports unavailable rather than guessing a
    fee/area match, per SRD S44 (never claim a value the backend can't verify)."""
    return {"status": "unavailable", "reason": "delivery_service_not_built"}
```

`backend/app/domains/checkout/__init__.py` stays empty.

```python
# backend/app/engine/tools/checkout.py
import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.checkout import service as checkout_service
from app.engine.schemas import UpdateCustomerInfoAction
from app.engine.tools.errors import ActionArgumentError
from app.engine.tools.registry import register_tool
from app.models.conversation import Conversation

_EGYPT_MOBILE_RE = re.compile(r"^01[0125]\d{8}$")


@register_tool("update_customer_info")
async def handle_update_customer_info(
    session: AsyncSession, action: UpdateCustomerInfoAction, merchant_id: str, conversation_id: str
) -> dict:
    if action.phone and not _EGYPT_MOBILE_RE.match(action.phone):
        raise ActionArgumentError([f"phone {action.phone!r} is not a valid Egyptian mobile number"])

    conversation = await session.get(Conversation, conversation_id)
    # Reassign the whole dict, don't mutate in place — SQLAlchemy's JSON column
    # type does not detect in-place `.update()`/`[key] =` writes as a change,
    # so an in-place mutation here would silently never be persisted.
    slots = dict(conversation.slots)
    captured: dict[str, str] = {}
    for field, value in (("name", action.name), ("phone", action.phone), ("address", action.address)):
        if value:
            slots[f"customer_{field}"] = value
            captured[field] = value
    conversation.slots = slots

    delivery = await checkout_service.validate_delivery_area(merchant_id, action.address)
    return {"captured": captured, "delivery_validation": delivery}
```

Add one line to `backend/app/engine/tools/__init__.py` (Task 5 added the first):

```python
from app.engine.tools import checkout  # noqa: F401
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/checkout/__init__.py backend/app/domains/checkout/service.py backend/app/engine/tools/checkout.py backend/app/engine/tools/__init__.py backend/tests/domains/checkout/test_service.py backend/tests/engine/test_tools_checkout.py
git commit -m "feat: implement update_customer_info tool handler"
```

---

## Phase 3 — Pipeline Integration

### Task 7: Action prompt composition

**Files:**
- Modify: `backend/app/engine/prompts.py`
- Modify: `backend/app/engine/context_budget.py`
- Test: `backend/tests/engine/test_prompts.py` (extend if it exists, else create)

**Interfaces:**
- Consumes: `build_system_prompt(*, task_block, merchant_name, conv_state, slots)` (existing); `build_context_prompt(history, slots, current_text, max_turns, examples=None, mode="intent")` (existing).
- Produces: `ACTION_TASK_BLOCK` constant (`prompts.py`); `build_context_prompt(..., mode="action")` branch (`context_budget.py`). Consumed by Task 8.

**Before writing:** open `context_budget.py` and confirm the exact shape of the existing `mode="intent"`/`mode="extraction"` branches (Agent research described them as controlling few-shot formatting and a trailing `"customer: ... -> {mode}:"` cue line, but did not quote the literal source) — mirror that formatting exactly for the new `mode="action"` branch rather than inventing a divergent shape.

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/engine/test_prompts.py — add this test (create the file with this
# one test if the file doesn't already exist for prompts.py)
from app.engine.context_budget import build_context_prompt
from app.engine.prompts import ACTION_TASK_BLOCK, build_system_prompt


def test_action_task_block_lists_all_nine_actions():
    for name in (
        "search_products", "get_product", "add_to_cart", "update_cart",
        "remove_from_cart", "get_checkout_state", "update_customer_info",
        "create_order", "search_store_knowledge",
    ):
        assert name in ACTION_TASK_BLOCK


def test_build_system_prompt_accepts_action_task_block():
    prompt = build_system_prompt(
        task_block=ACTION_TASK_BLOCK, merchant_name="Test Shop",
        conv_state="GATHERING", slots={},
    )
    assert "Test Shop" in prompt
    assert "search_products" in prompt


def test_build_context_prompt_action_mode_runs():
    prompt = build_context_prompt([], {}, "عايز اشوف الاحذية", max_turns=10, mode="action")
    assert "عايز اشوف الاحذية" in prompt
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/engine/test_prompts.py -v`
Expected: FAIL — `ImportError: cannot import name 'ACTION_TASK_BLOCK' from 'app.engine.prompts'`

- [ ] **Step 3: Implement**

Append to `backend/app/engine/prompts.py`, next to the existing `CLASSIFICATION_TASK_BLOCK`/`EXTRACTION_TASK_BLOCK` constants:

```python
ACTION_TASK_BLOCK = """
TASK: Decide the single best next action for this customer message.

Available actions (respond with exactly one action, matching its argument shape):
1. search_products(query, filters) - customer is browsing or looking for products
2. get_product(product_id) - customer asked about one specific, already-known product
3. add_to_cart(product_id, quantity, notes) - customer wants to add an item
4. update_cart(line_item_id, quantity) - customer wants to change a quantity already in their cart
5. remove_from_cart(line_item_id) - customer wants to remove an item from their cart
6. get_checkout_state() - customer is asking what's in their cart or order so far
7. update_customer_info(name, phone, address) - customer gave contact or delivery info
8. create_order(confirm) - customer explicitly confirmed they want to place the order
9. search_store_knowledge(query, knowledge_type) - customer asked about policy, FAQ, shipping, or returns

CRITICAL RULES:
1. Choose exactly one action per turn - never propose more than one.
2. Only propose an action you have enough information for; if a required
   field is missing, ask the customer for it in a normal reply instead of
   guessing.
3. Never invent a product_id or line_item_id - only use IDs that appeared
   earlier in this conversation's context.
4. confidence reflects how sure you are this is the right action to take,
   not how sure you are it will succeed - the backend independently
   validates and executes every action.
""".strip()
```

Modify `backend/app/engine/context_budget.py`'s `build_context_prompt` to add a third mode branch alongside the existing `"intent"`/`"extraction"` branches, following their exact formatting convention (few-shot example formatting + the trailing cue line, adapted to end with `"-> action:"` instead of `"-> intent:"`/`"-> extraction:"`).

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/engine/test_prompts.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/prompts.py backend/app/engine/context_budget.py backend/tests/engine/test_prompts.py
git commit -m "feat: add action task block and action mode to prompt builders"
```

---

### Task 8: `resolve_action` pipeline function

**Files:**
- Create: `backend/app/engine/action_resolution.py`
- Test: `backend/tests/engine/test_action_resolution.py`

**Interfaces:**
- Consumes: `build_system_prompt`, `ACTION_TASK_BLOCK`, `build_context_prompt(..., mode="action")` (Task 7); `ProposedActionEnvelope` (Task 2); `dispatch_action`, `ActionOutcome` (Task 4); `deepseek_provider`, `gateway.complete`, `AICallError` (existing `gateway.py`/`clients.py`).
- Produces: `ActionResolution(proposed_action, outcome, response_text, escalation_reason)`; `async def resolve_action(session, conversation, message) -> ActionResolution`. Consumed by Task 9.

**Before writing:** confirm `gateway.complete()`'s exact parameter names against its current definition and against how `classification.py` calls it — mirror that call shape exactly rather than guessing at names. The retry-once-on-invalid-JSON behavior (§44) should reuse whatever `AICallError`-handling pattern `classification.py`/`extraction.py` already use, not a new one.

The tests below use a `message` fixture that is **not** confirmed to exist in `tests/conftest.py` (only `db_session`/`merchant`/`conversation`/`mock_ai` are confirmed — see `CLAUDE.md`'s Testing section). Check first. If absent, add one to `conftest.py` alongside the existing `conversation` fixture, confirming `Message`'s actual required columns against `app/models/message.py` before writing it (Agent research confirmed `message.intent`, `.intent_confidence`, `.model_tier`, `.escalation_reason` are real fields via `pipeline.py`'s usage, but not the exact text-content field name or full required-column list) — something in the shape of:

```python
# tests/conftest.py — add if not already present
@pytest.fixture
async def message(db_session, conversation):
    msg = Message(
        id=new_id(), conversation_id=conversation.id, direction=Direction.INBOUND,
        text="عايز اشوف الاحذية",  # confirm this is the real column name before using it
    )
    db_session.add(msg)
    await db_session.flush()
    return msg
```

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/engine/test_action_resolution.py
import pytest

from app.engine.action_resolution import resolve_action
from app.models.product import Product


@pytest.mark.anyio
async def test_resolve_action_executes_search_products(db_session, merchant, conversation, message, mock_ai):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    mock_ai.deepseek_json(
        {"action": "search_products", "query": "shirt", "filters": {}, "confidence": 0.92}
    )

    resolution = await resolve_action(db_session, conversation, message)

    assert resolution.outcome.status == "executed"
    assert resolution.escalation_reason is None
    assert "Blue Shirt" in resolution.response_text


@pytest.mark.anyio
async def test_resolve_action_escalates_on_rejected_action(db_session, merchant, conversation, message, mock_ai):
    mock_ai.deepseek_json(
        {"action": "get_product", "product_id": "does-not-exist", "confidence": 0.9}
    )

    resolution = await resolve_action(db_session, conversation, message)

    assert resolution.outcome.status == "rejected"
    assert resolution.escalation_reason == "action_rejected:product_not_found"


@pytest.mark.anyio
async def test_resolve_action_escalates_on_unavailable_tool(db_session, merchant, conversation, message, mock_ai):
    mock_ai.deepseek_json({"action": "get_checkout_state", "confidence": 0.9})

    resolution = await resolve_action(db_session, conversation, message)

    assert resolution.outcome.status == "failed"
    assert resolution.escalation_reason == "tool_unavailable:get_checkout_state"
    assert "team" in resolution.response_text.lower() or "help" in resolution.response_text.lower()


@pytest.mark.anyio
async def test_resolve_action_escalates_on_invalid_json_after_retry(db_session, merchant, conversation, message, mock_ai):
    mock_ai.deepseek_raw("not valid json", times=2)

    resolution = await resolve_action(db_session, conversation, message)

    assert resolution.proposed_action is None
    assert resolution.escalation_reason == "ai_call_failed"
```

Note: `mock_ai.deepseek_json(...)`/`mock_ai.deepseek_raw(..., times=N)` are illustrative calls against the existing `mock_ai` respx fixture (`tests/conftest.py`) — confirm its actual helper method names against `tests/engine/test_classification.py` or similar existing usage and adjust these calls to match; the fixture's mocking mechanics are already established, only the exact method name needs verifying.

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/engine/test_action_resolution.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.engine.action_resolution'`

- [ ] **Step 3: Implement**

```python
# backend/app/engine/action_resolution.py
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.context_budget import build_context_prompt
from app.engine.gateway import AICallError, complete, deepseek_provider
from app.engine.prompts import ACTION_TASK_BLOCK, build_system_prompt
from app.engine.schemas import ProposedActionEnvelope
from app.engine.tools.registry import ActionOutcome, dispatch_action
from app.models.conversation import Conversation
from app.models.message import Message


@dataclass(frozen=True)
class ActionResolution:
    proposed_action: object | None
    outcome: ActionOutcome | None
    response_text: str
    escalation_reason: str | None


def _render_response(outcome: ActionOutcome, action) -> str:
    if outcome.status == "rejected":
        reason = outcome.errors[0].message if outcome.errors else "that wasn't a valid request"
        return f"Sorry, I couldn't do that — {reason}."
    if outcome.status == "failed":
        return "I can't complete that yet — let me get a teammate to help you with this."
    if action.action == "search_products":
        products = outcome.result.get("products", [])
        if not products:
            return "I couldn't find any products matching that."
        names = ", ".join(p["name"] for p in products[:5])
        return f"Found {len(products)} product(s): {names}"
    if action.action == "get_product":
        return outcome.result["product"]["name"]
    if action.action == "update_customer_info":
        note = ""
        if outcome.result["delivery_validation"]["status"] == "unavailable":
            note = " I'll confirm the delivery fee for your area separately."
        return "Got it, saved your info." + note
    return "Done."


async def resolve_action(session: AsyncSession, conversation: Conversation, message: Message) -> ActionResolution:
    history = []  # confirm against pipeline.py's existing history-loading query and reuse it verbatim
    prompt = build_context_prompt(
        history, conversation.slots, message.text, max_turns=10, mode="action"
    )
    system_prompt = build_system_prompt(
        task_block=ACTION_TASK_BLOCK, merchant_name="",  # confirm merchant_name lookup against pipeline.py's existing _merchant_name query
        conv_state=conversation.state, slots=conversation.slots,
    )

    provider = deepseek_provider()
    envelope = None
    for _attempt in range(2):  # S44: retry once on invalid JSON, then escalate
        try:
            envelope = await complete(
                provider, system_prompt=system_prompt, user_prompt=prompt,
                schema_model=ProposedActionEnvelope, schema_name="ProposedAction",
            )
            break
        except AICallError:
            continue

    if envelope is None:
        return ActionResolution(
            proposed_action=None, outcome=None,
            response_text="Let me get a teammate to help with this.",
            escalation_reason="ai_call_failed",
        )

    action = envelope.root
    outcome = await dispatch_action(
        session, action, merchant_id=conversation.merchant_id,
        conversation_id=conversation.id, message_id=message.id,
    )

    escalation_reason = None
    if outcome.status == "rejected":
        escalation_reason = f"action_rejected:{outcome.errors[0].code}"
    elif outcome.status == "failed":
        escalation_reason = f"tool_unavailable:{action.action}"

    return ActionResolution(
        proposed_action=action, outcome=outcome,
        response_text=_render_response(outcome, action),
        escalation_reason=escalation_reason,
    )
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/engine/test_action_resolution.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/action_resolution.py backend/tests/engine/test_action_resolution.py
git commit -m "feat: add resolve_action pipeline function with retry-then-escalate"
```

---

### Task 9: Wire entry points — lock coverage and opt-in trigger

**Files:**
- Modify: `backend/app/engine/pipeline.py`
- Modify: `backend/app/domains/messages/service.py`
- Test: `backend/tests/engine/test_pipeline.py` (extend existing)

**Interfaces:**
- Consumes: `resolve_action` (Task 8); `Merchant.ai_tool_ordering_enabled` (Task 1); `conversation_lock` (`app/core/locks.py`, existing); `get_arq_pool` (`app/core/redis.py`, existing).
- Produces: `process_message`'s new internal branch (same signature as today: `process_message(session, conversation, message) -> PipelineResult` — confirm `PipelineResult`'s exact current fields before extending it, and add a field for the action resolution rather than assuming its current shape); lock coverage on the HTTP path. Consumed by: nothing further — this is the top-level integration point.

**Before writing:** open `pipeline.py` and find the exact point where `classification.intent == "purchase_intent"` currently gates the call to `extract_order` — the new branch replaces that call, for opted-in merchants only, with a call to `resolve_action`. Also open `messages/service.py` (or wherever `process_message` is invoked on the HTTP path — Agent research placed the `Message` construction at `messages/service.py:23-30`) and `worker.py:24`'s existing `conversation_lock` usage, to mirror it exactly.

- [ ] **Step 1: Write the failing tests**

```python
# add to backend/tests/engine/test_pipeline.py
import pytest
from sqlalchemy import select

from app.models.ai_action import AIAction
from app.models.merchant import Merchant


@pytest.mark.anyio
async def test_process_message_uses_extraction_by_default(db_session, merchant, conversation, message, mock_ai):
    assert merchant.ai_tool_ordering_enabled is False
    mock_ai.deepseek_json({"intent": "purchase_intent", "confidence": 0.9})
    mock_ai.deepseek_json({"line_items": [], "confidence": 0.9, "ambiguous_fields": []})

    result = await process_message(db_session, conversation, message)

    # Proves the extraction path ran unchanged, not just that something returned:
    # resolve_action was never called, so no AIAction audit row exists for this
    # conversation at all.
    assert result.action_resolution is None
    rows = (
        await db_session.execute(select(AIAction).where(AIAction.conversation_id == conversation.id))
    ).scalars().all()
    assert rows == []


@pytest.mark.anyio
async def test_process_message_uses_resolve_action_when_opted_in(db_session, merchant, conversation, message, mock_ai):
    merchant.ai_tool_ordering_enabled = True
    await db_session.flush()
    mock_ai.deepseek_json({"intent": "purchase_intent", "confidence": 0.9})
    mock_ai.deepseek_json({"action": "get_checkout_state", "confidence": 0.9})

    result = await process_message(db_session, conversation, message)

    assert result.action_resolution is not None
    assert result.action_resolution.outcome.status == "failed"
```

Confirm `process_message`'s import path and `PipelineResult`'s current fields against the live `pipeline.py` before finalizing these assertions — the field name `action_resolution` is this plan's proposal, not a confirmed existing field.

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py -v`
Expected: FAIL — `AttributeError` (no `ai_tool_ordering_enabled` branch / no `action_resolution` field yet)

- [ ] **Step 3: Implement**

In `pipeline.py`, at the point where the extraction gate currently checks `classification.intent == "purchase_intent" and conversation.state in (GATHERING, CONFIRMING)`, branch on the merchant flag before falling into the existing extraction call:

```python
if classification.intent == "purchase_intent" and conversation.state in (ConvState.GATHERING, ConvState.CONFIRMING):
    merchant = await session.get(Merchant, conversation.merchant_id)
    if merchant.ai_tool_ordering_enabled:
        action_resolution = await resolve_action(session, conversation, message)
        message.escalation_reason = action_resolution.escalation_reason
        await session.flush()
        return PipelineResult(..., action_resolution=action_resolution)  # extend with existing required fields
    # existing extraction call, unchanged, for merchants that have not opted in
    ...
```

Add `action_resolution: ActionResolution | None = None` to `PipelineResult` (confirm it's a dataclass/BaseModel and match that style) so existing callers that don't inspect the new field are unaffected.

In `messages/service.py`, wrap the existing call to `process_message` with the same lock `worker.py:24` already uses:

```python
from app.core.locks import conversation_lock
from app.core.redis import get_arq_pool

...
pool = await get_arq_pool()
async with conversation_lock(pool, conversation.id):
    result = await process_message(session, conversation, message)
```

matching `worker.py`'s existing `_process_channel_message` usage exactly, so both entry points now hold the per-conversation lock for the entire duration of `process_message` — closing the §36 gap identified in Global Constraints.

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py -v`
Expected: PASS

- [ ] **Step 5: Run the full existing pipeline + messages + worker test suites to confirm no regression**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py tests/domains/messages/ -v`
Expected: all PASS — the default-`False` flag means every existing test's behavior is unchanged.

- [ ] **Step 6: Commit**

```bash
git add backend/app/engine/pipeline.py backend/app/domains/messages/service.py backend/tests/engine/test_pipeline.py
git commit -m "feat: wire resolve_action into process_message behind merchant opt-in flag, fix HTTP-path lock coverage"
```

---

## Phase 4 — Stubbed Tools (contract + validation + tests, real seam, deferred business logic)

Every handler in this phase follows the same shape: the domain-service stub raises the standard-library `NotImplementedError` (no new coupling from `app/domains/` back to `app/engine/`); the tool handler in `app/engine/tools/` catches it and re-raises `ToolUnavailableError` (Task 4), which `dispatch_action` records as `status="failed"` and turns into an honest "not available yet" response (Task 8) — this is §44 compliance, not a placeholder. Where the validator (Task 3) can meaningfully check something (`add_to_cart`'s `product_id`), it still does, so a malformed action is genuinely `"rejected"`, distinct from a well-formed one that is `"failed"` because the backend doesn't exist yet.

### Task 10: Cart tools — `add_to_cart`, `update_cart`, `remove_from_cart`

**Files:**
- Create: `backend/app/domains/cart/__init__.py`
- Create: `backend/app/domains/cart/service.py`
- Create: `backend/app/engine/tools/cart.py`
- Test: `backend/tests/domains/cart/test_service.py`
- Test: `backend/tests/engine/test_tools_cart.py`

**Interfaces:**
- Consumes: `register_tool`, `ToolUnavailableError` (Task 4); `AddToCartAction`, `UpdateCartAction`, `RemoveFromCartAction` (Task 2).
- Produces: `cart_service.add_item/update_item/remove_item` (all raise `NotImplementedError`); `handle_add_to_cart`, `handle_update_cart`, `handle_remove_from_cart` (registered handlers). Consumed by Task 8 via the registry.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/domains/cart/test_service.py
import pytest

from app.domains.cart.service import add_item, remove_item, update_item


@pytest.mark.anyio
async def test_add_item_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await add_item("m1", "c1", "p1", 2)


@pytest.mark.anyio
async def test_update_item_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await update_item("m1", "c1", "li1", 3)


@pytest.mark.anyio
async def test_remove_item_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await remove_item("m1", "c1", "li1")
```

```python
# backend/tests/engine/test_tools_cart.py
import pytest

from app.engine.schemas import AddToCartAction, RemoveFromCartAction, UpdateCartAction
from app.engine.tools.cart import handle_add_to_cart, handle_remove_from_cart, handle_update_cart
from app.engine.tools.errors import ToolUnavailableError
from app.models.product import Product


@pytest.mark.anyio
async def test_handle_add_to_cart_raises_tool_unavailable(db_session, merchant, conversation):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Shoes", aliases=[]))
    await db_session.flush()
    action = AddToCartAction(action="add_to_cart", product_id="p1", quantity=1, confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_add_to_cart(db_session, action, merchant.id, conversation.id)


@pytest.mark.anyio
async def test_handle_update_cart_raises_tool_unavailable(db_session, merchant, conversation):
    action = UpdateCartAction(action="update_cart", line_item_id="li1", quantity=2, confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_update_cart(db_session, action, merchant.id, conversation.id)


@pytest.mark.anyio
async def test_handle_remove_from_cart_raises_tool_unavailable(db_session, merchant, conversation):
    action = RemoveFromCartAction(action="remove_from_cart", line_item_id="li1", confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_remove_from_cart(db_session, action, merchant.id, conversation.id)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/cart/test_service.py tests/engine/test_tools_cart.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.domains.cart'`

- [ ] **Step 3: Implement**

```python
# backend/app/domains/cart/service.py
_UNAVAILABLE_MSG = (
    "cart storage (SRD S25 Cart/CartItem) does not exist yet - "
    "see ROADMAP.md 'Cart & checkout services'"
)


async def add_item(merchant_id: str, conversation_id: str, product_id: str, quantity: float) -> None:
    raise NotImplementedError(_UNAVAILABLE_MSG)


async def update_item(merchant_id: str, conversation_id: str, line_item_id: str, quantity: float) -> None:
    raise NotImplementedError(_UNAVAILABLE_MSG)


async def remove_item(merchant_id: str, conversation_id: str, line_item_id: str) -> None:
    raise NotImplementedError(_UNAVAILABLE_MSG)
```

`backend/app/domains/cart/__init__.py` stays empty.

```python
# backend/app/engine/tools/cart.py
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.cart import service as cart_service
from app.engine.schemas import AddToCartAction, RemoveFromCartAction, UpdateCartAction
from app.engine.tools.errors import ToolUnavailableError
from app.engine.tools.registry import register_tool


@register_tool("add_to_cart")
async def handle_add_to_cart(
    session: AsyncSession, action: AddToCartAction, merchant_id: str, conversation_id: str
) -> dict:
    # product existence + merchant ownership already validated by evaluate_action (Task 3)
    try:
        await cart_service.add_item(merchant_id, conversation_id, action.product_id, action.quantity)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc
    return {}


@register_tool("update_cart")
async def handle_update_cart(
    session: AsyncSession, action: UpdateCartAction, merchant_id: str, conversation_id: str
) -> dict:
    try:
        await cart_service.update_item(merchant_id, conversation_id, action.line_item_id, action.quantity)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc
    return {}


@register_tool("remove_from_cart")
async def handle_remove_from_cart(
    session: AsyncSession, action: RemoveFromCartAction, merchant_id: str, conversation_id: str
) -> dict:
    try:
        await cart_service.remove_item(merchant_id, conversation_id, action.line_item_id)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc
    return {}
```

Add one line to `backend/app/engine/tools/__init__.py` (Tasks 5 and 6 added the first two):

```python
from app.engine.tools import cart  # noqa: F401
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/cart/test_service.py tests/engine/test_tools_cart.py -v`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/cart/ backend/app/engine/tools/cart.py backend/app/engine/tools/__init__.py backend/tests/domains/cart/test_service.py backend/tests/engine/test_tools_cart.py
git commit -m "feat: add cart tool contracts with stubbed backing service"
```

---

### Task 11: Checkout tools — `get_checkout_state`, `create_order`

**Files:**
- Modify: `backend/app/domains/checkout/service.py`
- Modify: `backend/app/engine/tools/checkout.py`
- Modify: `backend/tests/domains/checkout/test_service.py`
- Modify: `backend/tests/engine/test_tools_checkout.py`

**Interfaces:**
- Consumes: `register_tool`, `ToolUnavailableError` (Task 4); `GetCheckoutStateAction`, `CreateOrderAction` (Task 2); `validate_delivery_area` (Task 6, unchanged).
- Produces: `checkout_service.get_checkout_state`, `checkout_service.create_order` (both raise `NotImplementedError`); `handle_get_checkout_state`, `handle_create_order` (registered handlers). Consumed by Task 8.

- [ ] **Step 1: Write the failing tests**

```python
# add to backend/tests/domains/checkout/test_service.py
from app.domains.checkout.service import create_order, get_checkout_state


@pytest.mark.anyio
async def test_get_checkout_state_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await get_checkout_state("m1", "c1")


@pytest.mark.anyio
async def test_create_order_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await create_order("m1", "c1", True)
```

```python
# add to backend/tests/engine/test_tools_checkout.py
from app.engine.schemas import CreateOrderAction, GetCheckoutStateAction
from app.engine.tools.checkout import handle_create_order, handle_get_checkout_state
from app.engine.tools.errors import ToolUnavailableError


@pytest.mark.anyio
async def test_handle_get_checkout_state_raises_tool_unavailable(db_session, merchant, conversation):
    action = GetCheckoutStateAction(action="get_checkout_state", confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_get_checkout_state(db_session, action, merchant.id, conversation.id)


@pytest.mark.anyio
async def test_handle_create_order_raises_tool_unavailable(db_session, merchant, conversation):
    action = CreateOrderAction(action="create_order", confirm=True, confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_create_order(db_session, action, merchant.id, conversation.id)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: FAIL — `ImportError: cannot import name 'get_checkout_state'`

- [ ] **Step 3: Implement**

Append to `backend/app/domains/checkout/service.py`:

```python
async def get_checkout_state(merchant_id: str, conversation_id: str) -> dict:
    raise NotImplementedError(
        "checkout state requires a Cart (SRD S25) which does not exist yet - "
        "see ROADMAP.md 'Cart & checkout services'"
    )


async def create_order(merchant_id: str, conversation_id: str, confirm: bool) -> dict:
    raise NotImplementedError(
        "create_order requires cart/pricing/order-number support (SRD S26-27) "
        "which does not exist yet - see ROADMAP.md 'Cart & checkout services' / "
        "'Order service hardening'. The Order model exists, but S26's "
        "responsibilities (validate cart, snapshot prices, generate order "
        "number) all need fields Order does not have yet - creating a row "
        "without them would be a semantically-incomplete order, not a real one."
    )
```

Append to `backend/app/engine/tools/checkout.py` (add `CreateOrderAction`, `GetCheckoutStateAction` to that file's existing import from `app.engine.schemas`):

```python
@register_tool("get_checkout_state")
async def handle_get_checkout_state(
    session: AsyncSession, action: GetCheckoutStateAction, merchant_id: str, conversation_id: str
) -> dict:
    try:
        return await checkout_service.get_checkout_state(merchant_id, conversation_id)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc


@register_tool("create_order")
async def handle_create_order(
    session: AsyncSession, action: CreateOrderAction, merchant_id: str, conversation_id: str
) -> dict:
    try:
        return await checkout_service.create_order(merchant_id, conversation_id, action.confirm)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc
```

(also add `from app.engine.tools.errors import ToolUnavailableError` to `checkout.py`'s imports if Task 6 didn't already need it)

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/checkout/test_service.py tests/engine/test_tools_checkout.py -v`
Expected: PASS (8 passed total across both files)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/checkout/service.py backend/app/engine/tools/checkout.py backend/tests/domains/checkout/test_service.py backend/tests/engine/test_tools_checkout.py
git commit -m "feat: add checkout-state and create-order tool contracts with stubbed backing service"
```

---

### Task 12: `search_store_knowledge` handler

**Files:**
- Create: `backend/app/domains/store_knowledge/__init__.py`
- Create: `backend/app/domains/store_knowledge/service.py`
- Create: `backend/app/engine/tools/knowledge.py`
- Test: `backend/tests/domains/store_knowledge/test_service.py`
- Test: `backend/tests/engine/test_tools_knowledge.py`

**Interfaces:**
- Consumes: `register_tool`, `ToolUnavailableError` (Task 4); `SearchStoreKnowledgeAction` (Task 2).
- Produces: `knowledge_service.search` (raises `NotImplementedError`); `handle_search_store_knowledge` (registered handler). Consumed by Task 8.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/domains/store_knowledge/test_service.py
import pytest

from app.domains.store_knowledge.service import search


@pytest.mark.anyio
async def test_search_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await search("m1", "return policy", "faq")
```

```python
# backend/tests/engine/test_tools_knowledge.py
import pytest

from app.engine.schemas import SearchStoreKnowledgeAction
from app.engine.tools.errors import ToolUnavailableError
from app.engine.tools.knowledge import handle_search_store_knowledge


@pytest.mark.anyio
async def test_handle_search_store_knowledge_raises_tool_unavailable(db_session, merchant, conversation):
    action = SearchStoreKnowledgeAction(action="search_store_knowledge", query="return policy", confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_search_store_knowledge(db_session, action, merchant.id, conversation.id)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/domains/store_knowledge/test_service.py tests/engine/test_tools_knowledge.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.domains.store_knowledge'`

- [ ] **Step 3: Implement**

```python
# backend/app/domains/store_knowledge/service.py
async def search(merchant_id: str, query: str, knowledge_type: str | None) -> list[dict]:
    raise NotImplementedError(
        "StoreKnowledge (SRD S23) does not exist yet - see ROADMAP.md 'Store knowledge retrieval'"
    )
```

`backend/app/domains/store_knowledge/__init__.py` stays empty.

```python
# backend/app/engine/tools/knowledge.py
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.store_knowledge import service as knowledge_service
from app.engine.schemas import SearchStoreKnowledgeAction
from app.engine.tools.errors import ToolUnavailableError
from app.engine.tools.registry import register_tool


@register_tool("search_store_knowledge")
async def handle_search_store_knowledge(
    session: AsyncSession, action: SearchStoreKnowledgeAction, merchant_id: str, conversation_id: str
) -> dict:
    try:
        results = await knowledge_service.search(merchant_id, action.query, action.knowledge_type)
    except NotImplementedError as exc:
        raise ToolUnavailableError(str(exc)) from exc
    return {"results": results}
```

Add the fourth and final line to `backend/app/engine/tools/__init__.py`:

```python
from app.engine.tools import knowledge  # noqa: F401
```

`tools/__init__.py` now reads, in full:

```python
# backend/app/engine/tools/__init__.py
from app.engine.tools import cart, catalog, checkout, knowledge  # noqa: F401
```

(the four imports may be added in any order across Tasks 5/6/10/12 — this is the complete file once all four have landed)

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/domains/store_knowledge/test_service.py tests/engine/test_tools_knowledge.py -v`
Expected: PASS (2 passed)

- [ ] **Step 5: Run the complete Phase 1-4 test suite together to confirm every tool is actually reachable through `dispatch_action` now that `tools/__init__.py` imports all four handler modules**

Run: `cd backend && uv run pytest tests/engine/ tests/domains/ -v`
Expected: all PASS, including Task 4's `test_dispatch_executes_approved_action` still passing via its `monkeypatch` override (unaffected by real registrations) and Task 8/9's tests (once those land) resolving real handlers with no manual registration.

- [ ] **Step 6: Commit**

```bash
git add backend/app/domains/store_knowledge/ backend/app/engine/tools/knowledge.py backend/app/engine/tools/__init__.py backend/tests/domains/store_knowledge/test_service.py backend/tests/engine/test_tools_knowledge.py
git commit -m "feat: add search_store_knowledge tool contract with stubbed backing service"
```

---

## Phase 5 — Verification & Docs

### Task 13: Full-suite verification and documentation sweep

**Files:**
- Modify: `README.md`
- Modify: `ROADMAP.md`

**Interfaces:**
- Consumes: nothing new — this task only verifies and documents what Tasks 1-12 built.

- [ ] **Step 1: Update `README.md`'s Status section**

Move the tool-layer line from "Not yet built" to "Built", replacing:

```
- AI action validator + tool layer (`search_products`, `add_to_cart`, etc. per SRD §21)
```

with, under the **Built** list:

```
- **AI action validator + tool layer** — `search_products`/`get_product`/`update_customer_info` fully functional; `add_to_cart`/`update_cart`/`remove_from_cart`/`get_checkout_state`/`create_order`/`search_store_knowledge` fully validated and audited (`AIAction`) but stubbed pending Cart/Order/StoreKnowledge services. Opt-in per merchant via `Merchant.ai_tool_ordering_enabled` (off by default); the existing classify→extract→auto-order flow is unchanged for merchants that don't opt in. (SRD §20-21, PRD §14-15)
```

- [ ] **Step 2: Update `ROADMAP.md`**

Replace the near-term bullet:

```
- **AI action validator + tool layer** — `search_products`, `get_product`, `add_to_cart`, `update_cart`, `remove_from_cart`, `get_checkout_state`, `update_customer_info`, `create_order`, `search_store_knowledge` (SRD §21, PRD §15)
```

with:

```
- ~~**AI action validator + tool layer**~~ **Built** — validator, registry, `AIAction` audit trail, and all 9 tool contracts exist; `search_products`/`get_product`/`update_customer_info` are functional, the other 6 are validated-and-audited but stubbed pending the items below (SRD §21, PRD §15)
```

Leave the "Cart & checkout services", "Order service hardening", "Store knowledge retrieval", and "Multi-tenancy" bullets unchanged — they remain genuinely not built.

- [ ] **Step 3: Run the full backend test suite**

Run: `cd backend && make test`
Expected: all tests pass, including every test file from Tasks 1-12 and the full pre-existing suite (no regressions).

- [ ] **Step 4: Run lint**

Run: `cd backend && make lint`
Expected: no errors.

- [ ] **Step 5: Boot check**

Run: `cd backend && make dev` (then Ctrl-C once it reports startup)
Expected: server starts cleanly — confirms the new imports (`app/engine/tools/`, `app/domains/cart/`, `app/domains/checkout/`, `app/domains/store_knowledge/`) don't break app startup even though none of them are mounted as HTTP routers.

- [ ] **Step 6: Commit**

```bash
git add README.md ROADMAP.md
git commit -m "docs: mark AI action validator and tool layer as built"
```

---

## Verification

**Per-phase:**
- Phase 1: `uv run pytest tests/models/test_ai_action.py tests/engine/test_action_schemas.py tests/engine/test_action_validator.py tests/engine/test_tool_registry.py -v` — audit model, schemas, validator, and dispatch all pass in isolation, no DB/network beyond `db_session`/`merchant`/`conversation` fixtures.
- Phase 2: `uv run pytest tests/domains/products/test_service.py tests/domains/checkout/test_service.py tests/engine/test_tools_catalog.py tests/engine/test_tools_checkout.py -v` — `search_products`, `get_product`, `update_customer_info` all functional against real data.
- Phase 3: `uv run pytest tests/engine/test_prompts.py tests/engine/test_action_resolution.py tests/engine/test_pipeline.py -v` — action resolution works end-to-end against mocked AI, and the existing extraction path is provably unchanged for `ai_tool_ordering_enabled=False` merchants (the default).
- Phase 4: `uv run pytest tests/domains/cart/ tests/domains/checkout/ tests/domains/store_knowledge/ tests/engine/test_tools_cart.py tests/engine/test_tools_checkout.py tests/engine/test_tools_knowledge.py -v` — all 6 stubbed tools reject bad input where checkable and fail safely (never silently, never claiming success) where the backing service doesn't exist.

**End to end:**
1. `make upgrade` — migration applies, `ai_actions` table and `merchants.ai_tool_ordering_enabled` both exist.
2. `make test` — full suite green.
3. `make lint` — clean.
4. Manually flip `ai_tool_ordering_enabled=True` for the seeded demo merchant (`make seed`), send a `POST /messages` with a product-search-shaped message, and confirm via `psql` that an `ai_actions` row was written with `status="executed"` and the response text names a real product from the seed data.
5. Repeat with a cart-shaped message (e.g. "add 2 to my cart") and confirm the `ai_actions` row has `status="failed"`, `errors[0].code == "tool_unavailable"`, and `messages.escalation_reason` is set — never a message claiming the item was added.

## Execution options

Two ways to run this once approved:

1. **Subagent-Driven (recommended)** — a fresh subagent per task, with review between tasks.
2. **Inline Execution** — batch execution in this session with checkpoints for review.
