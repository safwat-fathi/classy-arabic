# TijaratkBot

Social-commerce automation for Egyptian online sellers: merchants connect their social channels and expose a product catalog through customer DMs, with an optional AI layer that understands Egyptian Arabic and Arabizi.

> Let customers talk naturally in Egyptian Arabic or Arabizi instead of forcing them through rigid menus.

Full product/architecture definition lives in [`TijaratkBot_PRD.md`](./TijaratkBot_PRD.md) (product) and [`TijaratkBot_SRD.md`](./TijaratkBot_SRD.md) (system/architecture). This README documents what's actually implemented in this repo today, which is a subset of that vision — see [Status](#status) below and [`ROADMAP.md`](./ROADMAP.md) for the gap.

## Status

This repo currently implements the **AI message-classification/routing engine** (the SRD's L0/L1/L2 pipeline, §14–§22) and a thin API around it. It does **not** yet implement the full commerce platform described in the PRD/SRD.

**Built:**
- Tier 0 rule-based short-circuit (`app/engine/tier0_rules.py`)
- DeepSeek v4 Flash for all classification and extraction, with a dialect-aware system prompt, self-reported confidence, and structured-output schemas (`app/engine/classification.py`, `extraction.py`, `schemas.py`, `prompts.py`)
- Pre/post-flight checks (`evaluate_preflight`, `evaluate_postflight` in `app/engine/routing_policy.py`) flag ambiguous or low-confidence results for human review (`escalation_reason`, `OrderStatus.PENDING_REVIEW`)
- End-to-end pipeline (`app/engine/pipeline.py::process_message`) wired into a real endpoint: `POST /messages` ingests a message for an existing conversation, runs it through the full tiered pipeline, and persists intent/order/escalation data
- Core data models: `merchant`, `conversation`, `message`, `product`, `order`, `labeled_example`
- Product search domain (`app/domains/products`), conversation domain (`app/domains/conversations`)
- Offline clustering job and seed/dev scripts (`backend/scripts/`)
- A demo frontend workspace at `/demo` (product catalog + message composer + AI insights panel)
- Channel/webhook ingestion: webhook endpoints at `/webhooks/meta` (Facebook + Instagram) and `/webhooks/whatsapp/twilio` (WhatsApp via Twilio) verify, deduplicate, and persist inbound messages, then enqueue them to an `arq`/Redis worker that runs the existing classification pipeline — `ChannelConnection` rows must be provisioned manually (no onboarding UI yet); outbound replies are not implemented.
- **AI action validator + tool layer** — `search_products`/`get_product`/`update_customer_info` fully functional; `add_to_cart`/`update_cart`/`remove_from_cart`/`get_checkout_state`/`create_order`/`search_store_knowledge` fully validated and audited (`AIAction`) but stubbed pending Cart/Order/StoreKnowledge services. Opt-in per merchant via `Merchant.ai_tool_ordering_enabled` (off by default); the existing classify→extract→auto-order flow is unchanged for merchants that don't opt in. (SRD §20-21, PRD §14-15)

**Not yet built** (see `ROADMAP.md` for the full breakdown against PRD MVP scope):
- Cart, checkout, and order-processing services beyond the `Order` model itself
- Multi-tenancy enforcement (the SRD's `Tenant` entity/isolation model)
- Delivery-area/fee service, store-knowledge retrieval, human handoff
- Merchant dashboard (conversations inbox, order management, AI settings) beyond the `/demo` page
- Billing (base plans, AI add-on, fair-use tracking)

## Architecture

```text
Customer Message
      |
      v
  L0 rules  --(deterministic)--> execute
      |
      v
  DeepSeek v4 Flash (classification + extraction)
      |
      +-- confident + unambiguous --> execute (AUTO_CONFIRMED)
      |
      +-- low confidence / ambiguous / reasoning heavy / repeated correction --> PENDING_REVIEW (escalate to human)
```

- **DeepSeek v4 Flash** (via OpenRouter): sole LLM engine for classification and extraction, driven by a system prompt providing Egyptian Arabic / Arabizi dialect guidance. Low confidence, ambiguous extraction, repeated correction, or reasoning-heavy content flags the order for review. Each reason is a stable string persisted to `Message.escalation_reason`.
- **Embeddings — BAAI/bge-m3** (1024-dim, via OpenRouter): separate from the chat-completion engine, used for semantic search/clustering (`app/engine/embeddings.py`, `app/clustering/`).
- `app/engine/clients.py` builds two `AsyncOpenAI` clients (DeepSeek, embeddings) to communicate with the OpenAI-compatible OpenRouter API.

**Reading the SRD against this repo:** the SRD's suggested module names (`CartModule`, `CheckoutModule`, `AIModule`, etc., §53) are NestJS-flavored — this repo doesn't use NestJS. The equivalent boundary here is `app/domains/<name>/` for feature routers (FastAPI) and `app/engine/` for the AI pipeline. Don't expect the SRD's literal module names to exist in the code.

## Tech stack

**Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0 (asyncio), Alembic, PostgreSQL + pgvector, `uv` for dependency management.
**Frontend:** Next.js 16, React 19, Tailwind CSS 4, pnpm.

The SRD's technology baseline (§3) suggests NestJS/TypeScript for the backend; that recommendation was explicitly non-binding ("may be changed without changing the product requirements") and this is what actually got built instead.

## Getting started

### Prerequisites

- Python 3.13 and [`uv`](https://docs.astral.sh/uv/)
- A running PostgreSQL instance with the `pgvector` extension available (the initial migration runs `CREATE EXTENSION IF NOT EXISTS vector`)
- Node.js + `pnpm` for the frontend

### Backend

```bash
cd backend
cp .env.example .env   # then fill in DB credentials and AI endpoint/keys
uv sync
make upgrade            # run migrations
make dev                # uvicorn --reload
```

Other backend commands: `make run` (no reload), `make test`, `make lint`, `make format`, `make migrate` (new Alembic revision), `make seed` (seed demo data via `scripts/seed.py`).

Config is loaded from `.env` via `app/core/config.py`'s pydantic-settings `Settings`. See `backend/.env.example` for every variable, including the OpenRouter endpoint/model settings and the classification confidence threshold.

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

## Testing

```bash
cd backend
make test
```

Run a single test: `uv run pytest tests/engine/test_routing_policy.py::test_escalates_on_low_confidence`

- `tests/conftest.py` wraps each test in an outer transaction + `SAVEPOINT`, so tests can call `session.commit()` without leaking rows into the dev database.
- Engine-layer unit tests (`tests/engine/`) test the pure functions directly, without a DB or network dependency.
- A `mock_ai` fixture (respx) mocks AI HTTP calls for domain-level tests.

## Project structure

```text
backend/
  app/
    core/       # settings, async SQLAlchemy engine/session, logging
    models/     # merchant, conversation, message, product, order, labeled_example
    engine/     # tier0_rules, classification, extraction, routing_policy, pipeline, embeddings, clients, schemas
    domains/    # health, messages, products, conversations — feature routers + schemas
    api/        # assembles domain routers
    clustering/ # offline clustering job
  alembic/      # migrations
  scripts/      # seed.py, run_clustering.py, view_orders.py, test_engine.py
  tests/
frontend/
  app/          # layout, home page, /demo workspace (catalog, composer, AI insights)
docs/           # engineering debugging/review notes and implementation plans
```

## Documentation

- [`TijaratkBot_PRD.md`](./TijaratkBot_PRD.md) — product requirements
- [`TijaratkBot_SRD.md`](./TijaratkBot_SRD.md) — system/architecture requirements
- [`message-classification-ai-engine-spec.md`](./message-classification-ai-engine-spec.md) — narrower technical spec for the classification/routing engine specifically (data model, pipeline, escalation policy, embeddings)
- [`CLAUDE.md`](./CLAUDE.md) — guidance for working in this codebase with Claude Code
- [`ROADMAP.md`](./ROADMAP.md) — what's built vs. what's next
