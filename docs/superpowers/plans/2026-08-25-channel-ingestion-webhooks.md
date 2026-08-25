# Channel Ingestion (Facebook, Instagram, WhatsApp Webhooks) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let real inbound customer messages from Facebook Messenger, Instagram, and WhatsApp reach the existing classification pipeline, by adding webhook endpoints that verify the sender, deduplicate deliveries, persist the message, and hand it off for AI processing without blocking the webhook's response.

**Architecture:** A new `app/domains/channels/` domain exposes three routes: `GET/POST /webhooks/meta` (shared by Facebook Messenger and Instagram — both ride Meta's Graph API webhook infrastructure, dispatched by the payload's `object` field) and `POST /webhooks/whatsapp/twilio` (WhatsApp via Twilio, a distinct BSP with its own payload shape and signature scheme). Each platform's raw payload is verified, parsed into a shared `ParsedInboundMessage`, mapped to a `ChannelConnection` → `Conversation`, and inserted as a `Message` row using `INSERT ... ON CONFLICT DO NOTHING` keyed on `external_message_id` for idempotency. The webhook request commits that DB work and returns immediately; a Redis-backed `arq` job queue then runs the existing (lightly refactored) `process_message` pipeline in a separate worker process, holding a per-conversation Redis lock while it does so.

**Tech Stack:** FastAPI, SQLAlchemy async + asyncpg (existing), Alembic (existing), **arq** (new — Redis job queue), **redis** async client (new, pulled in by arq), **twilio** (new — `twilio.request_validator.RequestValidator` for WhatsApp webhook signatures).

**Spec:** No existing spec file covers channel ingestion — `message-classification-ai-engine-spec.md` explicitly starts from "a message has arrived and is ready to be processed" and out of scope. The target architecture comes from `TijaratkBot_SRD.md` §7 (`ChannelConnection` entity), §34–§37 (Redis dedup/idempotency/locking, async webhook processing), and §55 (recommended processing flow); this plan implements a scoped-down version of that design — see Global Constraints and Non-Goals below for exactly what's cut. Also `README.md` and `ROADMAP.md`, which list channel/webhook ingestion as the top MVP gap.

## Global Constraints

