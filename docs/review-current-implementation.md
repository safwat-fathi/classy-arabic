# Backend review & remediation plan — classy-arabic (`backend/`)

## Context

Full read of `backend/` (~2.1k LoC across `app/`, `scripts/`, `tests/`, `alembic/`) against
`message-classification-ai-engine-spec.md` §3–§7 and `CLAUDE.md`.

The three-tier skeleton is sound and the pure engine functions (`tier0_rules`, `context_budget`,
`confidence`, `routing_policy`, `schemas`) are well-factored and well-tested. The defects cluster
in the **wiring**:

1. `app/engine/pipeline.py` — where the pure pieces get composed. Every prompt is malformed, the
   context ceiling is unenforced, and empty orders auto-confirm.
2. The AI call sites — no timeout, no error handling, so a provider hiccup destroys the inbound
   message rather than degrading.
3. The discovery→deployment loop — clustering writes `LabeledExample` rows that nothing ever reads.

Everything below is from code reading. Three items marked **[verify]** are high-confidence from
library semantics but one runtime check settles them; those checks are step 0 of Phase 1.

The intended outcome is that the engine described in the spec actually behaves as specified end
to end: correct prompts, an enforced context budget, all five escalation triggers live and
recorded, and no customer message lost to a model outage.

---

## Scope & phasing

| Phase | Theme                               | Blocking? | Touches                                                                  |
| ----- | ----------------------------------- | --------- | ------------------------------------------------------------------------ |
| 0     | Baseline + confirm `[verify]` items | —         | nothing                                                                  |
| 1     | Correctness blockers                | yes       | `pipeline.py`, `clients.py`, call sites                                  |
| 2     | Escalation policy correctness       | no        | `routing_policy.py`, `classification.py`, `extraction.py`, `pipeline.py` |
| 3     | Close the learning loop             | no        | `pipeline.py`, `embeddings.py`, `context_budget.py`                      |
| 4     | Ops, security, schema               | no        | `main.py`, `config.py`, `database.py`, router, migration                 |
| 5     | Nits & cleanup                      | no        | scripts, tests, `pyproject.toml`                                         |

Phases 1–4 are independent of each other and can land as separate commits. Within Phase 1, B1–B4
are also independent.

