# Session Handover & Context Summary: Tijaratk Bot Multi-Phase Plan

> **Purpose:** This document synthesizes the entire conversation transcript from `claude_session.jsonl` into a clean, complete, and actionable handover brief. Any incoming AI agent can read this document to understand the codebase context, work completed, architectural rulings, current git state, and exact next steps.

---

## 1. Project & Architecture Context

- **Repository:** `tijaratk-bot`
- **Stack:**
  - **Backend:** FastAPI (Python 3.13), async SQLAlchemy 2.x, Alembic, PostgreSQL, Redis / Arq worker. Located in `backend/`.
  - **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS. Located in `frontend/`.
- **Working Branch:** `main` (Initial feature branch `feat/demo-merchant-seed` was fast-forward merged into `main` after Task 2; all subsequent tasks target `main` directly).
- **Current HEAD Commit:** `0c927d8` (`feat(auth): enforce merchant auth on products/conversations/messages routers`).
- **Security Rule:** **NEVER** read, print, or expose `.env` files or secrets. Check `.env.example` or `app/core/config.py` for schema/configuration keys.

---

## 2. 16-Task Roadmap & Progress Status

The development follows a 16-task subagent-driven development (SDD) plan stored at `.superpowers/sdd/put-a-clear-detailed-synthetic-tower/progress.md`:

### ✅ Phase 0 — Product Variants & Order Writer Consolidation (COMPLETED)
- **Task 1 (`9b81d41`):** `ProductVariant` model + Migration `4f209de00b23` (creates `product_variants`, drops legacy `products.variants` JSON column) + `ProductRead` schemas + eager loading in `products/service.py` + demo seed data update.
- **Task 2 (`964d51f`):** `CartItem`/`OrderItem` `variant_id` FKs + Migration `2d216f40c749` (with partial indexes) + `cart/service.py::add_item` rewrite (price fallback `variant.price` -> `product.price`) + `action_validator` variant rules.
- **Task 3 (`cb04ac6`):** Consolidated `write_order()` function in `app/domains/checkout/order_writer.py` + refactored `checkout/service.py::create_order` to call it.
- **Task 4 (`6da36d9`):** Natural-language extraction order resolution (`ExtractedLineItem`, `pipeline.py::process_message` rewrite to route through `write_order`). **Phase 0 complete:** No direct `Order`/`OrderItem` instantiation exists outside `order_writer.py`.

### ✅ Phase 1 — Multi-Tenancy & Auth Spine (COMPLETED)
- **Task 5 (`0fd180e`, `83fbfa2`):** `Merchant.status` & `Merchant.facebook_user_id` + Migration `f1874ee0f0ef` + `LabeledExample.merchant_id` FK (with orphan cleanup backfill, `ondelete="SET NULL"`) + JWT settings in `config.py` (`pyjwt`, `httpx` dependencies).
- **Task 6 (`339e537`):** Auth domain (`app/domains/auth/`) implementing Facebook OAuth exchange, JWT token signing/validation, `get_current_merchant` FastAPI dependency (with dev bypass support via `AUTH_DEV_BYPASS_MERCHANT_ID`), and `/auth` routes.
- **Task 7 (`0c927d8`):** Router auth enforcement — updated `products`, `conversations`, and `messages` routes to require `Depends(get_current_merchant)` instead of client query params + added defense-in-depth `merchant_id` filtering in `checkout/service.py`.

---

### ⏳ Phase 2 — Delivery Service (CURRENT & NEXT TASK)
- **👉 Task 8 (READY TO EXECUTE):** Implement `DeliveryArea` model, migration, `app/domains/delivery/` CRUD router, real `checkout/service.py::validate_delivery_area` implementation, `get_delivery_info` AI tool, and delivery fee calculation in `write_order()`.
  - *Detailed brief already prepared at:* `.superpowers/sdd/put-a-clear-detailed-synthetic-tower/task-8-brief.md`.

---

### 📋 Upcoming Phases (PENDING)

- **Phase 3 — Human Handoff:**
  - **Task 9:** `HumanHandoff` model + `Conversation.ai_enabled`/`human_takeover` + `Merchant.ai_enabled` + migration.
  - **Task 10:** Pipeline gate in `process_message` + `app/domains/handoff/` endpoints + auto-escalation triggers.
- **Phase 4 — Order Fulfillment Status:**
  - **Task 11:** `Order.fulfillment_status` + `FulfillmentStatus` enum + migration + `app/domains/orders/` (list/detail/status PATCH).