- **WhatsApp goes through Twilio (a BSP), not Meta's Cloud API directly** — user's explicit choice. This means WhatsApp has a completely separate signature scheme (HMAC-SHA1 over the full URL + sorted form params, via `twilio.request_validator.RequestValidator`) and payload shape (form-urlencoded, not JSON) from Facebook/Instagram's Meta webhooks (HMAC-SHA256 over the raw JSON body). No code is shared between the two beyond the `ParsedInboundMessage` shape they both produce.
- **Deferred AI processing uses Redis + `arq`** — user's explicit choice, matching SRD §35's target design. A webhook handler must ack Meta/Twilio within a few seconds; `process_message`'s embedding + DeepSeek calls can legitimately take up to ~90s in the worst case (`AI_REQUEST_TIMEOUT_SECONDS=30.0` × up to `AI_MAX_RETRIES=2` retries, twice — classification and possibly extraction), which is well past any webhook ack budget.
- **`process_message` is refactored to accept a pre-built `Message`** instead of constructing one internally. The webhook path must create and dedup-check the `Message` row synchronously (for the `ON CONFLICT DO NOTHING` idempotency check) before handing off to the async worker, while the existing `POST /messages` endpoint still needs a message constructed from its own request payload. One shared function now serves both call sites without duplicating ~130 lines of tier0/embedding/classification/extraction logic.
- **Per-conversation locking is a Redis mutex acquired inside the arq worker task**, not inside the webhook request — keyed `conversation:{id}:lock` matching SRD §36's naming. This prevents two concurrent webhook deliveries for the same conversation from corrupting `context_budget.py`'s assumption that message history is chronologically ordered by DB insert time.
- **Dedup key lives on `Message.external_message_id`** (a partial unique index, non-null only) — not a separate event-id table. Meta and Twilio provide no reliable per-HTTP-delivery id; the only stable id is per-message (`message.mid` for Messenger/Instagram, `MessageSid` for Twilio WhatsApp), and retries resend the identical message id.
- **`WebhookEvent` is a raw-payload audit log only** (own UUID PK, no dedup constraint, one row per HTTP delivery). Three platforms with occasionally-changing, divergent payload shapes need a raw record independent of whether parsing or dedup succeeded, for debugging.
- **`ChannelConnection` rows are provisioned manually** (a direct DB insert — no seed script is built here, since there's exactly one merchant in dev/seed data today and adding one is a single SQL statement) — not through a self-serve OAuth flow. Merchant onboarding UI doesn't exist yet (see ROADMAP.md) and building it is out of scope.
- **No `access_token` column on `ChannelConnection`.** This plan is inbound-ingestion only; outbound reply-sending (which would need it) is an explicit non-goal below, and adding an unused secret-bearing column now would invite an at-rest-encryption question with no code yet to justify it.
- **New settings get non-breaking defaults.** `Settings()` is instantiated eagerly at import (`app/core/config.py:41`), so a new *required* field with no default breaks `make test`/`make dev` for every existing developer and CI run until their `.env` is updated. `REDIS_URL` defaults to `"redis://localhost:6379/0"` (a reasonable local default, following the existing `POSTGRES_PORT: int = 5432` pattern). The webhook secrets (`META_APP_SECRET`, `META_VERIFY_TOKEN`, `TWILIO_AUTH_TOKEN`) default to `""` and the verification code fails closed (403) on an empty secret, rather than being required fields that break imports.
- **Only text messages are ingested.** Media/attachments, Messenger/Instagram echoes (`message.is_echo`), and WhatsApp `statuses[]` delivery/read receipts are parsed out and dropped (logged, not stored) — ingesting either would create fake INBOUND customer messages or crash on a `text` field that doesn't exist on those payloads.
- **Text normalization does not exist anywhere in this repo yet** — `normalized_text` is currently just a second caller-supplied field on `POST /messages` (see `app/domains/messages/schemas.py`), not something computed. Channel ingestion passes `raw_text` through unchanged as `normalized_text` until a real Arabizi/dialect normalizer is built; building one is out of scope here.
- **Both signature checks happen over the exact bytes the platform signed** — the raw request body for Meta (read via `await request.body()` before any JSON parsing), and the exact configured public URL + parsed form params for Twilio (via a fixed `TWILIO_WEBHOOK_URL` setting, not `request.url` — uvicorn does not trust `X-Forwarded-*` headers by default, so behind the existing pm2/nginx setup `request.url` would reflect the internal `http://127.0.0.1:8000/...` address, not the public HTTPS URL Twilio actually signed).
- **A valid signature always gets HTTP 200, even if the payload can't be parsed** — an unparseable-but-authentic payload is logged and recorded in `WebhookEvent.processing_error`, never returned as 4xx/5xx. Meta disables a webhook subscription after enough non-2xx responses, and both platforms retry-storm on non-2xx. Only a failed/missing signature returns 403.

## Non-Goals (explicit — do not build these here)

- Outbound reply sending (Send API calls) to any of the three platforms.
- Self-serve merchant channel-connection onboarding (OAuth flows, a dashboard UI to link a Page/IG account/WhatsApp number).
- Media/attachment messages (images, audio, video, stickers, location, contacts) — dropped with a log line.
- Delivery/read receipt tracking (WhatsApp `statuses[]`, Messenger delivery/read webhooks).
- Horizontal scaling of the arq worker, or monitoring/alerting on queue depth or dead-letter jobs — a single `make worker` process is assumed.
- Rate limiting or abuse protection on the webhook endpoints beyond signature verification.
- Registering/configuring the actual Meta App or Twilio account (App review, WhatsApp Business verification, phone number registration) — an external operational step, not code.
- Text normalization (Arabizi/dialect canonicalization) — passthrough only, per Global Constraints.

---

## Task 1: Dependencies and configuration

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/app/core/config.py`
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `settings.REDIS_URL: str`, `settings.META_APP_SECRET: str`, `settings.META_VERIFY_TOKEN: str`, `settings.TWILIO_AUTH_TOKEN: str`, `settings.TWILIO_WEBHOOK_URL: str` — consumed by Tasks 5, 7, 8, 9, 10.

- [ ] **Step 1: Add new dependencies**

In `backend/pyproject.toml`, add to the `dependencies` list (keep alphabetical order matching the existing list):

```toml
dependencies = [
    "alembic>=1.19.1",
    "arq>=0.26.0",
    "asyncpg>=0.31.0",
    "fastapi[standard]>=0.141.1",
    "numpy>=2.5.2",
    "openai>=3.3.1",
    "pgvector>=0.5.0",
    "pydantic-settings>=2.15.0",
    "scikit-learn>=1.9.0",
    "sqlalchemy[asyncio]>=2.0.52",
    "twilio>=9.0.0",
]
```

Run: `cd backend && uv sync`
Expected: lock file updates, `arq` and `twilio` (and their transitive deps, including `redis`) install cleanly.

- [ ] **Step 2: Add new settings**

In `backend/app/core/config.py`, add a new block after the existing `CORS_ORIGINS` line (before the `sqlalchemy_database_uri` property):

```python
    # Channel/Webhook Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    META_APP_SECRET: str = ""
    META_VERIFY_TOKEN: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WEBHOOK_URL: str = ""
```

- [ ] **Step 3: Document the new settings in `.env.example`**

In `backend/.env.example`, append after `CORS_ORIGINS`:

```bash
# Channel/Webhook Settings
REDIS_URL="redis://localhost:6379/0"
META_APP_SECRET=""
META_VERIFY_TOKEN=""
TWILIO_AUTH_TOKEN=""
TWILIO_WEBHOOK_URL=""
```

- [ ] **Step 4: Verify the existing suite still boots and passes**

Run: `cd backend && uv run pytest -q`
Expected: PASS (all existing tests still pass — the new settings all have defaults, so no `.env` changes are required for this step to succeed).

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml backend/uv.lock backend/app/core/config.py backend/.env.example
git commit -m "chore: add arq/twilio dependencies and channel webhook settings"
```

---

## Task 2: Models — Channel enum, ChannelConnection, WebhookEvent, and column additions

**Files:**
- Modify: `backend/app/models/enums.py`
- Create: `backend/app/models/channel_connection.py`
- Create: `backend/app/models/webhook_event.py`
- Modify: `backend/app/models/conversation.py`
- Modify: `backend/app/models/message.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/models/test_channel_models.py`

**Interfaces:**
- Produces: `Channel(StrEnum)` with `FACEBOOK`/`INSTAGRAM`/`WHATSAPP`; `ChannelConnection(id, merchant_id, channel, external_account_id, is_active, created_at)`; `WebhookEvent(id, channel, raw_payload, received_at, processing_error)`; `Conversation.channel_connection_id: str | None`; `Message.external_message_id: str | None`. Consumed by Task 3 (migration), Task 6 (service), Task 9 (router).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/models/__init__.py` (empty file) and `backend/tests/models/test_channel_models.py`:

```python
from app.models import Channel, ChannelConnection, WebhookEvent


def test_channel_enum_has_expected_members():
    assert {c.value for c in Channel} == {"FACEBOOK", "INSTAGRAM", "WHATSAPP"}


async def test_channel_connection_defaults(db_session, merchant):
    connection = ChannelConnection(
        merchant_id=merchant.id,
        channel=Channel.FACEBOOK,
        external_account_id="1234567890",
    )
    db_session.add(connection)
    await db_session.flush()

    assert connection.id is not None
    assert connection.is_active is True


async def test_webhook_event_stores_raw_payload(db_session):
    event = WebhookEvent(channel=Channel.WHATSAPP, raw_payload={"hello": "world"})
    db_session.add(event)
    await db_session.flush()

    assert event.id is not None
    assert event.raw_payload == {"hello": "world"}
    assert event.processing_error is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/models/test_channel_models.py -v`
Expected: FAIL with `ImportError: cannot import name 'Channel' from 'app.models'`

- [ ] **Step 3: Add the `Channel` enum**

In `backend/app/models/enums.py`, append:

```python
class Channel(enum.StrEnum):
    FACEBOOK = "FACEBOOK"
    INSTAGRAM = "INSTAGRAM"
    WHATSAPP = "WHATSAPP"
```

- [ ] **Step 4: Create the `ChannelConnection` model**

Create `backend/app/models/channel_connection.py`:

```python
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import Channel

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.merchant import Merchant


class ChannelConnection(Base):
    __tablename__ = "channel_connections"
    __table_args__ = (
        UniqueConstraint("channel", "external_account_id", name="uq_channel_connections_channel_external_account_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    channel: Mapped[Channel] = mapped_column(SAEnum(Channel, name="channel"), nullable=False)
    external_account_id: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    merchant: Mapped[Merchant] = relationship()
    conversations: Mapped[list[Conversation]] = relationship(back_populates="channel_connection")
```

- [ ] **Step 5: Create the `WebhookEvent` model**

Create `backend/app/models/webhook_event.py`:

```python
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import Channel


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    channel: Mapped[Channel] = mapped_column(SAEnum(Channel, name="channel"), nullable=False)
    raw_payload: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    processing_error: Mapped[str | None] = mapped_column(String, nullable=True)
```

- [ ] **Step 6: Add `channel_connection_id` to `Conversation`**

In `backend/app/models/conversation.py`, replace the full file:

```python
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import ConvState

if TYPE_CHECKING:
    from app.models.channel_connection import ChannelConnection
    from app.models.merchant import Merchant
    from app.models.message import Message
    from app.models.order import Order


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint(
            "channel_connection_id", "customer_ref", name="uq_conversations_channel_connection_customer_ref"
        ),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    channel_connection_id: Mapped[str | None] = mapped_column(
        ForeignKey("channel_connections.id"), nullable=True, index=True
    )
    customer_ref: Mapped[str] = mapped_column(String, nullable=False)
    state: Mapped[ConvState] = mapped_column(SAEnum(ConvState, name="convstate"), nullable=False)
    slots: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    last_message_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    merchant: Mapped[Merchant] = relationship(back_populates="conversations")
    channel_connection: Mapped[ChannelConnection | None] = relationship(back_populates="conversations")
    messages: Mapped[list[Message]] = relationship(back_populates="conversation")
    orders: Mapped[list[Order]] = relationship(back_populates="conversation")
```

Note: a plain (non-partial) `UniqueConstraint` on a nullable `channel_connection_id` is correct here without any special casing — Postgres treats every `NULL` as distinct from every other `NULL` for uniqueness purposes, so any number of internally-created conversations (which leave `channel_connection_id` unset) coexist fine; only real per-channel `(channel_connection_id, customer_ref)` pairs are constrained.

- [ ] **Step 7: Add `external_message_id` to `Message`**

In `backend/app/models/message.py`, apply this diff:

Find:
```python
from sqlalchemy import DateTime, Float, ForeignKey, Index, String, func
```
Replace with:
```python
from sqlalchemy import DateTime, Float, ForeignKey, Index, String, func, text
```

Find:
```python
    __table_args__ = (Index("ix_messages_conversation_id_created_at", "conversation_id", "created_at"),)
```
Replace with:
```python
    __table_args__ = (
        Index("ix_messages_conversation_id_created_at", "conversation_id", "created_at"),
        Index(
            "ix_messages_external_message_id_unique",
            "external_message_id",
            unique=True,
            postgresql_where=text("external_message_id IS NOT NULL"),
        ),
    )
```

Find:
```python
    escalation_reason: Mapped[str | None] = mapped_column(String, nullable=True)
```
Replace with:
```python
    escalation_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    external_message_id: Mapped[str | None] = mapped_column(String, nullable=True)
```

- [ ] **Step 8: Register the new models in `app/models/__init__.py`**

Replace the full file:

```python
from app.models.ai_usage_event import AIUsageEvent
from app.models.channel_connection import ChannelConnection
from app.models.conversation import Conversation
from app.models.enums import Channel, ConvState, Direction, ModelTier, OrderStatus
from app.models.labeled_example import LabeledExample
from app.models.merchant import Merchant
from app.models.message import Message
from app.models.order import Order
from app.models.product import Product
from app.models.webhook_event import WebhookEvent

__all__ = [
    "AIUsageEvent",
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
    "OrderStatus",
    "Product",
    "WebhookEvent",
]
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/models/test_channel_models.py -v`
Expected: still FAILs at this point — the DB has no `channel_connections`/`webhook_events` tables or new columns yet (no migration exists). This is expected; Task 3 makes it pass. Confirm the failure is now a DB-level error (e.g. `UndefinedTableError`/`UndefinedColumnError`), not an `ImportError` — that confirms Steps 1–8 are wired correctly and the only remaining gap is the migration.

- [ ] **Step 10: Commit**

```bash
git add backend/app/models/enums.py backend/app/models/channel_connection.py backend/app/models/webhook_event.py backend/app/models/conversation.py backend/app/models/message.py backend/app/models/__init__.py backend/tests/models/
git commit -m "feat: add Channel enum, ChannelConnection and WebhookEvent models"
```

---

## Task 3: Alembic migration

**Files:**
- Create: `backend/alembic/versions/<generated>_add_channel_ingestion_schema.py`

**Interfaces:**
- Consumes: model definitions from Task 2.
- Produces: `channel_connections`, `webhook_events` tables; `conversations.channel_connection_id`, `conversations` unique constraint; `messages.external_message_id`, partial unique index. Consumed by Task 2's tests (now passing) and every later task that touches these tables.

- [ ] **Step 1: Create an empty revision**

Run: `cd backend && uv run alembic revision -m "add channel ingestion schema"`
Expected: a new file `backend/alembic/versions/<hash>_add_channel_ingestion_schema.py` is created with `down_revision = "681687521d6f"` (the current head) auto-filled in, and empty `upgrade()`/`downgrade()` functions.

- [ ] **Step 2: Write the migration body**

Open the generated file and replace its `upgrade()` and `downgrade()` functions (keep the auto-generated header/revision-id lines as-is) with:

```python
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM, JSON

from alembic import op


def upgrade() -> None:
    # `channel` is used by BOTH channel_connections.channel and
    # webhook_events.channel — must use the postgres-specific ENUM with
    # create_type=False and an explicit .create(), same as `modeltier` in
    # 2d17ac4bd857_add_classification_schema.py. A plain sa.Enum here would
    # raise DuplicateObjectError on the second create_table() call.
    channel = ENUM("FACEBOOK", "INSTAGRAM", "WHATSAPP", name="channel", create_type=False)
    channel.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "channel_connections",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("merchant_id", sa.String(), sa.ForeignKey("merchants.id"), nullable=False),
        sa.Column("channel", channel, nullable=False),
        sa.Column("external_account_id", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint(
            "channel", "external_account_id", name="uq_channel_connections_channel_external_account_id"
        ),
    )
    op.create_index(
        "ix_channel_connections_merchant_id", "channel_connections", ["merchant_id"]
    )

    op.create_table(
        "webhook_events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("channel", channel, nullable=False),
        sa.Column("raw_payload", JSON(), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("processing_error", sa.String(), nullable=True),
    )

    op.add_column(
        "conversations",
        sa.Column("channel_connection_id", sa.String(), sa.ForeignKey("channel_connections.id"), nullable=True),
    )
    op.create_index("ix_conversations_channel_connection_id", "conversations", ["channel_connection_id"])
    op.create_unique_constraint(
        "uq_conversations_channel_connection_customer_ref",
        "conversations",
        ["channel_connection_id", "customer_ref"],
    )

    op.add_column("messages", sa.Column("external_message_id", sa.String(), nullable=True))
    op.create_index(
        "ix_messages_external_message_id_unique",
        "messages",
        ["external_message_id"],
        unique=True,
        postgresql_where=sa.text("external_message_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_messages_external_message_id_unique", table_name="messages")
    op.drop_column("messages", "external_message_id")

    op.drop_constraint("uq_conversations_channel_connection_customer_ref", "conversations", type_="unique")
    op.drop_index("ix_conversations_channel_connection_id", table_name="conversations")
    op.drop_column("conversations", "channel_connection_id")

    op.drop_table("webhook_events")

    op.drop_index("ix_channel_connections_merchant_id", table_name="channel_connections")
    op.drop_table("channel_connections")

    sa.Enum(name="channel").drop(op.get_bind(), checkfirst=True)
```

- [ ] **Step 3: Apply the migration**

Run: `cd backend && uv run alembic upgrade head`
Expected: applies cleanly against local Postgres, no errors.

- [ ] **Step 4: Run Task 2's tests to verify they now pass**

Run: `cd backend && uv run pytest tests/models/test_channel_models.py -v`
Expected: PASS (all 3 tests).

- [ ] **Step 5: Run the full suite to check for regressions**

Run: `cd backend && uv run pytest -q`
Expected: PASS.

- [ ] **Step 6: Verify downgrade/upgrade round-trip, then leave the DB at head**

Run: `cd backend && uv run alembic downgrade -1 && uv run alembic upgrade head`
Expected: both commands succeed with no errors (confirms `downgrade()` is correct, not just `upgrade()`).

- [ ] **Step 7: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat: add channel_connections/webhook_events tables and dedup columns"
```

---

## Task 4: Refactor `process_message` to accept a pre-built `Message`

**Files:**
- Modify: `backend/app/engine/pipeline.py`
- Modify: `backend/app/domains/messages/service.py`
- Modify: `backend/tests/engine/test_pipeline.py`

**Interfaces:**
- Produces: `process_message(session: AsyncSession, conversation: Conversation, message: Message) -> PipelineResult` (breaking signature change from `process_message(session, conversation, raw_text, normalized_text)`). Consumed by Task 6 (webhook service, indirectly via Task 10's worker) and the existing `ingest_message`.

- [ ] **Step 1: Update the failing call sites in `test_pipeline.py` first (red)**

In `backend/tests/engine/test_pipeline.py`, apply this diff:

Find:
```python
from app.core.config import settings
from app.engine.pipeline import DEFAULT_INTENTS, _known_intents, process_message
from app.models import AIUsageEvent, Direction, Message, ModelTier, OrderStatus, Product
```
Replace with:
```python
from app.core.config import settings
from app.engine.pipeline import DEFAULT_INTENTS, _known_intents, process_message
from app.models import AIUsageEvent, Direction, Message, ModelTier, OrderStatus, Product
from app.models._ids import new_id


def _inbound_message(conversation, raw_text: str, normalized_text: str) -> Message:
    return Message(
        id=new_id(),
        conversation_id=conversation.id,
        direction=Direction.INBOUND,
        raw_text=raw_text,
        normalized_text=normalized_text,
    )
```

Then replace each of the following 7 call sites (same pattern each time — wrap the two text arguments in `_inbound_message(conversation, ..., ...)`):

Find: `result = await process_message(db_session, conversation, "👍", "👍")`
Replace: `result = await process_message(db_session, conversation, _inbound_message(conversation, "👍", "👍"))`

Find (appears twice, at lines ~85 and ~153): `result = await process_message(db_session, conversation, "عايز اطلب رز", "عايز اطلب رز")`
Replace (both occurrences): `result = await process_message(db_session, conversation, _inbound_message(conversation, "عايز اطلب رز", "عايز اطلب رز"))`

Find: `result = await process_message(db_session, conversation, "عايز فستان صيفي", "عايز فستان صيفي")`
Replace: `result = await process_message(db_session, conversation, _inbound_message(conversation, "عايز فستان صيفي", "عايز فستان صيفي"))`

Find: `result = await process_message(db_session, conversation, "عايز اطلب حاجة", "عايز اطلب حاجة")`
Replace: `result = await process_message(db_session, conversation, _inbound_message(conversation, "عايز اطلب حاجة", "عايز اطلب حاجة"))`

Find (appears twice, at lines ~171 and ~191): `result = await process_message(db_session, conversation, "الاسعار كام؟", "الاسعار كام؟")`
Replace (both occurrences): `result = await process_message(db_session, conversation, _inbound_message(conversation, "الاسعار كام؟", "الاسعار كام؟"))`

- [ ] **Step 2: Run tests to verify they fail against the old signature**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py -v`
Expected: FAIL with `TypeError: process_message() takes 3 positional arguments but 4 were given` (or similar) on every updated test.

- [ ] **Step 3: Refactor `process_message`**

In `backend/app/engine/pipeline.py`, apply this diff:

Find:
```python
async def process_message(
    session: AsyncSession, conversation: Conversation, raw_text: str, normalized_text: str
) -> PipelineResult:
    tier0_intent = match_tier0(normalized_text)

    # Read history BEFORE adding the new message — session.execute() autoflushes,
    # which would otherwise put the message being classified into its own history
    # and duplicate it against build_context_prompt's current_line.
    history = []
    if not tier0_intent:
        history_result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(settings.CONTEXT_HISTORY_TURNS)
        )
        history = list(reversed(history_result.scalars().all()))

    message = Message(
        conversation_id=conversation.id,
        direction=Direction.INBOUND,
        raw_text=raw_text,
        normalized_text=normalized_text,
    )
    session.add(message)
    conversation.last_message_at = datetime.now(UTC)
```
Replace with:
```python
async def process_message(session: AsyncSession, conversation: Conversation, message: Message) -> PipelineResult:
    # `message` may be a brand-new, not-yet-flushed object (the internal
    # POST /messages caller) or an already-persistent row loaded by the arq
    # worker (the channel-ingestion caller, which inserted it in a prior
    # transaction for dedup purposes) — session.add() is a safe no-op for
    # the latter. Either way `message.id` must already be set (both callers
    # pass id=new_id() explicitly) so the history exclusion below works
    # regardless of flush timing.
    session.add(message)
    normalized_text = message.normalized_text
    tier0_intent = match_tier0(normalized_text)

    # Read history BEFORE any flush of `message` — session.execute() autoflushes,
    # which would otherwise put the message being classified into its own history
    # and duplicate it against build_context_prompt's current_line. Excluding
    # message.id explicitly (rather than relying on flush timing) makes this
    # correct whether `message` is pending or already persistent.
    history = []
    if not tier0_intent:
        history_result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id, Message.id != message.id)
            .order_by(Message.created_at.desc())
            .limit(settings.CONTEXT_HISTORY_TURNS)
        )
        history = list(reversed(history_result.scalars().all()))

    conversation.last_message_at = datetime.now(UTC)
```

No other lines in `pipeline.py` change — every reference to `raw_text` below this point already only used `normalized_text` and `message.id`/`message.*`, both of which remain valid.

- [ ] **Step 4: Update `ingest_message` to construct the `Message` itself**

In `backend/app/domains/messages/service.py`, replace the full file:

```python
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.messages.schemas import (
    MessageIngestRequest,
    MessageIngestResponse,
    OrderDetail,
    OrderLineItem,
)
from app.engine.pipeline import process_message
from app.models import Conversation, Direction, Message
from app.models._ids import new_id


class ConversationNotFoundError(Exception):
    pass


async def ingest_message(db: AsyncSession, payload: MessageIngestRequest) -> MessageIngestResponse:
    conversation = await db.get(Conversation, payload.conversation_id)
    if conversation is None:
        raise ConversationNotFoundError(payload.conversation_id)

    message = Message(
        id=new_id(),
        conversation_id=conversation.id,
        direction=Direction.INBOUND,
        raw_text=payload.raw_text,
        normalized_text=payload.normalized_text,
    )
    result = await process_message(db, conversation, message)

    order_detail = None
    if result.order is not None:
        extracted = result.order.extracted_payload
        order_detail = OrderDetail(
            id=result.order.id,
            status=result.order.status.value,
            confidence_score=result.order.confidence_score,
            extracted_by_tier=result.order.extracted_by_tier.value,
            line_items=[OrderLineItem(**item) for item in extracted["line_items"]],
            address=extracted.get("address"),
            phone=extracted.get("phone"),
            payment_method=extracted.get("payment_method"),
            ambiguous_fields=extracted.get("ambiguous_fields", []),
        )

    return MessageIngestResponse(
        message_id=result.message.id,
        intent=result.message.intent,
        intent_confidence=result.message.intent_confidence,
        model_tier=result.message.model_tier.value if result.message.model_tier else None,
        escalation_reason=result.message.escalation_reason,
        order_id=result.order.id if result.order else None,
        order_status=result.order.status.value if result.order else None,
        order=order_detail,
    )
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py tests/domains/test_messages_router.py -v`
Expected: PASS (all tests, including the unchanged `test_messages_router.py` HTTP-level tests, which exercise `ingest_message` indirectly).

- [ ] **Step 6: Run the full suite**

Run: `cd backend && uv run pytest -q`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/app/engine/pipeline.py backend/app/domains/messages/service.py backend/tests/engine/test_pipeline.py
git commit -m "refactor: have process_message accept a pre-built Message"
```

---

## Task 5: Redis pool and per-conversation lock

**Files:**
- Create: `backend/app/core/redis.py`
- Create: `backend/app/core/locks.py`
- Test: `backend/tests/core/test_locks.py`

**Interfaces:**
- Produces: `get_arq_pool() -> ArqRedis` (`app/core/redis.py`); `conversation_lock(redis: ArqRedis, conversation_id: str) -> AbstractAsyncContextManager[None]` (`app/core/locks.py`). Consumed by Task 9 (router, via `get_arq_pool` as a FastAPI dependency) and Task 10 (worker, via `conversation_lock`).
- **Requires a running local Redis** for this task's test (`redis://localhost:6379/0` by default) — same operational assumption this repo already makes for Postgres (see `CLAUDE.md`: "Requires ... a running Postgres").

- [ ] **Step 1: Write the failing test**

Create `backend/tests/core/__init__.py` (empty) and `backend/tests/core/test_locks.py`:

```python
import asyncio

from arq import create_pool
from arq.connections import RedisSettings

from app.core.config import settings
from app.core.locks import conversation_lock


async def test_lock_excludes_concurrent_holders():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    order: list[str] = []

    async def hold(name: str, delay: float) -> None:
        async with conversation_lock(redis, "conv-lock-test"):
            order.append(f"{name}-start")
            await asyncio.sleep(delay)
            order.append(f"{name}-end")

    await asyncio.gather(hold("a", 0.05), hold("b", 0.0))

    # Whichever task acquires the lock first must fully finish (its "-end")
    # before the other one's "-start" — i.e. no interleaving.
    assert order in (["a-start", "a-end", "b-start", "b-end"], ["b-start", "b-end", "a-start", "a-end"])

    await redis.close()


async def test_lock_releases_on_exception():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))

    with __import__("pytest").raises(ValueError):
        async with conversation_lock(redis, "conv-lock-test-2"):
            raise ValueError("boom")

    # Lock must be released even though the body raised — acquiring it again
    # immediately must succeed rather than hang/timeout.
    async with conversation_lock(redis, "conv-lock-test-2"):
        pass

    await redis.close()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/core/test_locks.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.core.locks'`

- [ ] **Step 3: Implement the lock**

Create `backend/app/core/locks.py`:

```python
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from arq import ArqRedis

_LOCK_TTL_SECONDS = 30
_ACQUIRE_POLL_SECONDS = 0.05

_RELEASE_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


@asynccontextmanager
async def conversation_lock(redis: ArqRedis, conversation_id: str) -> AsyncIterator[None]:
    """
    Redis mutex keyed `conversation:{id}:lock` (SRD §36) so two concurrent
    webhook deliveries for the same conversation can't interleave message
    processing and corrupt the chronological-history assumption in
    context_budget.py. Uses a unique per-acquisition token so a holder can
    never release a lock it doesn't own (e.g. after its own TTL expired and
    someone else acquired it).
    """
    key = f"conversation:{conversation_id}:lock"
    token = uuid.uuid4().hex
    while not await redis.set(key, token, nx=True, ex=_LOCK_TTL_SECONDS):
        import asyncio

        await asyncio.sleep(_ACQUIRE_POLL_SECONDS)
    try:
        yield
    finally:
        await redis.eval(_RELEASE_SCRIPT, 1, key, token)
```

- [ ] **Step 4: Create the arq pool accessor**

Create `backend/app/core/redis.py`:

```python
from arq import ArqRedis, create_pool
from arq.connections import RedisSettings

from app.core.config import settings

_pool: ArqRedis | None = None


async def get_arq_pool() -> ArqRedis:
    global _pool
    if _pool is None:
        _pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    return _pool
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/core/test_locks.py -v`
Expected: PASS. (Requires local Redis running — `redis-server` or `docker run -p 6379:6379 redis`.)

- [ ] **Step 6: Run the full suite**

Run: `cd backend && uv run pytest -q`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/app/core/redis.py backend/app/core/locks.py backend/tests/core/
git commit -m "feat: add Redis pool accessor and per-conversation lock"
```

---

## Task 6: Channel ingestion core service (find-or-create + dedup insert)

**Files:**
- Create: `backend/app/domains/channels/__init__.py` (empty)
- Create: `backend/app/domains/channels/schemas.py`
- Create: `backend/app/domains/channels/service.py`
- Modify: `backend/tests/conftest.py`
- Test: `backend/tests/domains/channels/test_service.py`

**Interfaces:**
- Consumes: `Channel`, `ChannelConnection`, `Conversation`, `Message`, `Direction` (Task 2).
- Produces: `ParsedInboundMessage` dataclass (`channel`, `external_account_id`, `external_customer_id`, `external_message_id`, `text`); `ingest_channel_message(session: AsyncSession, parsed: ParsedInboundMessage) -> str | None` (`app/domains/channels/service.py`) — returns the new `Message.id` if inserted, `None` if the account is unmapped or the message is a duplicate. Consumed by Task 9 (router).
- Produces test fixtures: `channel_connection` (in `conftest.py`, a Facebook `ChannelConnection` for the `merchant` fixture) and `fake_arq_pool` (records `enqueue_job` calls instead of touching real Redis). Consumed by Tasks 7, 8, 9.

- [ ] **Step 1: Add shared test fixtures**

In `backend/tests/conftest.py`, apply this diff:

Find:
```python
from app.core.database import engine
from app.models import Conversation, ConvState, Merchant
```
Replace with:
```python
from app.core.database import engine
from app.models import Channel, ChannelConnection, Conversation, ConvState, Merchant
```

Find (end of file, after the `mock_ai` fixture):
```python
@pytest.fixture
def mock_ai(httpx2_mock):
    # openai>=3.3.1 makes its HTTP calls through `httpx2` (a separate package
    # from `httpx`), which plain `respx.mock()` cannot intercept — the request
    # falls through to a real network call instead of being mocked. The
    # `httpx2_mock` fixture (from pytest-httpx2) is respx wired to patch
    # httpx2's transport instead; `mock_ai` just forwards it so every existing
    # `mock_ai.post(...)` call site keeps working unchanged.
    yield httpx2_mock
```
Replace with:
```python
@pytest.fixture
def mock_ai(httpx2_mock):
    # openai>=3.3.1 makes its HTTP calls through `httpx2` (a separate package
    # from `httpx`), which plain `respx.mock()` cannot intercept — the request
    # falls through to a real network call instead of being mocked. The
    # `httpx2_mock` fixture (from pytest-httpx2) is respx wired to patch
    # httpx2's transport instead; `mock_ai` just forwards it so every existing
    # `mock_ai.post(...)` call site keeps working unchanged.
    yield httpx2_mock


@pytest.fixture
async def channel_connection(db_session, merchant):
    connection = ChannelConnection(
        merchant_id=merchant.id,
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
    )
    db_session.add(connection)
    await db_session.flush()
    return connection


class FakeArqPool:
    def __init__(self):
        self.enqueued: list[tuple[str, tuple, dict]] = []

    async def enqueue_job(self, function: str, *args, **kwargs):
        self.enqueued.append((function, args, kwargs))
        return None


@pytest.fixture
def fake_arq_pool():
    return FakeArqPool()
```

- [ ] **Step 2: Write the failing test**

Create `backend/tests/domains/channels/__init__.py` (empty) and `backend/tests/domains/channels/test_service.py`:

```python
from app.domains.channels.schemas import ParsedInboundMessage
from app.domains.channels.service import ingest_channel_message
from app.models import Channel, Conversation, Message
from sqlalchemy import select


async def test_ingest_creates_conversation_and_message(db_session, channel_connection):
    parsed = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
        external_customer_id="customer-1",
        external_message_id="mid.111",
        text="hello",
    )

    message_id = await ingest_channel_message(db_session, parsed)
    await db_session.flush()

    assert message_id is not None
    message = await db_session.get(Message, message_id)
    assert message.raw_text == "hello"
    assert message.external_message_id == "mid.111"

    conversation = await db_session.get(Conversation, message.conversation_id)
    assert conversation.channel_connection_id == channel_connection.id
    assert conversation.customer_ref == "customer-1"


async def test_ingest_reuses_existing_conversation_for_same_customer(db_session, channel_connection):
    first = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
        external_customer_id="customer-1",
        external_message_id="mid.111",
        text="hello",
    )
    second = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
        external_customer_id="customer-1",
        external_message_id="mid.222",
        text="hello again",
    )

    first_id = await ingest_channel_message(db_session, first)
    second_id = await ingest_channel_message(db_session, second)
    await db_session.flush()

    first_message = await db_session.get(Message, first_id)
    second_message = await db_session.get(Message, second_id)
    assert first_message.conversation_id == second_message.conversation_id

    conversations = (
        await db_session.execute(select(Conversation).where(Conversation.customer_ref == "customer-1"))
    ).scalars().all()
    assert len(conversations) == 1


