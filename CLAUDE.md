# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⛔ CRITICAL SECURITY RULE: Environment Variables & Secrets

- **NEVER access, read, open, cat, grep, or inspect `.env` files** (such as `.env`, `.env.local`, `.env.production`, or any `.env*` file containing real values).
- **NEVER print, expose, or log real environment variable values or secrets** (API keys, database credentials, tokens, secret keys) in tool outputs, chat responses, or logs.
- **ALWAYS reference `.env.example` or schema definitions** (e.g., `app/core/config.py`) when you need to understand expected environment variable names, types, or configuration structures.

## What this is

An async FastAPI backend for classifying inbound Egyptian-Arabic/Arabizi merchant chat messages (e.g. WhatsApp-style order conversations) and extracting structured order data. See `message-classification-ai-engine-spec.md` for the full technical spec — it's the source of truth for the pipeline design, model tiers, and escalation policy. This repo is one piece of the broader TijaratkBot platform described in `TijaratkBot_SRD.md` / `TijaratkBot_PRD.md`; see the root `README.md` and `ROADMAP.md` for what's built vs. not. No channel/webhook integration exists yet — `POST /messages` runs the full pipeline against an existing `conversation_id`, but nothing yet creates that conversation from a real customer message.

## Commands

```bash
make dev        # uvicorn --reload
make run         # uvicorn (no reload)
make test        # uv run pytest
make lint        # uv run ruff check .
make format      # uv run ruff format .
make migrate     # alembic revision --autogenerate -m "Migration"
make upgrade     # alembic upgrade head
```

Run a single test: `uv run pytest tests/engine/test_routing_policy.py::test_escalates_on_low_confidence`

Requires Python 3.13 and a running Postgres with the `pgvector` extension available (the initial migration runs `CREATE EXTENSION IF NOT EXISTS vector`). Config comes from `.env` (see `.env.example`) via `app/core/config.py`'s pydantic-settings `Settings`.

## Architecture

### Three-tier AI routing

The core design idea (spec §3–§4) is a cost-conscious escalation pipeline, not a single model call:

1. **Tier 0 — rule-based short-circuit** (`app/engine/tier0_rules.py`): regex match for greetings/spam/single-emoji reactions before any model call.
2. **Tier 1 — NileChat-4B** (`MBZUAI-Paris/Nile-Chat-4B`, self-hosted, OpenAI-compatible endpoint): primary classifier/extractor. Hard-capped at a **2048-token context budget** (`app/engine/context_budget.py`) — this is a training-time ceiling for the model, not an arbitrary choice, so don't silently raise it without re-reading spec §1.1.
3. **Tier 2 — DeepSeek v4 Flash via OpenRouter**: escalation target for low confidence, ambiguous extraction fields, context overflow, repeated merchant corrections, or reasoning-heavy content. Escalation triggers are centralized in `app/engine/routing_policy.py` (`evaluate_preflight` before calling Tier 1, `evaluate_postflight` after) — each trigger returns a stable reason string that gets persisted to `Message.escalation_reason`, since that field is the primary signal for what to fine-tune next.

A separate embedding model (`BAAI/bge-m3`, self-hosted, 1024-dim) handles semantic search/clustering; it is not one of the two chat-completion tiers. `app/engine/clients.py` builds one `AsyncOpenAI` client per backend (NileChat, DeepSeek/OpenRouter, embeddings) since all three speak the OpenAI-compatible API — same client shape, different base URL/model.

Confidence is self-reported by the model as part of its constrained JSON output — normalized by validators in `app/engine/schemas.py` and checked against the threshold in `app/engine/routing_policy.py::check_confidence_threshold` — not logprob-derived. Structured output schemas (`app/engine/schemas.py`: `IntentClassification`, `ExtractionResult`) are enforced via `json_schema_response_format`, since NileChat has no native function-calling and must use constrained/guided decoding.

### App layout

- `app/core/` — settings (`config.py`) and the async SQLAlchemy engine/session (`database.py`). `Base` lives here; models import it, not the other way around.
- `app/models/` — one file per ORM model (`merchant.py`, `conversation.py`, `message.py`, `product.py`, `order.py`, `labeled_example.py`) plus shared `enums.py` and an id helper `_ids.py` (UUID4 strings, not autoincrement ints). `app/models/__init__.py` re-exports everything; `alembic/env.py` imports `app.models` to register tables on `Base.metadata` before autogenerate.
- `app/engine/` — the classification/routing logic described above. Pure functions where possible (`tier0_rules`, `context_budget`, `routing_policy`) so they're unit-testable without a DB or network call; `pipeline.py::process_message` wires them together and is the one function with DB/network side effects.
- `app/domains/<name>/` — feature-oriented routers + schemas (currently `health`, `messages`, `products`, `conversations`). New API features should follow this domain-folder pattern rather than a flat `routers/` directory.
- `app/api/router.py` — the single place that assembles domain routers (no version prefix — routes are mounted directly, e.g. `POST /messages`).

### Database/enum gotcha (Alembic)

Postgres enums shared across multiple tables (e.g. `ModelTier` used by both `messages` and `orders`) must be created once explicitly with the **postgres-specific** `sqlalchemy.dialects.postgresql.ENUM(..., create_type=False)`, then `.create(bind, checkfirst=True)` before the tables reference it. Passing `create_type=False` to the generic `sa.Enum` is silently ignored and will raise `DuplicateObjectError` on the second `create_table()`. See the comment block in `alembic/versions/2d17ac4bd857_add_classification_schema.py` for the full explanation — read it before writing a new migration that adds another shared enum.

### Testing

- `tests/conftest.py` provides a `db_session` fixture that wraps each test in an outer transaction + `SAVEPOINT` (`join_transaction_mode="create_savepoint"`), so code under test can call `session.commit()` without leaking rows into the real dev database; everything rolls back at teardown. Also provides `merchant`/`conversation` fixtures and a `mock_ai` fixture (respx) for mocking AI HTTP calls.
- `pytest-asyncio` is in `auto` mode (see `pyproject.toml`), so async test functions don't need an explicit marker.
- Engine-layer unit tests (`tests/engine/`) test the pure functions directly with no DB/network dependency — follow that pattern for new engine logic before reaching for fixtures.

## Known in-progress / not-yet-implemented

- `backend/scripts/seed.py` exists and seeds demo merchant data (`make seed`).
- The classification/extraction pipeline is wired into a request path (`POST /messages` → `app/engine/pipeline.py::process_message`), but only for a message against an already-existing `conversation_id`. There is still no channel/webhook ingestion (Facebook/Instagram/WhatsApp) and no way for an external customer message to create or reach a conversation.
- No cart, checkout, billing, delivery, or multi-tenant dashboard layer yet — see the root `ROADMAP.md` for the full list against the PRD's MVP scope.
