# DeepSeek-Only Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove NileChat and the Hugging Face Inference Endpoint entirely; make DeepSeek v4 Flash (via OpenRouter) the sole LLM for classification and extraction, with a new system prompt that gives it Egyptian-Arabic/Arabizi dialect guidance plus per-call merchant/conversation context.

**Architecture:** Collapse the two-model escalation pipeline (Tier-0 rules → NileChat → maybe-escalate-to-DeepSeek) into a two-stage pipeline (Tier-0 rules → always-DeepSeek). Every call now goes through one `deepseek_provider()`. The preflight/postflight heuristics that used to decide *whether to call a second model* now just decide whether to flag the result for review (`Message.escalation_reason`, and — for orders — the existing `OrderStatus.PENDING_REVIEW` gate, unchanged). A new `app/engine/prompts.py` composes a shared Arabic/Arabizi/persona/context preamble with each task's existing instruction block.

**Tech Stack:** Python 3.13, FastAPI, SQLAlchemy 2.0 async, Alembic/PostgreSQL, `openai` SDK against OpenRouter, pytest + pytest-httpx2 (`mock_ai` fixture).

**Spec:** `message-classification-ai-engine-spec.md` — Task 9 of this plan rewrites its Tier-1/Tier-2 sections to match. There is no separate pre-existing "DeepSeek-only" spec; this plan document is the design record for that decision until Task 9 folds the outcome back into the spec file.

## Global Constraints

- No retry / second model call on low confidence or ambiguous fields (decided: single call, flag for review). `AI_MAX_RETRIES`/`AI_REQUEST_TIMEOUT_SECONDS` are unrelated transport-level settings on the OpenAI client and are **not** touched by this — don't conflate the two.
- Full dynamic context in every system-prompt call: merchant name + conversation stage (`ConvState`) + current `slots`.
- One composed prompt per task: shared preamble (persona + dialect + context) + existing per-task instruction block, unchanged in wording.
- `ModelTier` collapses from `RULE / NILECHAT / ESCALATED` to `RULE / DEEPSEEK` via a real Alembic migration with data backfill — not left as a stale 3-value enum.
- No new cost-guard ceiling invented for context length: `app/engine/cost.py`'s `_COST_PER_1K_TOKENS` table is empty by design ("a wrong estimated_cost is worse than an absent one"), so there's no defensible number to pick. The 2048-token budget being removed was NileChat's training-time ceiling (confirmed in the spec) — it has no equivalent for DeepSeek (~1.3M token context). Populating real pricing and choosing a ceiling, if wanted later, is separate follow-up work, not part of this plan.
- `schemas.py` (`IntentClassification`, `ExtractionResult`, `json_schema_response_format`) needs **no changes** — already tier-agnostic, and DeepSeek v4 Flash (`~deepseek/deepseek-v4-flash-latest`, already the pinned `DEEPSEEK_MODEL`) supports `response_format` json_schema structured output.
- Don't touch `app/engine/embeddings.py` or `EMBEDDING_MODEL` — embeddings already route through OpenRouter (`config.py`'s own comment confirms this), never through NileChat/HF. "Get rid of Hugging Face" only concerns the NileChat chat-completion endpoint.

---

### Task 1: `app/engine/prompts.py` — shared system-prompt composer

**Files:**
- Create: `backend/app/engine/prompts.py`
- Test: `backend/tests/engine/test_prompts.py`

**Interfaces:**
- Produces: `build_system_prompt(*, task_block: str, merchant_name: str, conv_state: ConvState, slots: dict) -> str`, and the constants `CLASSIFICATION_TASK_BLOCK: str`, `EXTRACTION_TASK_BLOCK: str` — Task 4 imports all three.

- [x] **Step 1: Write the failing tests**

```python
# backend/tests/engine/test_prompts.py
from app.engine.prompts import CLASSIFICATION_TASK_BLOCK, build_system_prompt
from app.models.enums import ConvState


def test_includes_merchant_name_and_dialect_guidance():
    prompt = build_system_prompt(
        task_block="TASK_BLOCK_MARKER", merchant_name="Cairo Threads", conv_state=ConvState.GATHERING, slots={}
    )
    assert "Cairo Threads" in prompt
    assert "Arabizi" in prompt
    assert "TASK_BLOCK_MARKER" in prompt


def test_state_gloss_is_included():
    prompt = build_system_prompt(task_block="x", merchant_name="M", conv_state=ConvState.CONFIRMING, slots={})
    assert "CONFIRMING" in prompt


def test_empty_slots_says_nothing_gathered():
    prompt = build_system_prompt(task_block="x", merchant_name="M", conv_state=ConvState.NEW, slots={})
    assert "nothing gathered yet" in prompt


def test_nonempty_slots_are_serialized_without_ascii_escaping():
    prompt = build_system_prompt(
        task_block="x", merchant_name="M", conv_state=ConvState.GATHERING, slots={"product": "تيشيرت"}
    )
    assert "تيشيرت" in prompt


def test_classification_task_block_lists_known_intents():
    block = CLASSIFICATION_TASK_BLOCK.format(known_intents="greeting, purchase_intent")
    assert "greeting, purchase_intent" in block
```

- [x] **Step 2: Run to verify it fails**

Run: `cd backend && uv run pytest tests/engine/test_prompts.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.engine.prompts'`

- [x] **Step 3: Write the implementation**