async def test_ingest_is_idempotent_on_duplicate_external_message_id(db_session, channel_connection):
    parsed = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
        external_customer_id="customer-1",
        external_message_id="mid.111",
        text="hello",
    )

    first_id = await ingest_channel_message(db_session, parsed)
    await db_session.flush()
    second_id = await ingest_channel_message(db_session, parsed)
    await db_session.flush()

    assert first_id is not None
    assert second_id is None


async def test_ingest_drops_messages_for_unmapped_account(db_session):
    parsed = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="no-such-page",
        external_customer_id="customer-1",
        external_message_id="mid.111",
        text="hello",
    )

    message_id = await ingest_channel_message(db_session, parsed)

    assert message_id is None
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/domains/channels/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.channels'`

- [ ] **Step 4: Write the schema**

Create `backend/app/domains/channels/schemas.py`:

```python
from dataclasses import dataclass

from app.models import Channel


@dataclass
class ParsedInboundMessage:
    channel: Channel
    external_account_id: str
    external_customer_id: str
    external_message_id: str
    text: str
```

- [ ] **Step 5: Implement the service**

Create `backend/app/domains/channels/service.py`:

```python
import logging
from datetime import UTC, datetime

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.channels.schemas import ParsedInboundMessage
from app.models import ChannelConnection, ConvState, Conversation, Direction, Message
from app.models._ids import new_id

logger = logging.getLogger(__name__)


async def _find_channel_connection(session: AsyncSession, parsed: ParsedInboundMessage) -> ChannelConnection | None:
    result = await session.execute(
        select(ChannelConnection).where(
            ChannelConnection.channel == parsed.channel,
            ChannelConnection.external_account_id == parsed.external_account_id,
            ChannelConnection.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none()


async def _find_or_create_conversation(
    session: AsyncSession, channel_connection: ChannelConnection, customer_ref: str
) -> str:
    existing = await session.execute(
        select(Conversation.id).where(
            Conversation.channel_connection_id == channel_connection.id,
            Conversation.customer_ref == customer_ref,
        )
    )
    conversation_id = existing.scalar_one_or_none()
    if conversation_id is not None:
        return conversation_id

    now = datetime.now(UTC)
    insert_stmt = (
        pg_insert(Conversation)
        .values(
            id=new_id(),
            merchant_id=channel_connection.merchant_id,
            channel_connection_id=channel_connection.id,
            customer_ref=customer_ref,
            state=ConvState.NEW,
            slots={},
            last_message_at=now,
        )
        .on_conflict_do_nothing(
            index_elements=["channel_connection_id", "customer_ref"],
        )
        .returning(Conversation.id)
    )
    result = await session.execute(insert_stmt)
    conversation_id = result.scalar_one_or_none()
    if conversation_id is not None:
        return conversation_id

    # Lost the race to a concurrent webhook delivery for the same customer —
    # the row now exists, re-select it.
    existing = await session.execute(
        select(Conversation.id).where(
            Conversation.channel_connection_id == channel_connection.id,
            Conversation.customer_ref == customer_ref,
        )
    )
    return existing.scalar_one()


async def ingest_channel_message(session: AsyncSession, parsed: ParsedInboundMessage) -> str | None:
    channel_connection = await _find_channel_connection(session, parsed)
    if channel_connection is None:
        logger.warning(
            "unmapped_channel_account channel=%s external_account_id=%s",
            parsed.channel,
            parsed.external_account_id,
        )
        return None

    conversation_id = await _find_or_create_conversation(session, channel_connection, parsed.external_customer_id)

    insert_stmt = (
        pg_insert(Message)
        .values(
            id=new_id(),
            conversation_id=conversation_id,
            direction=Direction.INBOUND,
            raw_text=parsed.text,
            normalized_text=parsed.text,
            external_message_id=parsed.external_message_id,
        )
        .on_conflict_do_nothing(
            index_elements=["external_message_id"],
            index_where=text("external_message_id IS NOT NULL"),
        )
        .returning(Message.id)
    )
    result = await session.execute(insert_stmt)
    return result.scalar_one_or_none()
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/domains/channels/test_service.py -v`
Expected: PASS (4 tests).