**Out of scope** (flag, don't build): the merchant review endpoint that R7 depends on;
channel/webhook ingestion; server-side normalization; per-merchant intent taxonomies (the open
design question in `docs/2026-08-22-classification-pipeline-debugging.md` §8).

---

## Phase 0 — Baseline

1. `cd backend && make test` — record what passes today. `tests/conftest.py` binds to the **real
   dev database** via `app.core.database.engine`, so Postgres with `pgvector` must be up.
2. **[verify] B1:** temporarily `print(prompt)` in `process_message` after `build_context_prompt`,
   then `POST` one message to a conversation with no prior history. Either the `customer:` line
   appears twice or it doesn't.
3. **[verify] R10:** same request — grep stdout for `ai_call tier=`. Absence confirms the log
   records are being dropped.

Do not start Phase 1 until 2 and 3 are settled; both change what the fix looks like.

---

## Phase 1 — Correctness blockers

### B1 — Every prompt contains the current message twice

**File:** `app/engine/pipeline.py:52-75`

`session.add(message)` (L58) leaves the row pending. `session.execute(select(Message)...)` (L69)
**autoflushes** it — autoflush defaults on and `app/core/database.py:8` doesn't disable it. The
message being classified is therefore _inside_ `history`, and `build_context_prompt` appends it
again as `current_line`. `created_at` is `func.now()` (transaction time) so it sorts newest and
lands immediately adjacent to its own duplicate:

```
slots: {}
customer: عايزة اطلب الفستان الصيفي
customer: عايزة اطلب الفستان الصيفي   ← same message, twice
```

This affects every non-tier-0 message including the first message of a conversation, and is a
plausible residual contributor to the misclassification chain documented in
`docs/2026-08-22-classification-pipeline-debugging.md`.

**Change:** read history _before_ the message exists in the session. Reorder `process_message`:

```python
async def process_message(session, conversation, raw_text, normalized_text) -> PipelineResult:
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

    message = Message(...)
    session.add(message)
    conversation.last_message_at = datetime.now(UTC)
    ...
```

Prefer this over `.where(Message.id != message.id)` — it keeps the INSERT out of the read path
entirely rather than relying on a filter to undo an unwanted flush.

**Test:** `tests/engine/test_pipeline.py` — new test asserting the prompt sent to the mocked
NileChat endpoint contains `normalized_text` exactly once. Read it off `mock_ai.calls[0]`'s
request body rather than adding a return value to `process_message`.

### B2 — The 2048-token ceiling is enforced nowhere

**Files:** `app/engine/context_budget.py:16-32`, `app/engine/pipeline.py:77-88`,
`app/engine/classification.py:56-71`

`build_context_prompt` computes `overflowed` but never trims, and `classify_message` is never
told about it — only `extract_order` receives it (`pipeline.py:100`). An over-budget prompt is
sent to NileChat verbatim on the classification path, which spec §4 trigger 3 explicitly forbids:
_"Don't silently truncate and hope; route to DeepSeek v4 Flash (Tier 2), which has a much larger
context window and can use the full thread."_ Spec §3 also has the assembler trimming to fit;
there is no trimming code.

**Change:** treat overflow as a **pre-flight route**, not a post-hoc re-run trigger (this is the
same design point as R6 — implement them together if doing both phases). Concretely:

- `classify_message` gains an `overflowed: bool` parameter.
- When `overflowed` is true, skip the tier-1 call entirely and issue the tier-2 call directly,
  returning `("escalated", "context_budget_overflow")`.
- Same in `extract_order` — it currently makes the doomed NileChat call first, then re-runs.

Deliberately **not** trimming: the spec's routing answer supersedes its assembler sentence, and
routing to a large-context model preserves the full thread, which trimming does not. Note this
choice in a comment so the next reader doesn't re-add trimming.

**Test:** `test_classification.py` / `test_extraction.py` — assert that with `overflowed=True`
the NileChat endpoint receives **zero** calls and the reason is `context_budget_overflow`.

### B3 — Empty orders auto-confirm

**File:** `app/engine/pipeline.py:105-109`

```python
status = (
    OrderStatus.AUTO_CONFIRMED
    if not extraction.ambiguous_fields and extraction.confidence >= settings.CLASSIFICATION_CONFIDENCE_THRESHOLD
    else OrderStatus.PENDING_REVIEW
)
```

An extraction returning `line_items: []` with confidence 0.9 becomes `AUTO_CONFIRMED` — an order
with nothing in it, past merchant review. `tests/engine/test_pipeline.py:65-84` currently asserts
exactly this, so the test changes with the code.

**Change:**

```python
status = (
    OrderStatus.AUTO_CONFIRMED
    if extraction.line_items
    and not extraction.ambiguous_fields
    and extraction.confidence >= settings.CLASSIFICATION_CONFIDENCE_THRESHOLD
    else OrderStatus.PENDING_REVIEW
)
```

**Test:** flip `test_purchase_intent_in_gathering_creates_order` to assert `PENDING_REVIEW` for
empty `line_items`; add a companion with one real line item asserting `AUTO_CONFIRMED`.

### B4 — Any AI hiccup drops the inbound message

**Files:** `app/engine/classification.py:50-53`, `extraction.py:27-30`, `embeddings.py:14-16`,
`product_matching.py:17`, `app/engine/clients.py:11-20`,
`app/domains/messages/router.py:11-18`

No call site handles failure. A provider 5xx/429, a timeout, `message.content is None`, or
non-JSON content raises out of `process_message` → `router.py:17`'s `await db.commit()` never
runs → `get_db`'s context manager closes and rolls back → **the message row is gone**, not
merely unclassified. `AsyncOpenAI` also defaults to a **600 s** timeout, on a synchronous ingest
path.

**Change, three parts:**

1. **Bound the calls** (folds into R5's singleton change):

   ```python
   # app/engine/clients.py
   _nilechat = AsyncOpenAI(
       base_url=settings.NILECHAT_BASE_URL,
       api_key=settings.NILECHAT_API_KEY,
       timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
       max_retries=settings.AI_MAX_RETRIES,
   )
   ```

   New settings: `AI_REQUEST_TIMEOUT_SECONDS: float = 30.0`, `AI_MAX_RETRIES: int = 2`.

2. **Guard the parse** — one shared helper rather than duplicating in `classification.py` and
   `extraction.py`:

   ```python
   # app/engine/clients.py
   class AICallError(Exception):
       """Model call failed or returned unusable content."""

   def parse_json_content(response) -> dict:
       content = response.choices[0].message.content
       if not content:
           raise AICallError("empty content")
       try:
           return json.loads(content)
       except json.JSONDecodeError as exc:
           raise AICallError(f"non-json content: {content[:200]!r}") from exc
   ```

   Wrap `client.chat.completions.create(...)` in `try/except (APIError, APITimeoutError)` →
   `AICallError`. Also catch `pydantic.ValidationError` from `model_validate` — a model can emit
   valid JSON with `confidence: -0.5`, which `Field(ge=0.0)` rejects.

3. **Never lose the message** — in `process_message`, wrap the AI section so a failure still
   persists the row:
   ```python
   try:
       classification, tier, reason = await classify_message(...)
   except AICallError as exc:
       logger.warning("classification_failed message_id=%s error=%s", message.id, exc)
       message.escalation_reason = "ai_call_failed"
       await session.flush()
       return PipelineResult(message=message, order=None)
   ```
   `Message.intent`, `intent_confidence`, and `model_tier` are all already nullable
   (`app/models/message.py:23-25`), so an unclassified row is representable. The router returns
   200 with `intent: null` — the message is retained and can be reprocessed. Decide explicitly
   whether the response status should be 200 or 202; 200 keeps the response model unchanged.

**Test:** `test_pipeline.py` — mock a 500 and a malformed-JSON body from the NileChat endpoint;
assert `result.message.id` is set, `result.order is None`, and no exception escapes.
`test_messages_router.py` — same via HTTP, asserting the status is not 500.

---

## Phase 2 — Escalation policy correctness

### R5 — A new `AsyncOpenAI` (and connection pool) per call

**File:** `app/engine/clients.py:11-20`

`get_nilechat_client()` / `get_deepseek_client()` / `get_embedding_client()` construct a fresh
client on every classification, extraction, and embedding — and `product_matching.py:17` does one
**per line item**. None are closed. The debugging log §2 removed the explicit
`http_client=httpx.AsyncClient()`, which stopped the fd leak; the per-call construction remains,
so every call gets a cold pool with no keep-alive reuse.

**Change:** module-level singletons (`AsyncOpenAI` is safe to share across tasks). Keep the
`get_*_client()` function names so call sites are untouched — they become accessors. Dispose in
`app/main.py`'s `lifespan`, which is currently an empty shell:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()          # R10
    yield
    await close_ai_clients()     # await client.close() for each
    await engine.dispose()
```

### R6 — Escalation triggers 3 and 5 fire too late, and 5 not at all

**Files:** `app/engine/extraction.py:33-49`, `routing_policy.py:30-58`,
`classification.py:56-71`

Three related defects:

- `extract_order` never passes `text=` to `evaluate_escalation`, so `check_reasoning_heavy("")`
  computes `density = 0/1`, `len(text) = 0`, no conditional markers → always `None`. **Trigger 5
  is dead in production.** `tests/engine/test_routing_policy.py` passes `text=` on every case,
  which is why the unit tests pass and the behavior is still absent.
- Overflow (trigger 3) and reasoning-heaviness (trigger 5) are both knowable from the prompt
  _before_ the tier-1 call. Evaluating them post-hoc burns a NileChat call that was always going
  to be discarded.
- `classify_message:67` calls `check_confidence_threshold` directly instead of
  `evaluate_escalation`, so classification can never escalate for overflow or reasoning —
  contradicting CLAUDE.md's "escalation triggers are centralized in
  `routing_policy.py::evaluate_escalation`".

**Change:** split the policy in `routing_policy.py` along the axis that already exists implicitly:

```python
def evaluate_preflight(*, text: str, overflowed: bool, correction_count: int) -> str | None:
    """Triggers knowable before any model call — route straight to tier 2."""
    for reason in (
        check_context_overflow(overflowed),
        check_repeated_correction(correction_count),
        check_reasoning_heavy(text),
    ):
        if reason:
            return reason
    return None


def evaluate_postflight(*, confidence: float, threshold: float,
                        ambiguous_fields: list[str] | None = None) -> str | None:
    """Triggers only knowable from tier-1 output — re-run on tier 2."""
    for reason in (
        check_confidence_threshold(confidence, threshold),
        check_ambiguous_fields(ambiguous_fields or []),
    ):
        if reason:
            return reason
    return None
```

Keep `evaluate_escalation` as a thin wrapper over both if anything outside the engine depends on
it; otherwise remove it and update `test_routing_policy.py`. Both `classify_message` and
`extract_order` then take the same shape: pre-flight check → tier 2 direct, else tier 1 →
post-flight check → tier 2 re-run. `process_message` passes `normalized_text` as `text` and the
real `overflowed` / `correction_count` to **both**.

The per-trigger reason strings must not change — `Message.escalation_reason` is the fine-tuning
signal and existing rows use those values.

**Test:** for each of the five triggers, a `test_pipeline.py` case asserting the persisted
`ModelTier.ESCALATED` and the exact reason string (this is R14). For the pre-flight triggers,
also assert the NileChat endpoint received zero calls.

### R7 — Trigger 4 (`repeated_correction`) is unreachable, and miscounts when it isn't

**File:** `app/engine/pipeline.py:39-46`

Nothing in the codebase ever writes `Order.confirmed_payload` or sets status `REJECTED` /
`CONFIRMED` — there is no merchant review endpoint. `_correction_count` therefore returns 0 for
every conversation and trigger 4 is dead. Separately, when those writes do land the predicate is
wrong: `confirmed_payload IS NOT NULL` counts an accepted-as-is confirmation as a _correction_,
so two clean confirmations would escalate the rest of the thread to DeepSeek permanently.

**Change:** narrow the predicate now, since it's a one-line fix that stops a future cost bug:

```python
select(func.count(Order.id)).where(
    Order.conversation_id == conversation_id,
    or_(
        Order.status == OrderStatus.REJECTED,
        and_(Order.confirmed_payload.is_not(None),
             Order.confirmed_payload != Order.extracted_payload),
    ),
)
```

A JSON `!=` comparison in Postgres is order-sensitive for object keys, so this is a heuristic. If
it proves noisy, the durable answer is a dedicated `Order.corrected_at` column set by the review
endpoint. **Flag in the commit message that trigger 4 stays dead until that endpoint exists** —
this fix makes it correct, not live.

### R8 — Escalation reasons are silently dropped

**File:** `app/engine/pipeline.py:118-119`

```python
if extraction_reason and not message.escalation_reason:
    message.escalation_reason = extraction_reason
```

When classification _and_ extraction both escalate for different reasons, the extraction reason
is discarded. CLAUDE.md calls this field "the primary signal for what to fine-tune next," so the
schema is losing exactly what it exists to capture — and the loss is invisible.

**Change:** add `Order.escalation_reason: str | None` (the extraction reason belongs to the order
anyway) and write it unconditionally; leave `Message.escalation_reason` for the classification
reason alone. Needs the Phase 4 migration. Update `MessageIngestResponse` if the reason should
surface in the API response.

### R16a — Tier-2 calls run at the provider's default temperature

**Files:** `app/engine/classification.py:69`, `extraction.py:47`

The escalated `_call(...)` passes no `temperature`, so a strict-JSON task runs at ~1.0. The
debugging log §6 deliberately scoped `NILECHAT_TEMPERATURE` to taming local-model variance, which
was right at the time, but a schema-constrained extraction on tier 2 still wants a low value.

**Change:** `DEEPSEEK_TEMPERATURE: float = 0.1` in `Settings` + `.env.example`, passed on the
escalated calls.

---

## Phase 3 — Close the learning loop

### R9 — Clustering output is a write-only sink

**Files:** `app/clustering/job.py:73-96`, `app/engine/embeddings.py:19-31`,
`app/engine/pipeline.py:33-36`, `app/engine/classification.py:12-33`

Clustering discovers intents and writes `LabeledExample` rows. **Nothing reads them.** Two
independent breaks:

- `find_similar_examples` is implemented _and unit-tested_ (`tests/engine/test_embeddings.py`)
  with **zero production call sites**. Few-shot retrieval — spec §5's merchant-scoped-then-global
  query and §6's "immediately available as few-shot context for NileChat's real-time extraction"
  — is not wired into any prompt.
- `_known_intents` reads `Message.intent` only, never `LabeledExample.intent`. Combined with the
  `Literal` enum in `classification.py:29-33`, a cluster-discovered intent **can never reach the
  classifier's option set**. Discovery produces labels the classifier is structurally unable to emit.

**Change, in order:**

1. **Union labeled examples into the intent set** (small, independent, unblocks the loop):

   ```python
   async def _known_intents(session: AsyncSession) -> list[str]:
       messages = await session.execute(
           select(Message.intent).where(Message.intent.is_not(None)).distinct())
       labeled = await session.execute(
           select(LabeledExample.intent).where(LabeledExample.intent.is_not(None)).distinct())
       observed = {r[0] for r in messages.all()} | {r[0] for r in labeled.all()}
       return sorted(observed | set(DEFAULT_INTENTS))
   ```

   Note the pollution risk this inherits, already seen live in debugging log §10/§11: every
   historical value becomes a permanent `Literal` member. Consider a `source`/`min_cluster_size`
   filter, or a curation flag on `LabeledExample`, before enabling this on real traffic.

2. **Wire few-shot retrieval into the assembler.** `process_message` already computes
   `embed_text(normalized_text)` — but at L94, _after_ classification. Move the embedding call
   before prompt assembly so its vector feeds `find_similar_examples`, then have
   `build_context_prompt` take an `examples` argument and prepend them. This interacts with B2:
   examples consume budget, so they must be counted in `estimate_tokens` and dropped first when
   the prompt overflows. Add examples **after** B2 lands, not before.

3. **Stop the prompt asking for something the grammar forbids.**
   `CLASSIFICATION_SYSTEM_PROMPT` (`classification.py:12-16`) ends with _"If none fit, propose a
   short new snake_case intent label"_ while `_intent_response_schema` makes that physically
   impossible. The `Literal` is the correct tradeoff for a quantized 3.9B model (debugging log
   §10); delete the sentence. New-intent discovery is clustering's job, and step 1 is how it
   gets back in.

### R13 — `estimate_tokens`'s stated safety property is backwards

**File:** `app/engine/context_budget.py:5-13`

The comment claims the estimate _"deliberately overestimates token count (safe: trims more than
strictly necessary, never underestimates and lets a prompt silently overflow)"_. Dividing
character count by a _larger_ constant produces a _smaller_ token estimate — so raising
`CHARS_PER_TOKEN_ESTIMATE` makes overflow _less_ likely to be detected, not more. And "trims more
than strictly necessary" is vacuous, since nothing trims (B2).

**Change:** calibrate once against the real tokenizer — run a few representative
Arabic/Arabizi messages through NileChat's tokenizer, take the worst-case chars/token, and use
that. Then rewrite the comment to state the direction accurately: a _smaller_ constant is the
conservative choice. Whatever the number lands on, the comment is the part that will mislead the
next reader into leaving it alone.

---

## Phase 4 — Ops, security, schema

### R10 — `record_ai_call` output never reaches a handler

**File:** `app/engine/clients.py:8,28-35` **[verify]**

`logging.getLogger("app.engine.ai_calls").info(...)` with no `basicConfig`/`dictConfig` anywhere
in `app/` (only `alembic.ini` configures logging, and only for migrations). Uvicorn configures
its own loggers and leaves root without a handler, so these records fall through to
`logging.lastResort` — level **WARNING**. Every `ai_call` line is discarded. Spec §7's
observability requirement ("catch context-budget overflows before they degrade output quality")
is written in code but non-functional at runtime.

**Change:** a `configure_logging()` in `app/core/` called from `lifespan` (R5), with `dictConfig`
setting a handler on the app's logger namespace at INFO. Keep the format machine-greppable — the
existing `ai_call tier=%s model=%s ...` key=value shape is good; don't regress it into prose.

### R11 — `echo=True` logs customer PII and 1024-float vectors

**File:** `app/core/database.py:6`

`create_async_engine(..., echo=True)` logs every statement with bound parameters: raw Arabic
customer messages, phone numbers and addresses from `extracted_payload`, and full embedding
vectors. Enormous log volume plus a PII sink in whatever aggregates stdout.

**Change:** `SQL_ECHO: bool = False` in `Settings`, `echo=settings.SQL_ECHO`, add to
`.env.example`.

### R12 — Unauthenticated ingest endpoint with unbounded input

**Files:** `app/domains/messages/router.py:11-18`, `app/domains/messages/schemas.py:4-7`

`POST /api/v1/messages/` has no authentication, no rate limiting, and no length cap on
`raw_text` / `normalized_text`. Any caller who can reach the service can post into any
`conversation_id` — conversation ids are opaque UUIDs, but that is obscurity, not access control.
Each request triggers paid OpenRouter calls (one classification, optionally one extraction, plus
one embedding per extracted line item), so an unauthenticated request that causes unbounded
third-party spend is a cost-amplification vector. Posting into another merchant's conversation is
also a cross-tenant integrity problem: the injected message enters that thread's history, its
slot state, and its order extraction, and after Phase 3 it would enter the shared intent set too.

A related trust-boundary point: `normalized_text` arrives **from the client** and is what tier-0
rules, embeddings, and every prompt actually consume, while `raw_text` is stored and never read
by anything. A caller can make the two disagree arbitrarily — tier-0 short-circuits, prompt
content, and the stored audit trail all disagree by construction. Server-side normalization from
`raw_text` is the real fix, but that belongs with channel ingestion; until then the field is a
client-controlled input to every downstream decision and should be treated as untrusted.

**Change, before this is exposed beyond localhost:**

- Service-to-service auth (API key header dependency) on the messages router.
- `Field(max_length=...)` on both text fields in `MessageIngestRequest`.
- Verify the conversation belongs to the authenticated merchant in `ingest_message` — return the
  same 404 as an unknown conversation, not a 403, so the endpoint doesn't confirm existence.
- A per-merchant request budget or rate limit.

If the service will stay localhost-only for now, that is a legitimate decision — record it, and
keep the `max_length` caps regardless, since they're free.

### R15 — Query patterns that will not survive volume

**Files:** `app/engine/pipeline.py:34`, `alembic/versions/2d17ac4bd857_...py`

- `_known_intents` runs `SELECT DISTINCT intent FROM messages` **unscoped and on every single
  message**, against an unindexed column. It also pools intents across all merchants — the open
  design question already flagged in debugging log §8.
- Postgres does not auto-index foreign keys. There is no index on `messages.conversation_id` (the
  history query's `WHERE` + `ORDER BY created_at DESC`), `orders.conversation_id`,
  `products.merchant_id`, or `conversations.merchant_id`.

**Change:** one migration (see below) adding `messages(conversation_id, created_at DESC)` plus
plain indexes on the other three FK columns, and `messages(intent)` for the DISTINCT. Then cache
`_known_intents` per request or per short TTL — it cannot change mid-request.

### Migration

One new Alembic revision covering Phase 4's schema needs:

- `orders.escalation_reason` (nullable String) — R8.
- The five indexes above — R15.

**Read the `create_type=False` comment block in
`alembic/versions/2d17ac4bd857_add_classification_schema.py:30-51` before writing it** — it
documents the shared-enum trap. This migration adds no enum, so the trap doesn't apply, but the
next one might.

Also fold in the uncommitted `1689c340b77d_add_products_embedding_hnsw_index.py` decision: it is
currently untracked and uses `typing.Union`/`Sequence` unlike its sibling. Either commit it as-is
with the style normalized, or squash the `products` HNSW index into the base migration if no
environment has run it yet.

### R16b — Remaining ops items

- No CORS middleware anywhere in `app/`, while `frontend/` now exists untracked — browser calls
  will fail on preflight. Add `CORSMiddleware` with an explicit allow-list from settings, not `*`.
- `Conversation.state` is never transitioned by any code path, and `slots` is never written.
  Orders only extract in `GATHERING`/`CONFIRMING` (`pipeline.py:97`), so a conversation created
  as `NEW` never extracts anything — which is why `scripts/seed.py:52` hardcodes `GATHERING`.
  `ConvState.NEW/COMPLETED/ABANDONED` are unreachable. The state machine and slot-filling are a
  design conversation, not a fix; **raise it, don't build it here.**
- `tier0_rules.py:7` — `SPAM_PATTERN` flags any message containing a URL, so a customer sharing a
  product link is classified spam and short-circuited before any model sees it. Narrow it, or
  require a second signal.
- `app/clustering/job.py:73-96` — re-running `run_clustering` re-inserts `LabeledExample` rows for
  the same messages; no dedupe key. `fetch_embedded_messages` applies `LIMIT` with no `ORDER BY`,
  so the sampled 1000 is arbitrary. Matters more once Phase 3 makes those rows load-bearing.

---

## Phase 5 — Nits & cleanup

- `app/engine/confidence.py::get_confidence` — dead, zero call sites (the pydantic schemas carry
  the field). Delete it, or call it from the schemas so the "swap to logprobs later" seam it was
  built for actually exists. CLAUDE.md documents that seam, so update CLAUDE.md if it goes.
- `backend/main.py` — `uv init` hello-world leftover. Delete.
- `scripts/seed.py:17` redefines `new_id` instead of importing `app.models._ids.new_id`; uses
  `datetime.timezone.utc` where the rest of the codebase uses `UTC`; is not idempotent
  (re-running duplicates the merchant and products); and `m1` gets no embedding, so the seeded
  message never reaches clustering. Note `seeder_implementation_plan.md` describes a richer
  seeder than what exists — reconcile or delete the doc.
- `tests/domains/__init__.py` is missing while every sibling test package has one.
- No `[tool.ruff]` in `pyproject.toml` — `make lint` runs bare defaults (E4/E7/E9/F only, no
  import sorting), and `make format` at the default 88 columns would reflow a codebase written to
  ~120. Add `line-length = 120` and enable `I`.
- `.env.example` is missing `NILECHAT_TEMPERATURE`, and will need `DEEPSEEK_TEMPERATURE`,
  `SQL_ECHO`, `AI_REQUEST_TIMEOUT_SECONDS`, `AI_MAX_RETRIES` from the phases above.
- `Order` has no `message_id` — no way to trace which message produced an order. Worth adding
  alongside the Phase 4 migration if the review UI will need it.
- `POST /api/v1/messages/` requires the trailing slash; without it FastAPI 307-redirects, which
  drops the body on some clients. Register the path as `""`.

---

## Verification

**Per phase**, alongside the tests named in each section:

- Phase 1: `make test` green. Then the B1 print check from Phase 0 again — the `customer:` line
  now appears once. Kill the NileChat endpoint mid-request and confirm the `Message` row survives
  and the response is not a 500.
- Phase 2: for each of the five triggers, a `test_pipeline.py` case asserts the persisted
  `ModelTier.ESCALATED` and the exact `escalation_reason`. Pre-flight triggers additionally assert
  the NileChat endpoint saw zero calls. This closes R14 — escalation is currently the system's
  central design idea and is unexercised end to end; the debugging log never records reaching
  tier 2 either.
- Phase 3: seed a `LabeledExample` with a novel intent, confirm it appears in `_known_intents` and
  in the `Literal` enum of the request body sent to the mocked endpoint.
- Phase 4: `POST` one message, grep stdout for `ai_call tier=` — now present. Confirm no message
  text or embedding vector appears in the SQL log. `EXPLAIN` the history query and confirm an
  index scan.

**End to end, after all phases:**

1. `make lint && make test` clean.
2. `make upgrade` on a scratch database, then `make seed`.
3. `PYTHONPATH=. uv run python scripts/test_engine.py "عايزة اطلب الفستان الصيفي الابيض مقاس لارج"` —
   the exact message from debugging log §11. Expect `purchase_intent`, an order, and a resolved
   `product_id`.
4. Same message through `POST /api/v1/messages/`, then `scripts/view_orders.py` to confirm the
   persisted order matches.
5. One deliberately low-confidence message to confirm a real tier-2 call fires and
   `escalation_reason` lands in the database.