```python
# backend/app/engine/prompts.py
import json

from app.models.enums import ConvState

_STATE_GLOSS: dict[ConvState, str] = {
    ConvState.NEW: "NEW (conversation just started, nothing gathered yet)",
    ConvState.GATHERING: "GATHERING (customer is actively providing order details)",
    ConvState.CONFIRMING: "CONFIRMING (order details are gathered, waiting on customer confirmation)",
    ConvState.COMPLETED: "COMPLETED (order already confirmed)",
    ConvState.ABANDONED: "ABANDONED (conversation went cold)",
}

_BASE_TEMPLATE = (
    "You are the message-understanding engine behind {merchant_name}'s automated "
    "order assistant on a WhatsApp-style chat channel. You do not reply to the "
    "customer — you read one inbound customer message and produce structured data "
    "that {merchant_name}'s system uses to run its order pipeline. Nothing you "
    "output is shown to the customer directly.\n\n"
    "Customers write in Egyptian Arabic (Arabic script), Arabizi (Egyptian Arabic "
    "transliterated into Latin letters and digits, e.g. \"3ayz\", \"momken\", "
    "\"ezayak\", \"7abeby\"), plain English, or a mix of these in the same message, "
    "often with typos and no punctuation. Treat all of these as equally valid "
    "input — never ask the customer to rephrase or switch language, and never "
    "penalize confidence just because a message is in Arabizi rather than Arabic "
    "script.\n\n"
    "Conversation stage: {conv_state}\n"
    "Already gathered for this order so far: {slots_json}\n\n"
    "Use the conversation stage and what's already gathered as context for this "
    "message — e.g. a short reply like \"2 كيلو\" during GATHERING is almost "
    "always filling in a quantity for whatever product is already in slots, not "
    "describing a new unrelated order.\n\n"
    "{task_block}"
)


def build_system_prompt(*, task_block: str, merchant_name: str, conv_state: ConvState, slots: dict) -> str:
    slots_json = json.dumps(slots, ensure_ascii=False) if slots else "(nothing gathered yet)"
    return _BASE_TEMPLATE.format(
        merchant_name=merchant_name,
        conv_state=_STATE_GLOSS[conv_state],
        slots_json=slots_json,
        task_block=task_block,
    )


CLASSIFICATION_TASK_BLOCK = (
    "You classify customer messages into an intent label. Respond only with json "
    "matching the schema. Known intents so far: {known_intents}."
)

EXTRACTION_TASK_BLOCK = (
    "Extract order details as json matching the schema: line_items, address, phone, "
    "payment_method, ambiguous_fields (list any field you are not sure about), confidence."
)
```

- [x] **Step 4: Run to verify it passes**

Run: `cd backend && uv run pytest tests/engine/test_prompts.py -v`
Expected: PASS (5 passed)

- [x] **Step 5: Commit**

```bash
git add backend/app/engine/prompts.py backend/tests/engine/test_prompts.py
git commit -m "feat: add shared Arabic/Arabizi-aware system prompt composer"
```

---

### Task 2: Simplify `context_budget.py` and `routing_policy.py`

Drops the NileChat-specific 2048-token hard budget (no equivalent applies to DeepSeek, and `cost.py` has no pricing table to pick a new number from) and the `context_budget_overflow` escalation trigger that depended on it.

**Files:**
- Modify: `backend/app/engine/context_budget.py`
- Modify: `backend/app/engine/routing_policy.py`
- Modify: `backend/tests/engine/test_context_budget.py`
- Modify: `backend/tests/engine/test_routing_policy.py`

**Interfaces:**
- Produces: `build_context_prompt(history, slots, current_text, max_turns, examples=None, mode="intent") -> str` (was `-> tuple[str, bool]`; drops `token_budget` param). `evaluate_preflight(*, text: str, correction_count: int) -> str | None` (drops `overflowed` param). Task 4 and Task 5 consume both new signatures.

- [x] **Step 1: Update `test_context_budget.py`**

Delete `test_build_context_prompt_flags_overflow_on_tiny_budget` and `test_estimate_tokens_scales_with_length` entirely (they test removed behavior — `estimate_tokens`/token-budget flagging no longer exist). Rewrite the other two to match the new signature:

```python
def test_build_context_prompt_includes_history_and_current():
    history = [...]  # keep existing fixture construction from the current test
    prompt = build_context_prompt(history=history, slots={}, current_text="عايز اطلب", max_turns=10)
    assert "عايز اطلب" in prompt


def test_build_context_prompt_includes_examples():
    examples = [...]  # keep existing fixture construction from the current test
    prompt = build_context_prompt(history=[], slots={}, current_text="عايز اطلب", max_turns=10, examples=examples)
    assert "examples:" in prompt
```

- [x] **Step 2: Update `test_routing_policy.py`**

Delete `test_escalates_on_context_overflow` entirely (tests the removed `check_context_overflow`). In every remaining `evaluate_preflight(...)` call (`test_no_escalation_when_all_clear`, `test_escalates_on_repeated_correction`, `test_escalates_on_reasoning_heavy_conditional`, `test_short_single_question_does_not_escalate`, `test_dense_multi_question_text_still_escalates`, `test_lo_without_conditional_result_does_not_escalate`), remove the `overflowed=...` keyword argument. `test_escalates_on_low_confidence` / `test_escalates_on_ambiguous_fields` test `evaluate_postflight` and are untouched.

- [x] **Step 3: Run to verify the updated tests fail against old source**

Run: `cd backend && uv run pytest tests/engine/test_context_budget.py tests/engine/test_routing_policy.py -v`
Expected: FAIL — `TypeError: build_context_prompt() missing 1 required positional argument` / unexpected keyword `overflowed`

- [x] **Step 4: Rewrite `context_budget.py`**

```python
# backend/app/engine/context_budget.py
import json

from app.models.enums import Direction


def build_context_prompt(
    history: list,
    slots: dict,
    current_text: str,
    max_turns: int,
    examples: list | None = None,
    mode: str = "intent",
) -> str:
    recent = history[-max_turns:]
    lines = []

    if examples:
        lines.append("examples:")
        for ex in examples:
            if mode == "extraction":
                ext_str = json.dumps(ex.extraction, ensure_ascii=False) if ex.extraction else "{}"
                lines.append(f"- customer: {ex.normalized_text} -> extraction: {ext_str}")
            else:
                lines.append(f"- customer: {ex.normalized_text} -> intent: {ex.intent}")
        lines.append("")

    lines.append(f"slots: {json.dumps(slots, ensure_ascii=False)}")
    for msg in recent:
        speaker = "customer" if msg.direction == Direction.INBOUND else "merchant"
        lines.append(f"{speaker}: {msg.normalized_text or msg.raw_text or ''}")
    if mode == "extraction":
        current_line = f"customer: {current_text} -> extraction:"
    else:
        current_line = f"customer: {current_text} -> intent:"
    lines.append(current_line)
    return "\n".join(lines)
```