- [ ] **Step 7: Run the full suite**

Run: `cd backend && uv run pytest -q`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/tests/conftest.py backend/app/domains/channels/__init__.py backend/app/domains/channels/schemas.py backend/app/domains/channels/service.py backend/tests/domains/channels/
git commit -m "feat: add channel ingestion service (find-or-create + idempotent insert)"
```

---

## Task 7: Meta (Facebook + Instagram) webhook parser and signature verification

**Files:**
- Create: `backend/app/domains/channels/meta.py`
- Test: `backend/tests/domains/channels/test_meta.py`

**Interfaces:**
- Consumes: `Channel`, `ParsedInboundMessage` (Tasks 2, 6).
- Produces: `verify_meta_signature(raw_body: bytes, signature_header: str | None) -> bool`; `parse_meta_payload(payload: dict) -> list[ParsedInboundMessage]` (`app/domains/channels/meta.py`). Consumed by Task 9 (router).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/channels/test_meta.py`:

```python
import hashlib
import hmac
import json

from app.core.config import settings
from app.domains.channels.meta import parse_meta_payload, verify_meta_signature
from app.models import Channel


def _sign(body: bytes) -> str:
    digest = hmac.new(settings.META_APP_SECRET.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def test_verify_meta_signature_accepts_valid_signature(monkeypatch):
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")
    body = b'{"object": "page"}'

    assert verify_meta_signature(body, _sign(body)) is True


def test_verify_meta_signature_rejects_wrong_signature(monkeypatch):
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")
    body = b'{"object": "page"}'

    assert verify_meta_signature(body, "sha256=" + "0" * 64) is False


def test_verify_meta_signature_rejects_when_secret_unset(monkeypatch):
    monkeypatch.setattr(settings, "META_APP_SECRET", "")
    body = b'{"object": "page"}'

    assert verify_meta_signature(body, _sign(body)) is False


def test_verify_meta_signature_rejects_missing_header(monkeypatch):
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")

    assert verify_meta_signature(b"{}", None) is False


def _messenger_payload(mid: str, text: str, *, is_echo: bool = False) -> dict:
    message: dict = {"mid": mid, "text": text}
    if is_echo:
        message["is_echo"] = True
    return {
        "object": "page",
        "entry": [
            {
                "id": "test-page-id",
                "time": 0,
                "messaging": [
                    {
                        "sender": {"id": "customer-1"},
                        "recipient": {"id": "test-page-id"},
                        "timestamp": 0,
                        "message": message,
                    }
                ],
            }
        ],
    }


def test_parse_meta_payload_extracts_messenger_text_message():
    payload = _messenger_payload("mid.111", "hello")

    parsed = parse_meta_payload(payload)

    assert len(parsed) == 1
    assert parsed[0].channel == Channel.FACEBOOK
    assert parsed[0].external_account_id == "test-page-id"
    assert parsed[0].external_customer_id == "customer-1"
    assert parsed[0].external_message_id == "mid.111"
    assert parsed[0].text == "hello"


def test_parse_meta_payload_maps_instagram_object_to_instagram_channel():
    payload = _messenger_payload("mid.111", "hello")
    payload["object"] = "instagram"

    parsed = parse_meta_payload(payload)

    assert parsed[0].channel == Channel.INSTAGRAM


def test_parse_meta_payload_drops_echo_messages():
    payload = _messenger_payload("mid.111", "hello", is_echo=True)

    assert parse_meta_payload(payload) == []


def test_parse_meta_payload_drops_non_text_messages():
    payload = _messenger_payload("mid.111", "")
    del payload["entry"][0]["messaging"][0]["message"]["text"]
    payload["entry"][0]["messaging"][0]["message"]["attachments"] = [{"type": "image", "payload": {}}]

    assert parse_meta_payload(payload) == []


def test_parse_meta_payload_ignores_unknown_object_type():
    payload = _messenger_payload("mid.111", "hello")
    payload["object"] = "something_else"

    assert parse_meta_payload(payload) == []


def test_parse_meta_payload_handles_multiple_entries_and_messages_in_one_batch():
    payload = _messenger_payload("mid.111", "hello")
    payload["entry"].append(
        {
            "id": "test-page-id",
            "time": 0,
            "messaging": [
                {
                    "sender": {"id": "customer-2"},
                    "recipient": {"id": "test-page-id"},
                    "timestamp": 0,
                    "message": {"mid": "mid.222", "text": "second customer"},
                }
            ],
        }
    )

    parsed = parse_meta_payload(payload)

    assert len(parsed) == 2
    assert {p.external_message_id for p in parsed} == {"mid.111", "mid.222"}


def test_round_trip_through_json_serialization():
    # Sanity check that the fixture payloads above are what a real request
    # body would deserialize to (json.dumps/loads round trip), not just a
    # Python-dict coincidence.
    payload = json.loads(json.dumps(_messenger_payload("mid.111", "hello")))
    assert parse_meta_payload(payload)[0].text == "hello"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/domains/channels/test_meta.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.channels.meta'`