- **Phase 5 — Merchant Dashboard:**
  - **Task 12:** Backend missing endpoints (Product CRUD write endpoints, Variant sub-resource router, StoreKnowledge CRUD, `/conversations/{id}/messages`).
  - **Task 13:** Frontend — Auth route group + login page wired to Facebook callback.
  - **Task 14:** Frontend — Conversation inbox (list, detail, human takeover/handback).
  - **Task 15:** Frontend — Product & variant management UI.
  - **Task 16:** Frontend — Orders dashboard & merchant AI settings UI.

---

## 3. Important Architectural Rulings & Invariant Rules

1. **Authentication Pattern:** Every new merchant-facing backend endpoint **MUST** use `Depends(get_current_merchant)` (`from app.domains.auth.dependencies import get_current_merchant`).
2. **Order Writing:** All order creations must go exclusively through `app.domains.checkout.order_writer.write_order()`.
3. **Database Migrations:**
   - Always run `uv run alembic upgrade head` as migrations are added.
   - Test migrations with an upgrade -> downgrade -> upgrade cycle before committing.
4. **Testing Against Dev Database:** The test suite runs against the live local Postgres/Redis test setup. Tests should avoid fragile exact row-count assertions across global tables.
5. **Known Deferred Items (Fast-Follows, Out of Current Task Scope):**
   - `get_checkout_state` (preview branch `confirm=False`) still calculates totals without variant price overrides and without delivery fees.
   - `pipeline.py` (extraction path) does not yet pass a delivery fee to `write_order()`.

---

## 4. Immediate Execution Guide: Task 8 (Delivery Service)

### What to Build:
1. **Model & Enum (`app/models/`):**
   - Add `DeliveryAreaStatus` (`ACTIVE`, `INACTIVE`) to `app/models/enums.py`.
   - Create `app/models/delivery_area.py` (`DeliveryArea` with `id`, `merchant_id`, `area`, `delivery_fee: Numeric(10,2)`, `estimated_delivery`, `status`, timestamps).
   - Export in `app/models/__init__.py`.
2. **Alembic Migration:**
   - Create `delivery_areas` table with an index on `merchant_id`.
   - Add `delivery_fee` nullable `Numeric(10, 2)` column to `orders` table.
3. **New Domain (`app/domains/delivery/`):**
   - `schemas.py`: `DeliveryAreaRead`, `DeliveryAreaCreate`, `DeliveryAreaUpdate`.
   - `service.py`: `list_delivery_areas`, `create_delivery_area`, `update_delivery_area`, `delete_delivery_area`.
   - `router.py`: `GET /`, `POST /` (201), `PATCH /{area_id}`, `DELETE /{area_id}` (all requiring `Depends(get_current_merchant)`).
   - Mount in `app/api/router.py` with prefix `/delivery-areas`.
4. **Delivery Validation (`app/domains/checkout/service.py`):**
   - Update `validate_delivery_area(session, merchant_id, address)`:
     - 0 active areas -> `{"status": "available", "delivery_fee": "0.00", "estimated_delivery": None}` (non-breaking default).
     - No address -> `{"status": "unavailable", "reason": "no_address_provided"}`.
     - Area match -> Case-insensitive substring match (longest matching area wins) -> `{"status": "available", "delivery_fee": str(fee), ...}`.
     - Configured but no match -> `{"status": "unavailable", "reason": "no_matching_area"}`.
   - Update call sites in `tools/checkout.py::handle_update_customer_info` and `checkout/service.py::create_order`.
5. **Update `write_order` (`app/domains/checkout/order_writer.py`):**
   - Accept optional `delivery_fee: Decimal | None = None`.
   - Set `total = subtotal + (delivery_fee if delivery_fee is not None else Decimal("0.00"))`.
   - Save `delivery_fee` to `Order(delivery_fee=delivery_fee, ...)`.
6. **New AI Tool (`get_delivery_info`):**
   - Add `GetDeliveryInfoAction` to `app/engine/schemas.py`.
   - Create `app/engine/tools/delivery.py` and register in `app/engine/tools/__init__.py`.
   - Add prompt description in `app/engine/prompts.py` (`ACTION_TASK_BLOCK`).
7. **Verification Commands:**
   ```bash
   cd backend
   uv run alembic upgrade head
   uv run pytest tests/models/test_delivery_area.py tests/domains/delivery/ tests/domains/checkout/ tests/engine/test_tools_checkout.py -v
   uv run pytest -q  # Full suite verification (currently 251+ tests passing)
   uv run ruff check .
   ```