(`estimate_tokens`/`CHARS_PER_TOKEN_ESTIMATE` are deleted — nothing consumes them once `overflowed` is gone.)

- [x] **Step 5: Rewrite `routing_policy.py`**

Delete `check_context_overflow` entirely. Update `evaluate_preflight`:

```python
def evaluate_preflight(*, text: str, correction_count: int) -> str | None:
    """Triggers knowable before any model call."""
    for reason in (
        check_repeated_correction(correction_count),
        check_reasoning_heavy(text),
    ):
        if reason:
            return reason
    return None
```

`evaluate_postflight` is unchanged (its triggers never depended on `overflowed`). Update its docstring to `"""Triggers only knowable from the model's output."""` (was "re-run on tier 2" — no longer accurate, nothing re-runs).

- [x] **Step 6: Run to verify it passes**

Run: `cd backend && uv run pytest tests/engine/test_context_budget.py tests/engine/test_routing_policy.py -v`
Expected: PASS

- [x] **Step 7: Commit**

```bash
git add backend/app/engine/context_budget.py backend/app/engine/routing_policy.py backend/tests/engine/test_context_budget.py backend/tests/engine/test_routing_policy.py
git commit -m "refactor: drop NileChat-specific token budget and its escalation trigger"
```

---

### Task 3: Collapse `ModelTier` to `RULE` / `DEEPSEEK`

**Files:**
- Modify: `backend/app/models/enums.py`
- Create: `backend/alembic/versions/<autogenerated>_collapse_modeltier_to_rule_deepseek.py`

**Interfaces:**
- Produces: `ModelTier.RULE`, `ModelTier.DEEPSEEK` (was `RULE, NILECHAT, ESCALATED`). Task 5 consumes `ModelTier.DEEPSEEK` directly (no more ternary).

- [x] **Step 1: Update the enum**

```python
# backend/app/models/enums.py — ModelTier only, other enums unchanged
class ModelTier(enum.StrEnum):
    RULE = "RULE"
    DEEPSEEK = "DEEPSEEK"
```

- [x] **Step 2: Scaffold the migration**

Run: `cd backend && uv run alembic revision -m "collapse modeltier to rule deepseek"`