- [ ] **Step 3: Implement**

Create `backend/app/domains/channels/meta.py`:

```python
import hashlib
import hmac

from app.core.config import settings
from app.domains.channels.schemas import ParsedInboundMessage
from app.models import Channel

_OBJECT_TO_CHANNEL = {
    "page": Channel.FACEBOOK,
    "instagram": Channel.INSTAGRAM,
}


def verify_meta_signature(raw_body: bytes, signature_header: str | None) -> bool:
    if not settings.META_APP_SECRET or not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(settings.META_APP_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    provided = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, provided)


def parse_meta_payload(payload: dict) -> list[ParsedInboundMessage]:
    channel = _OBJECT_TO_CHANNEL.get(payload.get("object"))
    if channel is None:
        return []

    parsed: list[ParsedInboundMessage] = []
    for entry in payload.get("entry", []):
        page_id = entry.get("id")
        for event in entry.get("messaging", []):
            message = event.get("message")
            if not message or message.get("is_echo"):
                continue
            text = message.get("text")
            if not text:
                continue
            parsed.append(
                ParsedInboundMessage(
                    channel=channel,
                    external_account_id=page_id,
                    external_customer_id=event["sender"]["id"],
                    external_message_id=message["mid"],
                    text=text,
                )
            )
    return parsed
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/domains/channels/test_meta.py -v`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/channels/meta.py backend/tests/domains/channels/test_meta.py
git commit -m "feat: add Meta webhook signature verification and payload parser"
```

---

## Task 8: Twilio WhatsApp webhook parser and signature verification

**Files:**
- Create: `backend/app/domains/channels/twilio_whatsapp.py`
- Test: `backend/tests/domains/channels/test_twilio_whatsapp.py`

**Interfaces:**
- Consumes: `Channel`, `ParsedInboundMessage` (Tasks 2, 6).
- Produces: `verify_twilio_signature(params: dict, signature_header: str | None) -> bool`; `parse_twilio_payload(params: dict) -> ParsedInboundMessage | None` (`app/domains/channels/twilio_whatsapp.py`). Consumed by Task 9 (router).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/channels/test_twilio_whatsapp.py`:

```python
from twilio.request_validator import RequestValidator

from app.core.config import settings
from app.domains.channels.twilio_whatsapp import parse_twilio_payload, verify_twilio_signature
from app.models import Channel

_PARAMS = {
    "MessageSid": "SM111",
    "From": "whatsapp:+201234567890",
    "To": "whatsapp:+14155238886",
    "Body": "hello",
    "ProfileName": "Test Customer",
    "NumMedia": "0",
}


def test_verify_twilio_signature_accepts_valid_signature(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "test-auth-token")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "https://api.example.com/webhooks/whatsapp/twilio")
    validator = RequestValidator("test-auth-token")
    signature = validator.compute_signature(settings.TWILIO_WEBHOOK_URL, _PARAMS)

    assert verify_twilio_signature(_PARAMS, signature) is True


def test_verify_twilio_signature_rejects_wrong_signature(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "test-auth-token")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "https://api.example.com/webhooks/whatsapp/twilio")

    assert verify_twilio_signature(_PARAMS, "not-a-real-signature") is False


def test_verify_twilio_signature_rejects_when_secret_unset(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "https://api.example.com/webhooks/whatsapp/twilio")
    validator = RequestValidator("test-auth-token")
    signature = validator.compute_signature(settings.TWILIO_WEBHOOK_URL, _PARAMS)

    assert verify_twilio_signature(_PARAMS, signature) is False


def test_verify_twilio_signature_rejects_missing_header(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "test-auth-token")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "https://api.example.com/webhooks/whatsapp/twilio")

    assert verify_twilio_signature(_PARAMS, None) is False


def test_parse_twilio_payload_extracts_inbound_message():
    parsed = parse_twilio_payload(_PARAMS)

    assert parsed is not None
    assert parsed.channel == Channel.WHATSAPP
    assert parsed.external_account_id == "whatsapp:+14155238886"
    assert parsed.external_customer_id == "whatsapp:+201234567890"
    assert parsed.external_message_id == "SM111"
    assert parsed.text == "hello"


def test_parse_twilio_payload_drops_media_only_messages_with_no_body():
    params = dict(_PARAMS)
    params["Body"] = ""
    params["NumMedia"] = "1"

    assert parse_twilio_payload(params) is None


def test_parse_twilio_payload_returns_none_for_incomplete_params():
    assert parse_twilio_payload({"Body": "hello"}) is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/domains/channels/test_twilio_whatsapp.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.channels.twilio_whatsapp'`

- [ ] **Step 3: Implement**

Create `backend/app/domains/channels/twilio_whatsapp.py`:

```python
from twilio.request_validator import RequestValidator

from app.core.config import settings
from app.domains.channels.schemas import ParsedInboundMessage
from app.models import Channel


def verify_twilio_signature(params: dict, signature_header: str | None) -> bool:
    if not settings.TWILIO_AUTH_TOKEN or not signature_header:
        return False
    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    return validator.validate(settings.TWILIO_WEBHOOK_URL, params, signature_header)


def parse_twilio_payload(params: dict) -> ParsedInboundMessage | None:
    body = params.get("Body")
    from_number = params.get("From")
    to_number = params.get("To")
    message_sid = params.get("MessageSid")
    if not body or not from_number or not to_number or not message_sid:
        return None

    return ParsedInboundMessage(
        channel=Channel.WHATSAPP,
        external_account_id=to_number,
        external_customer_id=from_number,
        external_message_id=message_sid,
        text=body,
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/domains/channels/test_twilio_whatsapp.py -v`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/channels/twilio_whatsapp.py backend/tests/domains/channels/test_twilio_whatsapp.py
git commit -m "feat: add Twilio WhatsApp webhook signature verification and parser"
```

---

## Task 9: Webhook router

**Files:**
- Create: `backend/app/domains/channels/router.py`
- Modify: `backend/app/api/router.py`
- Test: `backend/tests/domains/channels/test_router.py`

**Interfaces:**
- Consumes: `verify_meta_signature`, `parse_meta_payload` (Task 7); `verify_twilio_signature`, `parse_twilio_payload` (Task 8); `ingest_channel_message` (Task 6); `get_arq_pool` (Task 5); `get_db` (existing, `app/core/database.py`).
- Produces: `GET /webhooks/meta`, `POST /webhooks/meta`, `POST /webhooks/whatsapp/twilio` — consumed by Meta/Twilio in production, and by this task's HTTP-level tests.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/channels/test_router.py`:

```python
import hashlib
import hmac
import json

from httpx import ASGITransport, AsyncClient
from twilio.request_validator import RequestValidator

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_arq_pool
from app.main import app
from app.models import Channel, ChannelConnection, Message, WebhookEvent
from sqlalchemy import select


def _sign_meta(body: bytes) -> str:
    digest = hmac.new(settings.META_APP_SECRET.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def _messenger_body(mid: str, text: str) -> bytes:
    payload = {
        "object": "page",
        "entry": [
            {
                "id": "test-page-id",
                "time": 0,
                "messaging": [
                    {
                        "sender": {"id": "customer-1"},
                        "recipient": {"id": "test-page-id"},
                        "timestamp": 0,
                        "message": {"mid": mid, "text": text},
                    }
                ],
            }
        ],
    }
    return json.dumps(payload).encode("utf-8")


async def test_meta_get_verify_echoes_challenge(monkeypatch):
    monkeypatch.setattr(settings, "META_VERIFY_TOKEN", "test-verify-token")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/webhooks/meta",
            params={"hub.mode": "subscribe", "hub.verify_token": "test-verify-token", "hub.challenge": "12345"},
        )

    assert response.status_code == 200
    assert response.text == "12345"
    assert response.headers["content-type"].startswith("text/plain")


async def test_meta_get_verify_rejects_wrong_token(monkeypatch):
    monkeypatch.setattr(settings, "META_VERIFY_TOKEN", "test-verify-token")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/webhooks/meta",
            params={"hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "12345"},
        )

    assert response.status_code == 403


async def test_meta_post_rejects_invalid_signature(monkeypatch, db_session, fake_arq_pool):
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_arq_pool] = lambda: fake_arq_pool
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/webhooks/meta",
                content=_messenger_body("mid.111", "hello"),
                headers={"X-Hub-Signature-256": "sha256=" + "0" * 64, "content-type": "application/json"},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_arq_pool, None)

    assert response.status_code == 403
    assert not fake_arq_pool.enqueued


async def test_meta_post_creates_message_and_enqueues_job(monkeypatch, db_session, channel_connection, fake_arq_pool):
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")
    body = _messenger_body("mid.111", "hello")

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_arq_pool] = lambda: fake_arq_pool
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/webhooks/meta",
                content=body,
                headers={"X-Hub-Signature-256": _sign_meta(body), "content-type": "application/json"},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_arq_pool, None)

    assert response.status_code == 200
    assert len(fake_arq_pool.enqueued) == 1
    function_name, args, _ = fake_arq_pool.enqueued[0]
    assert function_name == "process_channel_message"
    message = await db_session.get(Message, args[0])
    assert message.raw_text == "hello"

    events = (await db_session.execute(select(WebhookEvent))).scalars().all()
    assert len(events) == 1
    assert events[0].processing_error is None


async def test_meta_post_duplicate_delivery_does_not_double_enqueue(
    monkeypatch, db_session, channel_connection, fake_arq_pool
):
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")
    body = _messenger_body("mid.111", "hello")

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_arq_pool] = lambda: fake_arq_pool
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = {"X-Hub-Signature-256": _sign_meta(body), "content-type": "application/json"}
            await client.post("/webhooks/meta", content=body, headers=headers)
            await client.post("/webhooks/meta", content=body, headers=headers)
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_arq_pool, None)

    assert len(fake_arq_pool.enqueued) == 1


async def test_meta_post_unparseable_body_still_returns_200(monkeypatch, db_session, fake_arq_pool):
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")
    body = b"not json"

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_arq_pool] = lambda: fake_arq_pool
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/webhooks/meta",
                content=body,
                headers={"X-Hub-Signature-256": _sign_meta(body), "content-type": "application/json"},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_arq_pool, None)

    assert response.status_code == 200
    events = (await db_session.execute(select(WebhookEvent))).scalars().all()
    assert len(events) == 1
    assert events[0].processing_error is not None


async def test_twilio_post_creates_message_and_enqueues_job(monkeypatch, db_session, merchant, fake_arq_pool):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "test-auth-token")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "http://test/webhooks/whatsapp/twilio")

    connection = ChannelConnection(
        merchant_id=merchant.id,
        channel=Channel.WHATSAPP,
        external_account_id="whatsapp:+14155238886",
    )
    db_session.add(connection)
    await db_session.flush()

    params = {
        "MessageSid": "SM111",
        "From": "whatsapp:+201234567890",
        "To": "whatsapp:+14155238886",
        "Body": "hello",
        "NumMedia": "0",
    }
    signature = RequestValidator("test-auth-token").compute_signature(settings.TWILIO_WEBHOOK_URL, params)

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_arq_pool] = lambda: fake_arq_pool
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/webhooks/whatsapp/twilio",
                data=params,
                headers={"X-Twilio-Signature": signature},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_arq_pool, None)

    assert response.status_code == 200
    assert len(fake_arq_pool.enqueued) == 1


async def test_twilio_post_rejects_invalid_signature(monkeypatch, db_session, fake_arq_pool):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "test-auth-token")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "http://test/webhooks/whatsapp/twilio")

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_arq_pool] = lambda: fake_arq_pool
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/webhooks/whatsapp/twilio",
                data={"MessageSid": "SM111", "From": "whatsapp:+201234567890", "To": "whatsapp:+14155238886", "Body": "hi"},
                headers={"X-Twilio-Signature": "not-real"},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_arq_pool, None)

    assert response.status_code == 403
    assert not fake_arq_pool.enqueued
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/domains/channels/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.channels.router'`

- [ ] **Step 3: Implement the router**

Create `backend/app/domains/channels/router.py`:

```python
import hmac
import json
import logging

from arq import ArqRedis
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_arq_pool
from app.domains.channels.meta import parse_meta_payload, verify_meta_signature
from app.domains.channels.service import ingest_channel_message
from app.domains.channels.twilio_whatsapp import parse_twilio_payload, verify_twilio_signature
from app.models import Channel, WebhookEvent

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/meta")
async def verify_meta_webhook(request: Request) -> PlainTextResponse:
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge", "")
    if (
        mode == "subscribe"
        and token is not None
        and settings.META_VERIFY_TOKEN
        and hmac.compare_digest(token, settings.META_VERIFY_TOKEN)
    ):
        return PlainTextResponse(challenge)
    raise HTTPException(status_code=403, detail="verification failed")


@router.post("/meta")
async def receive_meta_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    arq_pool: ArqRedis = Depends(get_arq_pool),
) -> dict:
    raw_body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")
    if not verify_meta_signature(raw_body, signature):
        raise HTTPException(status_code=403, detail="invalid signature")

    payload = None
    processing_error: str | None = None
    parsed_messages = []
    try:
        payload = json.loads(raw_body)
        parsed_messages = parse_meta_payload(payload)
    except Exception as exc:  # noqa: BLE001 - webhook boundary: log and ack, never let Meta retry-storm us
        processing_error = str(exc)
        logger.warning("meta_webhook_parse_failed error=%s", exc)

    channel = Channel.INSTAGRAM if isinstance(payload, dict) and payload.get("object") == "instagram" else Channel.FACEBOOK
    db.add(WebhookEvent(channel=channel, raw_payload=payload, processing_error=processing_error))

    new_message_ids = []
    for parsed in parsed_messages:
        message_id = await ingest_channel_message(db, parsed)
        if message_id:
            new_message_ids.append(message_id)

    await db.commit()

    for message_id in new_message_ids:
        await arq_pool.enqueue_job("process_channel_message", message_id)

    return {"status": "received"}


@router.post("/whatsapp/twilio")
async def receive_twilio_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    arq_pool: ArqRedis = Depends(get_arq_pool),
) -> dict:
    form = await request.form()
    params = dict(form)
    signature = request.headers.get("X-Twilio-Signature")
    if not verify_twilio_signature(params, signature):
        raise HTTPException(status_code=403, detail="invalid signature")

    processing_error: str | None = None
    parsed = None
    try:
        parsed = parse_twilio_payload(params)
    except Exception as exc:  # noqa: BLE001 - webhook boundary: log and ack, never let Twilio retry-storm us
        processing_error = str(exc)
        logger.warning("twilio_webhook_parse_failed error=%s", exc)

    db.add(WebhookEvent(channel=Channel.WHATSAPP, raw_payload=params, processing_error=processing_error))

    new_message_id = None
    if parsed is not None:
        new_message_id = await ingest_channel_message(db, parsed)

    await db.commit()

    if new_message_id:
        await arq_pool.enqueue_job("process_channel_message", new_message_id)

    return {"status": "received"}
```

- [ ] **Step 4: Register the router**

In `backend/app/api/router.py`, replace the full file:

```python
from app.domains.channels.router import router as channels_router
from app.domains.conversations.router import router as conversations_router
from app.domains.health.router import router as health_router
from app.domains.messages.router import router as messages_router
from app.domains.products.router import router as products_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(messages_router, prefix="/messages", tags=["messages"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(conversations_router, prefix="/conversations", tags=["conversations"])
api_router.include_router(channels_router, prefix="/webhooks", tags=["webhooks"])
```

(Keep the `from fastapi import APIRouter` import line that was already at the top of the file.)

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/domains/channels/test_router.py -v`
Expected: PASS (9 tests).

- [ ] **Step 6: Run the full suite**

Run: `cd backend && uv run pytest -q`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/app/domains/channels/router.py backend/app/api/router.py backend/tests/domains/channels/test_router.py
git commit -m "feat: add Meta and Twilio webhook endpoints"
```

---

## Task 10: arq worker