This creates an empty migration file with `down_revision` auto-set to the current head (`1511b3371e51`, the `add_ai_usage_events_table` migration — verify the generated file's `down_revision` reads exactly that). Alembic's `--autogenerate` cannot detect enum *value* changes correctly, so don't use `--autogenerate` here — hand-write the body.

- [x] **Step 3: Write the migration body**

Recreate the Postgres enum type in one pass rather than using `ALTER TYPE ... RENAME VALUE` — a single `CASE`-mapped type swap avoids any same-transaction visibility question around renamed enum values, and handles collapsing *two* old values (`NILECHAT` and `ESCALATED`) into one new value (`DEEPSEEK`) directly:

```python
"""collapse modeltier to rule deepseek

Revision ID: <autogenerated>
Revises: 1511b3371e51
Create Date: ...
"""

from collections.abc import Sequence

from sqlalchemy.dialects.postgresql import ENUM

from alembic import op

revision: str = "<autogenerated>"
down_revision: str | Sequence[str] | None = "1511b3371e51"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TABLES_AND_COLUMNS = (("messages", "model_tier"), ("orders", "extracted_by_tier"))


def upgrade() -> None:
    # NILECHAT and ESCALATED both collapse to DEEPSEEK — once there's only one
    # LLM, "ran on tier 1" and "escalated to tier 2" are the same fact ("the
    # LLM handled this"). Postgres has no ALTER TYPE ... DROP VALUE, so this
    # recreates the type: rename the old one out of the way, create the new
    # 2-value type under the original name, cast every column across via a
    # CASE mapping, then drop the old type.
    op.execute("ALTER TYPE modeltier RENAME TO modeltier_old")
    new_enum = ENUM("RULE", "DEEPSEEK", name="modeltier", create_type=False)
    new_enum.create(op.get_bind(), checkfirst=True)
    for table, column in _TABLES_AND_COLUMNS:
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN {column} TYPE modeltier "
            f"USING (CASE {column}::text "
            f"WHEN 'NILECHAT' THEN 'DEEPSEEK' "
            f"WHEN 'ESCALATED' THEN 'DEEPSEEK' "
            f"ELSE {column}::text END)::modeltier"
        )
    op.execute("DROP TYPE modeltier_old")


def downgrade() -> None:
    # Data loss is inherent here: a DEEPSEEK row written after the upgrade
    # can't be un-collapsed into "was it NILECHAT or ESCALATED" — it maps
    # back to ESCALATED (the more conservative of the two: "needed the LLM
    # and nothing said it was routine").
    op.execute("ALTER TYPE modeltier RENAME TO modeltier_new")
    old_enum = ENUM("RULE", "NILECHAT", "ESCALATED", name="modeltier", create_type=False)
    old_enum.create(op.get_bind(), checkfirst=True)
    for table, column in _TABLES_AND_COLUMNS:
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN {column} TYPE modeltier "
            f"USING (CASE {column}::text "
            f"WHEN 'DEEPSEEK' THEN 'ESCALATED' "
            f"ELSE {column}::text END)::modeltier"
        )
    op.execute("DROP TYPE modeltier_new")
```

- [x] **Step 4: Verify against a real database**

Run: `cd backend && make upgrade` against a scratch/dev database that has at least one row of each old value (`RULE`, `NILECHAT`, `ESCALATED`) in both `messages.model_tier` and `orders.extracted_by_tier` — seed them by hand first if the dev DB doesn't already have all three. Confirm the upgrade applies cleanly and every row's new value is correct (`RULE`→`RULE`, `NILECHAT`/`ESCALATED`→`DEEPSEEK`). Then run `uv run alembic downgrade -1` and confirm it also applies cleanly. This is the one step in this plan touching real DDL against enum types — don't skip the manual verification even though it's not a pytest step.

- [x] **Step 5: Commit**

```bash
git add backend/app/models/enums.py backend/alembic/versions/*_collapse_modeltier_to_rule_deepseek.py
git commit -m "feat: collapse ModelTier to RULE/DEEPSEEK now that NileChat is gone"
```

---

### Task 4: Collapse the model layer — `clients.py`, `gateway.py`, `classification.py`, `extraction.py`, `clustering/job.py`

This is one atomic unit: `gateway.py`/`clients.py` have no dedicated test file (they're only exercised indirectly through `classification.py`/`extraction.py`'s tests), so splitting this further would leave the build broken mid-task with no way to verify the intermediate state.

**Files:**
- Modify: `backend/app/engine/clients.py`
- Modify: `backend/app/engine/gateway.py`
- Modify: `backend/app/engine/classification.py`
- Modify: `backend/app/engine/extraction.py`
- Modify: `backend/app/clustering/job.py`
- Modify: `backend/tests/engine/test_classification.py`
- Modify: `backend/tests/engine/test_extraction.py`

**Interfaces:**
- Consumes: `build_system_prompt`, `CLASSIFICATION_TASK_BLOCK`, `EXTRACTION_TASK_BLOCK` (Task 1). `ModelTier.DEEPSEEK` (Task 3). `evaluate_preflight(*, text, correction_count)` (Task 2).
- Produces: `classify_message(prompt, known_intents, threshold, correction_count, text, merchant_name, conv_state, slots) -> tuple[IntentClassification, str | None, CallUsage]` (was `tuple[IntentClassification, str, str | None, CallUsage | None]` — drops the `tier` element, `usage` is no longer optional). `extract_order(prompt, threshold, correction_count, text, merchant_name, conv_state, slots) -> tuple[ExtractionResult, str | None, CallUsage]` (same shape change). Task 5 consumes both new signatures.

- [x] **Step 1: Update `test_classification.py` and `test_extraction.py`**

In both files: replace `settings.NILECHAT_BASE_URL` with `settings.OPENROUTER_BASE_URL` in every `mock_ai.post(...)` call (2 occurrences each, at the lines that currently read `mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions")`). Update every `classify_message(...)` / `extract_order(...)` call site to the new signature (drop `overflowed`, add `merchant_name="Test Merchant"`, `conv_state=ConvState.GATHERING`, `slots={}` — matching the existing `merchant`/`conversation` fixtures in `conftest.py`, which already produce exactly those values). Update any assertion unpacking 4 return values (`result, tier, reason, usage = ...`) to 3 (`result, reason, usage = ...`), and drop any assertion on the removed `tier` string.

- [x] **Step 2: Run to verify failure against old source**

Run: `cd backend && uv run pytest tests/engine/test_classification.py tests/engine/test_extraction.py -v`
Expected: FAIL — mock URL no longer matches `NILECHAT_BASE_URL`, and/or signature mismatch errors.

- [x] **Step 3: Rewrite `clients.py`**

Remove the `_nilechat` client and `get_nilechat_client()`; `close_ai_clients()` closes only the remaining two:

```python
_deepseek = AsyncOpenAI(
    base_url=settings.OPENROUTER_BASE_URL,
    api_key=settings.OPENROUTER_API_KEY,
    timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
    max_retries=settings.AI_MAX_RETRIES,
)

_embedding = AsyncOpenAI(
    base_url=settings.OPENROUTER_BASE_URL,
    api_key=settings.OPENROUTER_API_KEY,
    timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
    max_retries=settings.AI_MAX_RETRIES,
)


def get_deepseek_client() -> AsyncOpenAI:
    return _deepseek


def get_embedding_client() -> AsyncOpenAI:
    return _embedding


async def close_ai_clients():
    await _deepseek.close()
    await _embedding.close()
```

(`AICallError`, `parse_json_content`, `record_ai_call` are unchanged — leave them exactly as they are.)

- [x] **Step 4: Rewrite `gateway.py`**

Replace `nilechat_provider()`/`escalated_provider()` with one factory, and drop the now-meaningless `provider.name == "escalated"` branching (there's only one provider, so its behavior is now unconditional):

```python
from app.engine.clients import (
    AICallError,
    get_deepseek_client,
    get_embedding_client,
    parse_json_content,
    record_ai_call,
)
# (drop get_nilechat_client from this import)

...

def deepseek_provider() -> Provider:
    return Provider("deepseek", get_deepseek_client(), settings.DEEPSEEK_MODEL, settings.DEEPSEEK_TEMPERATURE)
```

In `complete()` and `complete_json()`, replace:
```python
if provider.name == "escalated" and settings.OPENROUTER_PROVIDERS:
```
with:
```python
if settings.OPENROUTER_PROVIDERS:
```
(both occurrences — one in each function). In `complete()`'s `CallUsage` construction, replace:
```python
provider="openrouter" if provider.name == "escalated" else "nilechat",
```
with:
```python
provider="openrouter",
```
Update the `Provider.name` field's comment (currently `# "nilechat" | "escalated" — matches the tier vocabulary already used throughout the engine`) to `# always "deepseek" — kept as a field for CallUsage/logging, not for branching`.

- [x] **Step 5: Rewrite `classification.py`**

```python
from typing import Any, Literal, cast

from pydantic import BaseModel, Field, create_model

from app.engine.gateway import CallUsage, complete, deepseek_provider
from app.engine.prompts import CLASSIFICATION_TASK_BLOCK, build_system_prompt
from app.engine.routing_policy import evaluate_postflight, evaluate_preflight
from app.engine.schemas import IntentClassification
from app.models.enums import ConvState


def _intent_response_schema(known_intents: list[str]) -> type[BaseModel]:
    # A plain `str` field only constrains JSON *shape*, not its value — a
    # model can still emit a value outside `known_intents` despite prompt
    # instructions saying not to. Building the JSON schema with a `Literal`
    # of the exact known intents makes grammar-constrained decoding
    # physically unable to produce anything else, independent of how
    # reliably the model follows instructions. Parsing/validation still
    # goes through the static `IntentClassification` model (keeps its
    # `normalize_confidence` validator) — this dynamic model only shapes
    # what gets sent upstream.
    return create_model(
        "IntentClassification",
        intent=(cast(Any, Literal)[tuple(known_intents)], ...),
        confidence=(float, Field(ge=0.0, le=1.0)),
    )


async def classify_message(
    prompt: str,
    known_intents: list[str],
    threshold: float,
    correction_count: int,
    text: str,
    merchant_name: str,
    conv_state: ConvState,
    slots: dict,
) -> tuple[IntentClassification, str | None, CallUsage]:
    system_prompt = build_system_prompt(
        task_block=CLASSIFICATION_TASK_BLOCK.format(known_intents=", ".join(known_intents)),
        merchant_name=merchant_name,
        conv_state=conv_state,
        slots=slots,
    )
    schema_model = _intent_response_schema(known_intents)

    result, usage = await complete(
        deepseek_provider(),
        system_prompt=system_prompt,
        user_prompt=prompt,
        schema_model=schema_model,
        parse_model=IntentClassification,
        schema_name="intent_classification",
    )

    reason = evaluate_preflight(text=text, correction_count=correction_count) or evaluate_postflight(
        confidence=result.confidence, threshold=threshold
    )
    return result, reason, usage
```

(`CLASSIFICATION_SYSTEM_PROMPT` is deleted — superseded by `CLASSIFICATION_TASK_BLOCK` in `prompts.py`.)

- [x] **Step 6: Rewrite `extraction.py`**

```python
from app.engine.gateway import CallUsage, complete, deepseek_provider
from app.engine.prompts import EXTRACTION_TASK_BLOCK, build_system_prompt
from app.engine.routing_policy import evaluate_postflight, evaluate_preflight
from app.engine.schemas import ExtractionResult
from app.models.enums import ConvState


async def extract_order(
    prompt: str,
    threshold: float,
    correction_count: int,
    text: str,
    merchant_name: str,
    conv_state: ConvState,
    slots: dict,
) -> tuple[ExtractionResult, str | None, CallUsage]:
    system_prompt = build_system_prompt(
        task_block=EXTRACTION_TASK_BLOCK,
        merchant_name=merchant_name,
        conv_state=conv_state,
        slots=slots,
    )
    result, usage = await complete(
        deepseek_provider(),
        system_prompt=system_prompt,
        user_prompt=prompt,
        schema_model=ExtractionResult,
        parse_model=ExtractionResult,
        schema_name="order_extraction",
    )

    reason = evaluate_preflight(text=text, correction_count=correction_count) or evaluate_postflight(
        confidence=result.confidence, threshold=threshold, ambiguous_fields=result.ambiguous_fields
    )
    return result, reason, usage
```

(`EXTRACTION_SYSTEM_PROMPT` is deleted — superseded by `EXTRACTION_TASK_BLOCK` in `prompts.py`.)

- [x] **Step 7: Update `app/clustering/job.py`**

`label_cluster()` calls `escalated_provider()`/`complete_json()` today — change the import and call to `deepseek_provider()`. No other logic in that file changes.

- [x] **Step 8: Run to verify it passes**

Run: `cd backend && uv run pytest tests/engine/test_classification.py tests/engine/test_extraction.py -v`
Expected: PASS

- [x] **Step 9: Commit**

```bash
git add backend/app/engine/clients.py backend/app/engine/gateway.py backend/app/engine/classification.py backend/app/engine/extraction.py backend/app/clustering/job.py backend/tests/engine/test_classification.py backend/tests/engine/test_extraction.py
git commit -m "feat: collapse classification/extraction to a single DeepSeek call with dialect-aware prompts"
```

---

### Task 5: Wire up `pipeline.py`

**Files:**
- Modify: `backend/app/engine/pipeline.py`
- Modify: `backend/tests/engine/test_pipeline.py`
- Modify: `backend/tests/domains/test_messages_router.py`

**Interfaces:**
- Consumes: new `classify_message`/`extract_order` signatures (Task 4), `ModelTier.DEEPSEEK` (Task 3), `build_context_prompt` returning `str` (Task 2).

- [x] **Step 1: Update `test_pipeline.py`**

Replace `settings.NILECHAT_BASE_URL` with `settings.OPENROUTER_BASE_URL` in all 6 `mock_ai.post(...)` call sites. Replace both `assert result.message.model_tier == ModelTier.NILECHAT` with `assert result.message.model_tier == ModelTier.DEEPSEEK`. The existing `merchant`/`conversation` fixtures already provide a named merchant and a `ConvState.GATHERING` conversation with `slots={}` — no new fixtures needed, but if any test asserts on the exact outbound request body sent to the mocked endpoint, update that assertion to expect the new composed system prompt (containing the merchant fixture's name, e.g. `"Test Merchant"`) rather than the old bare `CLASSIFICATION_SYSTEM_PROMPT`/`EXTRACTION_SYSTEM_PROMPT` text.

- [x] **Step 2: Update `test_messages_router.py`**

Replace `settings.NILECHAT_BASE_URL` with `settings.OPENROUTER_BASE_URL` at line 75's `mock_ai.post(...)` call.

- [x] **Step 3: Run to verify failure against old source**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py tests/domains/test_messages_router.py -v`
Expected: FAIL — mock URL mismatch and/or `ModelTier.NILECHAT` no longer exists (`AttributeError`).

- [x] **Step 4: Rewrite the relevant section of `pipeline.py`**

Add a merchant-name lookup helper next to `_known_intents`/`_correction_count` (same pattern — a small scoped query, avoids relying on lazy-loading `conversation.merchant` in an async context):

```python
async def _merchant_name(session: AsyncSession, merchant_id: str) -> str:
    result = await session.execute(select(Merchant.name).where(Merchant.id == merchant_id))
    return result.scalar_one()
```

Add `Merchant` to the `from app.models import (...)` block. Replace the `build_context_prompt`/`classify_message`/`extract_order` call sites:

```python
    prompt = build_context_prompt(
        history=history,
        slots=conversation.slots,
        current_text=normalized_text,
        max_turns=settings.CONTEXT_HISTORY_TURNS,
        examples=examples,
    )

    known_intents = await _known_intents(session)
    correction_count = await _correction_count(session, conversation.id)
    merchant_name = await _merchant_name(session, conversation.merchant_id)
    try:
        classification, reason, usage = await classify_message(
            prompt,
            known_intents,
            settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
            correction_count,
            normalized_text,
            merchant_name,
            conversation.state,
            conversation.slots,
        )
    except AICallError as exc:
        logger.warning("classification_failed message_id=%s error=%s", message.id, exc)
        message.escalation_reason = "ai_call_failed"
        session.add(_usage_event(conversation.id, message.id, None, success=False, failed_tier="deepseek"))
        await session.flush()
        return PipelineResult(message=message, order=None)

    session.add(_usage_event(conversation.id, message.id, usage, success=True))
    message.intent = classification.intent
    message.intent_confidence = classification.confidence
    message.model_tier = ModelTier.DEEPSEEK
    message.escalation_reason = reason

    order = None
    if classification.intent == "purchase_intent" and conversation.state in (ConvState.GATHERING, ConvState.CONFIRMING):
        extraction_prompt = build_context_prompt(
            history=history,
            slots=conversation.slots,
            current_text=normalized_text,
            max_turns=settings.CONTEXT_HISTORY_TURNS,
            examples=examples,
            mode="extraction",
        )
        try:
            extraction, extraction_reason, extraction_usage = await extract_order(
                extraction_prompt,
                settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
                correction_count,
                normalized_text,
                merchant_name,
                conversation.state,
                conversation.slots,
            )
        except AICallError as exc:
            logger.warning("extraction_failed message_id=%s error=%s", message.id, exc)
            if not message.escalation_reason:
                message.escalation_reason = "ai_call_failed"
            session.add(_usage_event(conversation.id, message.id, None, success=False, failed_tier="deepseek"))
            await session.flush()
            return PipelineResult(message=message, order=None)

        session.add(_usage_event(conversation.id, message.id, extraction_usage, success=True))
        extraction.line_items = await match_line_items_to_products(
            session, conversation.merchant_id, extraction.line_items
        )
        status = (
            OrderStatus.AUTO_CONFIRMED
            if extraction.line_items
            and not extraction.ambiguous_fields
            and extraction.confidence >= settings.CLASSIFICATION_CONFIDENCE_THRESHOLD
            else OrderStatus.PENDING_REVIEW
        )
        order = Order(
            conversation_id=conversation.id,
            message_id=message.id,
            extracted_payload=extraction.model_dump(mode="json"),
            status=status,
            confidence_score=extraction.confidence,
            extracted_by_tier=ModelTier.DEEPSEEK,
            escalation_reason=extraction_reason,
        )
        session.add(order)
        if extraction_reason and not message.escalation_reason:
            message.escalation_reason = extraction_reason

    await session.flush()
    return PipelineResult(message=message, order=order)
```

**Important — no new code needed for the "flag for review" behavior:** the `status = OrderStatus.AUTO_CONFIRMED if ... else OrderStatus.PENDING_REVIEW` ternary already gates on `extraction.confidence`/`extraction.ambiguous_fields` directly, independent of any tier/escalation machinery. Removing the retry doesn't require adding a new review-flagging path — this existing ternary already does exactly the right thing once there's no second call trying to paper over a low-confidence first result.

Also update `_usage_event`'s failure branch: `provider="nilechat" if failed_tier == "nilechat" else "openrouter"` → just `provider="openrouter"` (unconditional — there's only one non-rule provider now).

- [x] **Step 5: Run to verify it passes**

Run: `cd backend && uv run pytest tests/engine/test_pipeline.py tests/domains/test_messages_router.py -v`
Expected: PASS

- [x] **Step 6: Run the full test suite**

Run: `cd backend && uv run pytest`
Expected: PASS (this is the first point where every test in the suite exercises the new code end-to-end)

- [x] **Step 7: Commit**

```bash
git add backend/app/engine/pipeline.py backend/tests/engine/test_pipeline.py backend/tests/domains/test_messages_router.py
git commit -m "feat: wire merchant/conversation context into the pipeline's AI calls"
```

---

### Task 6: Remove NileChat settings

Only safe now that Tasks 2–5 removed every consumer of these settings.

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `backend/.env.example`

- [x] **Step 1: Confirm no remaining references**

Run: `cd backend && grep -rn "NILECHAT" --include="*.py" . | grep -v scripts/verify_hf_endpoint.py | grep -v scripts/run_eval.py | grep -v scripts/test_engine.py`
Expected: no output (`scripts/*` references are handled in Task 7, next).

- [x] **Step 2: Edit `config.py`**

Remove these three lines from the `# AI Tier Settings` block:
```python
    NILECHAT_BASE_URL: str
    NILECHAT_API_KEY: str
    NILECHAT_MODEL: str
```
And remove these two lines further down:
```python
    NILECHAT_CONTEXT_TOKEN_BUDGET: int = 2048
    NILECHAT_TEMPERATURE: float = 0.1
```

- [x] **Step 3: Edit `.env.example`**

Remove:
```
# NILECHAT points to your local Ollama server running the imported GGUF model:
NILECHAT_BASE_URL="http://localhost:11434/v1"
NILECHAT_API_KEY="ollama"
NILECHAT_MODEL="nilechat"

```
Reword the OpenRouter comment from "used for both DeepSeek escalation (chat completions) and embeddings" to:
```
# OPENROUTER_API_KEY is used for both the DeepSeek engine (chat completions)
# and embeddings (bge-m3) below.
```
Remove the `NILECHAT_CONTEXT_TOKEN_BUDGET=2048` and `NILECHAT_TEMPERATURE=0.1` lines.

- [x] **Step 4: Run the full test suite**

Run: `cd backend && uv run pytest`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add backend/app/core/config.py backend/.env.example
git commit -m "chore: remove NileChat/HF settings"
```

---

### Task 7: Scripts and eval fixtures

**Files:**
- Delete: `backend/scripts/verify_hf_endpoint.py`
- Modify: `backend/scripts/run_eval.py`
- Modify: `backend/scripts/test_engine.py`
- Modify: `backend/eval/fixtures.json`

- [x] **Step 1: Delete `verify_hf_endpoint.py`**

It exists solely to sanity-check a NileChat/TGI Hugging Face endpoint before switching production traffic to it — nothing to verify once there's no such endpoint.

```bash
git rm backend/scripts/verify_hf_endpoint.py
```

- [x] **Step 2: Rewrite `eval/fixtures.json`**

Rename `expected_escalation_tier` to `expected_reason` and update values: `null` stays `null` for the tier-0 and clean-single-shot cases; the old `"nilechat"` label (meaning "handled without needing extra help") becomes `null` for the same reason; the old generic `"escalated"` label becomes the actual, more precise trigger string `"reasoning_heavy_content"` (this is what `ambiguous_conditional` was always tripping — the coarse tier label just didn't say so):

```json
[
  {
    "id": "greeting_arabic",
    "input": "السلام عليكم",
    "expected_intent": "greeting",
    "expected_reason": null
  },
  {
    "id": "purchase_arabizi",
    "input": "3ayz 2 tshirt aswd xl",
    "expected_intent": "purchase_intent",
    "expected_reason": null
  },
  {
    "id": "purchase_mixed_language",
    "input": "عايز اطلب the black one, size L",
    "expected_intent": "purchase_intent",
    "expected_reason": null
  },
  {
    "id": "question_with_typo",
    "input": "هل عندكو مقاسات تانيه",
    "expected_intent": "question",
    "expected_reason": null
  },
  {
    "id": "spam_reaction",
    "input": "👍",
    "expected_intent": "reaction",
    "expected_reason": null
  },
  {
    "id": "ambiguous_conditional",
    "input": "لو السعر يزيد يبقى هغير الطلب",
    "expected_intent": null,
    "expected_reason": "reasoning_heavy_content"
  },
  {
    "id": "address_extraction",
    "input": "محمد أحمد 01012345678، 15 شارع التحرير الدقي الدور التالت",
    "expected_intent": "purchase_intent",
    "expected_reason": null
  }
]
```

- [x] **Step 3: Rewrite `run_eval.py`**

```python
"""Manual evaluation runner — NOT part of `make test` / CI. Hits the real
configured DEEPSEEK_MODEL via OPENROUTER_BASE_URL, so it costs real
latency/money and requires OpenRouter to be reachable. Run after any change
to tier0_rules, routing_policy, classification, or prompts.

Usage: PYTHONPATH=. .venv/bin/python scripts/run_eval.py
"""

import asyncio
import json
from pathlib import Path

from app.core.config import settings
from app.engine.classification import classify_message
from app.engine.context_budget import build_context_prompt
from app.engine.tier0_rules import match_tier0
from app.models.enums import ConvState

FIXTURES_PATH = Path(__file__).parent.parent / "eval" / "fixtures.json"
KNOWN_INTENTS = ["greeting", "spam", "reaction", "purchase_intent", "question", "other"]


async def run_case(case: dict) -> tuple[bool, str]:
    text = case["input"]
    tier0_intent = match_tier0(text)
    if tier0_intent is not None:
        ok = case["expected_reason"] is None and tier0_intent == case["expected_intent"]
        return ok, f"tier0 -> intent={tier0_intent!r}"

    prompt = build_context_prompt(
        history=[],
        slots={},
        current_text=text,
        max_turns=settings.CONTEXT_HISTORY_TURNS,
    )
    classification, reason, _usage = await classify_message(
        prompt,
        KNOWN_INTENTS,
        settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
        correction_count=0,
        text=text,
        merchant_name="Eval Merchant",
        conv_state=ConvState.GATHERING,
        slots={},
    )

    reason_ok = reason == case["expected_reason"]
    intent_ok = case["expected_intent"] is None or classification.intent == case["expected_intent"]
    detail = f"intent={classification.intent!r}"
    if reason:
        detail += f", reason={reason!r}"
    return reason_ok and intent_ok, detail


async def main() -> None:
    cases = json.loads(FIXTURES_PATH.read_text())
    passed = 0
    for case in cases:
        try:
            ok, detail = await run_case(case)
        except Exception as exc:
            print(f"[ERROR] {case['id']}: {type(exc).__name__}: {exc}")
            continue
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {case['id']}: {detail}")
        passed += ok

    print(f"\n{passed}/{len(cases)} passed ({passed / len(cases):.0%})")


if __name__ == "__main__":
    asyncio.run(main())
```

- [x] **Step 4: Update `test_engine.py`**

Drop `overflowed`/`token_budget` from the `build_context_prompt` call (it now returns `str`, not a tuple — drop the `_overflowed` unpacking too), drop `overflowed=_overflowed` from both `classify_message`/`extract_order` calls, add `merchant_name`, `conv_state=ConvState.GATHERING`, `slots={}` to both calls (import `ConvState` from `app.models.enums`), and replace the four `Tier Used` print lines (which printed the now-removed `tier`/`ext_tier` strings) — since there's only ever one tier now, drop those two print lines entirely rather than printing a constant.

- [x] **Step 5: Run it manually**

Run: `cd backend && PYTHONPATH=. .venv/bin/python scripts/run_eval.py`
Expected: no case fails with an exception; review the PASS/FAIL summary (this hits the real OpenRouter API, so isn't a hard gate on this task, but should run without crashing).

- [x] **Step 6: Commit**

```bash
git add -A backend/scripts backend/eval/fixtures.json
git commit -m "chore: drop NileChat verification script, update eval runner and fixtures for single-tier engine"
```

---

### Task 8: Frontend copy

**Files:**
- Modify: `frontend/app/page.tsx`

- [x] **Step 1: Replace the NileChat-branded loading string**

At line 146, replace:
```
جاري الفهم والاستخراج بواسطة NileChat...
```
with:
```
جاري الفهم والاستخراج بالذكاء الاصطناعي...
```
("Understanding and extraction in progress via AI..." — genericized rather than naming DeepSeek directly, so this string doesn't need another edit if the model changes again.)

- [x] **Step 2: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "chore: remove NileChat branding from merchant-facing loading copy"
```

---

### Task 9: Documentation sweep

Done last, so it describes the actually-verified end state rather than an aspirational one.

**Files:**
- Modify: `README.md`
- Modify: `ROADMAP.md`
- Modify: `CLAUDE.md`
- Modify: `message-classification-ai-engine-spec.md`

- [x] **Step 1: `README.md`**

Rewrite the "Built" bullet (currently "Tier 1 classification + extraction against NileChat-4B... Tier 2 escalation to DeepSeek v4 Flash, driven by pre/post-flight checks") to describe the collapsed pipeline: Tier-0 rule short-circuit, then DeepSeek v4 Flash for everything else, with pre/postflight checks now flagging results for review (`escalation_reason`, `OrderStatus.PENDING_REVIEW`) rather than routing to a second model. Rewrite the `Architecture` ASCII diagram and the bullet list below it (drop the "Tier 1 — NileChat-4B" bullet; the "Tier 2 — DeepSeek" bullet becomes the only model bullet; fix the pre-existing stale claim that embeddings are "self-hosted" — `EMBEDDING_MODEL` already routes through OpenRouter, per `config.py`'s own comment). Update the `clients.py` description (one client per backend — now two, not three).

- [x] **Step 2: `ROADMAP.md`**

In "Now — built today", reword "Tier 0/1/2 AI classification + extraction pipeline, with escalation policy" to reflect the two-stage (rules + DeepSeek) pipeline. Under "Phase 3", remove the "Fine-tuned NileChat ecommerce model" line — there's no NileChat to fine-tune anymore; if a future custom/self-hosted model is still a real ambition, that's a new roadmap item to add deliberately, not this stale one to leave in place.

- [x] **Step 3: `CLAUDE.md`**

Rewrite the "Three-tier AI routing" section: it currently documents Tier 0/Tier 1 (NileChat, 2048-token cap)/Tier 2 (DeepSeek) as three distinct tiers. Replace with a description of the two-stage design (Tier 0 rules, then DeepSeek for everything else via `deepseek_provider()`), and describe `app/engine/prompts.py`'s role (shared dialect/persona/context preamble + per-task block). Also fix the pre-existing stale line "A separate embedding model (BAAI/bge-m3, self-hosted, 1024-dim)" — it already routes through OpenRouter today, confirmed by `config.py`'s own comment; this was already wrong before this change, not introduced by it, but this section is being rewritten anyway.

- [x] **Step 4: `message-classification-ai-engine-spec.md`**

Update the serving-architecture line (~line 19, "vLLM/SGLang expose an OpenAI-compatible /v1/chat/completions endpoint") and the Tier-1/Tier-2 description (~lines 212–213) to describe DeepSeek as the sole LLM tier. Preserve the existing rationale text about *why* NileChat was originally chosen (Egyptian-dialect/Arabizi transliteration strength) as a historical note, paired with a statement of the mitigation this plan implements instead: a system prompt carrying explicit dialect/context guidance (`app/engine/prompts.py`). Leave `docs/2026-08-22-classification-pipeline-debugging.md` untouched — it's a dated record of a past debugging session, not living documentation.

- [x] **Step 5: Commit**

```bash
git add README.md ROADMAP.md CLAUDE.md message-classification-ai-engine-spec.md
git commit -m "docs: update architecture docs for the DeepSeek-only engine"
```

---

## Explicitly out of scope

- `TijaratkBot_SRD.md`/`TijaratkBot_PRD.md`: `NileChatProvider` appears only in an architecture-diagram sketch, not attached to any numbered requirement (the nearest one, PRD #16 "difficult conversations escalate to Tier 2 or a human," is satisfiable regardless of which model sits where). Not touched by this plan; flag to the user as an optional follow-up if they want SRD/PRD consistency too.
- `docs/review-current-implementation.md` and other historical/dated docs: not swept — same reasoning as the debugging doc in Task 9.
- No new cost-guard/context-length ceiling (see Global Constraints).
- No changes to `app/engine/embeddings.py`, `schemas.py`, `tier0_rules.py`, `product_matching.py` — none of them reference NileChat or the tier-routing logic being collapsed.

## Self-review (spec coverage / placeholders / type consistency)

- **Spec coverage:** every concrete element of the user's ask is covered — remove NileChat/HF (Tasks 3, 4, 6, 7, 8), DeepSeek as sole engine (Task 4), dialect-aware system prompt (Task 1), role/context awareness (Task 1's merchant/state/slots injection, locked in by the three AskUserQuestion decisions recorded implicitly in the Global Constraints).
- **Placeholder scan:** no "TBD"/"add error handling"/"similar to Task N" markers — every step above has real code or an exact line-level diff instruction.
- **Type consistency:** `classify_message`/`extract_order`'s new `tuple[Result, str | None, CallUsage]` shape is used identically in Task 4 (definition) and Task 5 (call site). `build_system_prompt`'s keyword-only signature matches between Task 1 (definition) and Task 4 (both call sites). `ModelTier.DEEPSEEK` matches between Task 3 (definition) and Tasks 4/5 (usage).

---

**Supersedes:** the in-progress plan at `~/.claude/plans/i-have-added-baseurl-fizzy-river.md` (fixing the NileChat/HF endpoint's container-type mismatch) — abandoned when the user decided to remove NileChat entirely instead of fixing its deployment.