**Files:**
- Create: `backend/app/worker.py`
- Modify: `backend/Makefile`
- Modify: `ecosystem.config.js`
- Test: `backend/tests/test_worker.py`

**Interfaces:**
- Consumes: `process_message` (Task 4), `conversation_lock` (Task 5).
- Produces: `_process_channel_message(session, lock_cm, message_id) -> None` (unit-testable core logic); `process_channel_message(ctx, message_id) -> None` (the arq-registered entry point); `WorkerSettings` class. Consumed only by the arq CLI at runtime (`arq app.worker.WorkerSettings`) and by this task's test.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_worker.py`:

```python
from contextlib import asynccontextmanager

from app.models import Channel, ChannelConnection, ConvState, Conversation, Direction, Message
from app.models._ids import new_id
from app.worker import _process_channel_message


@asynccontextmanager
async def _noop_lock(_conversation_id: str):
    yield


async def test_process_channel_message_classifies_tier0_message(db_session, merchant, mock_ai):
    connection = ChannelConnection(merchant_id=merchant.id, channel=Channel.FACEBOOK, external_account_id="page-1")
    db_session.add(connection)
    await db_session.flush()

    conversation = Conversation(
        merchant_id=merchant.id,
        channel_connection_id=connection.id,
        customer_ref="customer-1",
        state=ConvState.NEW,
        slots={},
        last_message_at=__import__("datetime").datetime.now(__import__("datetime").UTC),
    )
    db_session.add(conversation)
    await db_session.flush()

    message = Message(
        id=new_id(),
        conversation_id=conversation.id,
        direction=Direction.INBOUND,
        raw_text="👍",
        normalized_text="👍",
        external_message_id="mid.111",
    )
    db_session.add(message)
    await db_session.flush()

    await _process_channel_message(db_session, _noop_lock, message.id)

    await db_session.refresh(message)
    assert message.intent == "reaction"
    assert not mock_ai.calls


async def test_process_channel_message_is_a_noop_for_unknown_message_id(db_session):
    # Should not raise even if the row vanished (e.g. a stale/duplicate job) —
    # arq's own retry policy handles transient errors, this handles the
    # legitimate case of "nothing to do".
    await _process_channel_message(db_session, _noop_lock, "does-not-exist")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_worker.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.worker'`

- [ ] **Step 3: Implement the worker**

Create `backend/app/worker.py`:

```python
from collections.abc import Callable
from contextlib import AbstractAsyncContextManager
from functools import partial

from arq.connections import RedisSettings
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_maker
from app.core.locks import conversation_lock
from app.engine.pipeline import process_message
from app.models import Conversation, Message


async def _process_channel_message(
    session: AsyncSession,
    lock_cm: Callable[[str], AbstractAsyncContextManager[None]],
    message_id: str,
) -> None:
    message = await session.get(Message, message_id)
    if message is None:
        return
    conversation = await session.get(Conversation, message.conversation_id)
    async with lock_cm(conversation.id):
        await process_message(session, conversation, message)
        await session.commit()


async def process_channel_message(ctx: dict, message_id: str) -> None:
    async with async_session_maker() as session:
        lock_cm = partial(conversation_lock, ctx["redis"])
        await _process_channel_message(session, lock_cm, message_id)


class WorkerSettings:
    functions = [process_channel_message]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_worker.py -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire up a `make worker` target**

In `backend/Makefile`, apply this diff:

Find:
```makefile
.PHONY: run dev test lint format migrate upgrade db-bash seed
```
Replace with:
```makefile
.PHONY: run dev worker test lint format migrate upgrade db-bash seed
```

Find:
```makefile
dev:
	uv run uvicorn app.main:app --reload
```
Replace with:
```makefile
dev:
	uv run uvicorn app.main:app --reload

worker:
	uv run arq app.worker.WorkerSettings
```

- [ ] **Step 6: Add the worker as a pm2 process**

In `ecosystem.config.js`, apply this diff:

Find:
```javascript
    {
      name: 'tijaratk-bot-backend',
      script: 'uv',
      args: 'run uvicorn app.main:app --host 127.0.0.1 --port 8000',
      cwd: './backend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 8000 // You can change this port to whatever your Nginx proxy expects for the backend
      }
    }
  ]
};
```
Replace with:
```javascript
    {
      name: 'tijaratk-bot-backend',
      script: 'uv',
      args: 'run uvicorn app.main:app --host 127.0.0.1 --port 8000',
      cwd: './backend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 8000 // You can change this port to whatever your Nginx proxy expects for the backend
      }
    },
    {
      name: 'tijaratk-bot-worker',
      script: 'uv',
      args: 'run arq app.worker.WorkerSettings',
      cwd: './backend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

- [ ] **Step 7: Run the full suite**

Run: `cd backend && uv run pytest -q`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/app/worker.py backend/Makefile ecosystem.config.js backend/tests/test_worker.py
git commit -m "feat: add arq worker for deferred channel-message processing"
```

---

## Task 11: Docs and final verification

**Files:**
- Modify: `README.md`
- Modify: `ROADMAP.md`
- Modify: `CLAUDE.md` (root)

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update `README.md`**

Remove "Channel/webhook ingestion (Facebook, Instagram, WhatsApp)" from the "Not yet built" list, and add a line to the "built" section describing it: webhook endpoints at `/webhooks/meta` (Facebook + Instagram) and `/webhooks/whatsapp/twilio` (WhatsApp via Twilio) verify, deduplicate, and persist inbound messages, then enqueue them to an `arq`/Redis worker that runs the existing classification pipeline — `ChannelConnection` rows must be provisioned manually (no onboarding UI yet); outbound replies are not implemented.

- [ ] **Step 2: Update `ROADMAP.md`**

Move "Channel/webhook ingestion" from "Near-term — MVP gap-closers" to done, noting explicitly: text-only, inbound-only, `ChannelConnection` provisioned manually, WhatsApp via Twilio (not Meta Cloud API directly).

- [ ] **Step 3: Update `CLAUDE.md` (root) prerequisites**

In the "Commands" section's prerequisite paragraph, add: a running Redis (`redis://localhost:6379/0` by default) is now also required for `make test` (Task 5's lock tests) and for `make worker` in development. Also add `make worker` to the commands list (`uv run arq app.worker.WorkerSettings`), and update the "No channel/webhook integration exists yet" sentence in the "What this is" section to describe what now exists (webhook endpoints exist and create conversations from real customer messages; outbound sending still does not exist).

- [ ] **Step 4: Full-suite verification**

Run: `cd backend && uv run pytest -q && uv run ruff check . && uv run ruff format --check .`
Expected: all PASS, no lint/format violations.

Run: `cd backend && uv run alembic upgrade head` (idempotent — confirm it's a no-op if already at head from Task 3).
Expected: "Already at head" or equivalent, no errors.

- [ ] **Step 5: Manual boot-and-curl check**

Run (in one terminal): `cd backend && make dev`
Run (in another terminal):
```bash
curl -s "http://localhost:8000/webhooks/meta?hub.mode=subscribe&hub.verify_token=<value from your local .env META_VERIFY_TOKEN>&hub.challenge=12345"
```
Expected: response body is exactly `12345` (plain text, not JSON).

Run (in a third terminal, after setting `META_VERIFY_TOKEN`/`META_APP_SECRET` in `.env` and restarting `make dev`): `cd backend && make worker`
Expected: arq worker starts and logs that it's listening for jobs on the configured Redis, no import errors.

- [ ] **Step 6: `git status` clean check**

Run: `git status --short`
Expected: no unexpected untracked/modified files beyond what was committed in Tasks 1–10 plus this task's doc edits.

- [ ] **Step 7: Commit**

```bash
git add README.md ROADMAP.md CLAUDE.md
git commit -m "docs: mark channel/webhook ingestion as built"
```

---

## Verification (end-to-end)

1. `cd backend && uv sync && uv run alembic upgrade head` — schema is current.
2. Start local Redis (`redis-server` or `docker run -p 6379:6379 redis`) and Postgres.
3. `cd backend && uv run pytest -q` — full suite passes, including Task 5/6/7/8/9/10's new tests (Task 5's lock tests need live Redis; everything else is fully mocked/DB-only).
4. `cd backend && uv run ruff check . && uv run ruff format --check .` — clean.
5. Manual check per Task 11 Step 5 — GET verify handshake and worker boot both work against a real `.env`.
6. Insert one `ChannelConnection` row manually (e.g. via `psql` or a one-off Python shell using the seeded merchant from `make seed`) and, with `ngrok`/a public tunnel pointed at local `make dev`, configure a real Meta App's webhook or Twilio's WhatsApp Sandbox to hit it, then send a real message from a phone — confirm a `Conversation`/`Message` row appears and, once `make worker` classifies it, `Message.intent` gets populated. (This last step needs real platform credentials and is a manual smoke test, not part of the automated suite.)

## Execution options

Two ways to run this once approved:

1. **Subagent-Driven (recommended)** — a fresh subagent per task, with review between tasks.
2. **Inline Execution** — batch execution in this session with checkpoints for review.
