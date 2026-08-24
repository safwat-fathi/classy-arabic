# TijaratkBot AI Engine — Correctness, Gateway, Observability & Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Tier 0/1/2 classification+extraction engine behave correctly (5 tests currently fail on `HEAD`), give it a swappable AI-provider seam and persisted usage telemetry, and make it independently testable — via pytest and a live CLI/eval harness — without depending on channels, auth, or any commerce feature.

**Architecture:** No new architectural layer for correctness fixes (Phase 1) — they land inside the existing pure engine functions (`tier0_rules.py`, `routing_policy.py`, `embeddings.py`) and the existing manual test script. Phase 2 introduces one new module, `app/engine/gateway.py`, that all five current raw-`AsyncOpenAI`-call sites route through, closing the "swap NileChat's endpoint" and "stop duplicating retry/schema/error logic" problems in one seam. Phase 3 adds a new `AIUsageEvent` model fed by that same seam. Phases 4–5 are standalone: a live HF-endpoint compatibility check, and a version-controlled evaluation fixture + runner separate from the production `LabeledExample` table.

**Tech Stack:** Python 3.13, FastAPI, SQLAlchemy 2.0 (asyncio), Alembic, PostgreSQL + pgvector, `pydantic`/`pydantic-settings`, `openai` SDK (used against any OpenAI-compatible endpoint — local Ollama today, a Hugging Face Inference Endpoint later), pytest + pytest-asyncio + `pytest-httpx2`/respx for mocking.

**Spec:** `message-classification-ai-engine-spec.md` (root) — sections referenced below as "spec §N". Also `TijaratkBot_SRD.md` §4, §14–§22, §32, §42 and `TijaratkBot_PRD.md` §9–§13, §28, §47 for the AI-architecture requirements this plan closes gaps against. `docs/review-current-implementation.md` is a prior remediation plan against the same spec — cross-checked against current code below; most of its Phase 0–2 items (B1–B4, R5, R7, R8, R10, R11, R15, R16b/CORS) are **already fixed on `HEAD`**. This plan only carries forward what verifiably is not.

## Global Constraints

- **Dev DB is real and shared, not a clean fixture.** `tests/conftest.py::db_session` wraps each test in a rollback-per-test SAVEPOINT against the actual dev Postgres (`localhost:5432/tijaratk_bot`), which already has 13 committed `labeled_examples` rows outside any test transaction. Any new test touching `labeled_examples` (or any table with pre-existing rows) must assert on **membership of its own inserted rows**, never on raw counts.
- **Escalation reason strings are load-bearing and must not change**: `"confidence_below_threshold"`, `"ambiguous_fields_present"`, `"context_budget_overflow"`, `"repeated_correction"`, `"reasoning_heavy_content"`, `"ai_call_failed"`. They're persisted to `Message.escalation_reason` / `Order.escalation_reason` and existing rows use these exact values.
- `ModelTier` is a **3-value** enum today (`RULE`, `NILECHAT`, `ESCALATED`) — not the SRD's `L0/L1/L2/L3`. Do not rename it as part of this plan.
- `AsyncOpenAI` clients are **module-level singletons** (`app/engine/clients.py`), constructed once at import time, disposed in `app/main.py`'s `lifespan`. Preserve this — do not reintroduce per-call client construction.
- Ruff config already sets `line-length = 120`; match it.
- `pytest-asyncio` is in `auto` mode — no `@pytest.mark.asyncio` decorators.
- `conversation.state`/`conversation.slots` are **read-only** in the current codebase (nothing transitions them after creation) — order extraction only runs when `state in (GATHERING, CONFIRMING)`. This is a known, out-of-scope limitation (see Non-Goals); any new test/script that wants extraction to run must construct its conversation with `state=ConvState.GATHERING` explicitly, matching `conftest.py`'s existing `conversation` fixture.

## Non-Goals (explicit — do not build these here)

- **AI action/tool layer** (`search_products`, `add_to_cart`, etc., SRD §21). Most of that set is cart/checkout/order-mutation tooling whose backing services (`CartService`, `CheckoutService`) don't exist. The current pipeline is also single-shot classify→extract, not a tool-calling loop — adding one is a control-flow rewrite, not an extension, and doesn't belong on top of a pipeline with 5 failing tests.
- **`StoreKnowledge` (FAQ/shipping/returns retrieval, SRD §23)** — a new model + migration + retrieval path is a new feature, not "make the existing engine correct and testable." Already tracked in `ROADMAP.md`'s near-term list.
- **Fair-use enforcement** (daily/monthly AI-turn limits + restriction actions, SRD §41) — billing-adjacent, and mechanically derivable later by counting the `AIUsageEvent` rows this plan adds (Phase 3). Deferring forecloses nothing.
- **Auth, channel/webhook ingestion, merchant dashboard** — per explicit instruction for this plan.
- **Provisioning the actual Hugging Face Inference Endpoint** — this plan makes the code ready to point at one and adds a script to verify compatibility once one exists; it does not create cloud infrastructure.

---

## Phase 1 — Correctness fixes (5 empirically-verified failures on `HEAD`)

Each task below is independent and can land as its own commit. Run `cd backend && .venv/bin/python -m pytest tests/engine/ -v` before starting to reproduce the baseline (5 failed, 35 passed, 1 error) and after each task to confirm progress.

### Task 1: Fix cross-merchant data leak in `find_similar_examples`

This is a tenant-isolation defect, not a cosmetic one — SRD §4 and Architectural Invariant #5 (`TijaratkBot_SRD.md:1448`) prohibit an AI request from ever retrieving another merchant's data. Rank it first.

**Files:**
- Modify: `backend/app/engine/embeddings.py`
- Test: `backend/tests/engine/test_embeddings.py`

**Interfaces:**
- Consumes: `app.models.LabeledExample`, `sqlalchemy.ext.asyncio.AsyncSession`
- Produces: `find_similar_examples(session, embedding, merchant_id, limit=5) -> list[LabeledExample]` — signature unchanged, behavior fixed. Callers (`app/engine/pipeline.py:94`) need no changes.

- [ ] **Step 1: Confirm the bug live**

Run:
```bash
cd backend && .venv/bin/python -c "
import asyncio
from app.core.database import engine
from sqlalchemy import text
async def main():
    async with engine.connect() as conn:
        r = await conn.execute(text('SELECT count(*), count(*) FILTER (WHERE merchant_id IS NULL) FROM labeled_examples'))
        print(r.fetchone())
asyncio.run(main())
"
```
Expected: `(13, 0)` (or similar — nonzero total, zero with `merchant_id IS NULL`), confirming the current "fallback" query in `find_similar_examples` has no rows it could legitimately fall back to, yet returns rows anyway because it has no `WHERE` clause at all.

- [ ] **Step 2: Write the failing test**

Add to `backend/tests/engine/test_embeddings.py`:
```python
async def test_find_similar_examples_never_returns_other_merchants_data(db_session, merchant):
    # Regression: the "global fallback" query had no merchant filter at all,
    # so it returned ANY merchant's labeled examples ranked by embedding
    # distance — a cross-tenant leak (SRD §4, Architectural Invariant #5).
    other = Merchant(name="Other Merchant")
    db_session.add(other)
    await db_session.flush()
    other_example = LabeledExample(
        merchant_id=other.id,
        normalized_text="other merchant's example",
        intent="other",
        embedding=[0.1] * 1024,
        source="manual_seed",
    )
    db_session.add(other_example)
    await db_session.flush()

    results = await find_similar_examples(db_session, [0.1] * 1024, merchant_id=merchant.id)

    assert other_example.id not in {r.id for r in results}
```
Add `Merchant` to this file's imports if not already present.

- [ ] **Step 3: Run it to verify it fails**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_embeddings.py::test_find_similar_examples_never_returns_other_merchants_data -v`
Expected: FAIL — `other_example.id` is present in `results` because the unscoped query matches it.

- [ ] **Step 4: Fix `find_similar_examples`**

In `backend/app/engine/embeddings.py`, change the final fallback query to filter to the true global pool (`merchant_id IS NULL`), per spec §5 ("merchant-scoped query first with fallback to the global `LabeledExample` pool"):
```python
async def find_similar_examples(
    session: AsyncSession, embedding: list[float], merchant_id: str | None, limit: int = 5
) -> list[LabeledExample]:
    base_query = select(LabeledExample).order_by(LabeledExample.embedding.cosine_distance(embedding)).limit(limit)
    if merchant_id:
        scoped = await session.execute(base_query.where(LabeledExample.merchant_id == merchant_id))
        rows = list(scoped.scalars().all())
        if rows:
            return rows
    global_pool = await session.execute(base_query.where(LabeledExample.merchant_id.is_(None)))
    return list(global_pool.scalars().all())
```
**Known consequence of this fix, not a bug to chase:** since the live dev DB currently has zero rows with `merchant_id IS NULL`, a merchant with no labeled examples of their own will now get **no** few-shot examples at all (previously it silently got other merchants' examples instead). Seeding a genuine global pool is a separate, deliberate content decision — not part of this fix.

- [ ] **Step 5: Run it to verify it passes**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_embeddings.py -v`
Expected: all PASS, including the new test.

- [ ] **Step 6: Commit**

```bash
git add backend/app/engine/embeddings.py backend/tests/engine/test_embeddings.py
git commit -m "fix: stop find_similar_examples leaking other merchants' labeled examples"
```

---

### Task 2: Fix dead `check_ambiguous_fields` in `evaluate_postflight`

**Files:**
- Modify: `backend/app/engine/routing_policy.py`
- Test: `backend/tests/engine/test_routing_policy.py` (existing test already covers this — see Step 1), `backend/tests/engine/test_extraction.py` (existing test also currently fails from this same root cause)

**Interfaces:**
- Consumes: nothing new
- Produces: `evaluate_postflight(*, confidence, threshold, ambiguous_fields=None) -> str | None` — same signature, now actually checks `ambiguous_fields`.

- [ ] **Step 1: Run the existing failing tests to confirm the bug**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_routing_policy.py::test_escalates_on_ambiguous_fields tests/engine/test_extraction.py -k ambiguous -v`
Expected: FAIL — `evaluate_postflight(confidence=0.9, threshold=0.7, ambiguous_fields=["address"])` returns `None` instead of `"ambiguous_fields_present"`, because the current implementation's check tuple only contains `check_confidence_threshold(...)`; `check_ambiguous_fields` is defined but never called.

- [ ] **Step 2: Fix `evaluate_postflight`**

In `backend/app/engine/routing_policy.py`:
```python
def evaluate_postflight(
    *, confidence: float, threshold: float, ambiguous_fields: list[str] | None = None
) -> str | None:
    for reason in (
        check_confidence_threshold(confidence, threshold),
        check_ambiguous_fields(ambiguous_fields or []),
    ):
        if reason:
            return reason
    return None
```

- [ ] **Step 3: Run the tests to verify they pass**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_routing_policy.py tests/engine/test_extraction.py -v`
Expected: all PASS. This also clears `test_extraction.py::test_extract_order_escalates_on_ambiguous_fields`'s teardown `RESPX` error (the pre-mocked escalation call now actually fires).

- [ ] **Step 4: Commit**

```bash
git add backend/app/engine/routing_policy.py
git commit -m "fix: evaluate_postflight now actually checks ambiguous_fields"
```

---

### Task 3: Implement conditional-language detection in `check_reasoning_heavy`

Spec §4 trigger 5 explicitly suggests detecting "conditional language (لو... يبقى...)" as one heuristic for reasoning-heavy content; no such check exists today, so an existing test (`test_escalates_on_reasoning_heavy_conditional`) fails. **لو ("if") alone is extremely common in ordinary Egyptian Arabic** ("لو سمحت", "لو ممكن") — a single-word check would over-escalate routine messages to the paid Tier-2 model, which is exactly the cost failure SRD §40 warns against. Require a conditional marker **and** a result marker together, mirroring the existing density-based guard against over-firing on ordinary questions.

**Files:**
- Modify: `backend/app/engine/routing_policy.py`
- Test: `backend/tests/engine/test_routing_policy.py`

**Interfaces:**
- Consumes: nothing new
- Produces: `check_reasoning_heavy(text: str) -> str | None` — same signature, now also flags paired conditional language.

- [ ] **Step 1: Run the existing failing test**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_routing_policy.py::test_escalates_on_reasoning_heavy_conditional -v`
Expected: FAIL — `evaluate_preflight(text="لو السعر يزيد يبقى هغير الطلب", ...)` returns `None`; no conditional-language check exists.

- [ ] **Step 2: Write the paired negative-case test first**

Add to `backend/tests/engine/test_routing_policy.py`:
```python
def test_lo_without_conditional_result_does_not_escalate():
    # Regression guard: "لو" alone is extremely common ordinary Egyptian
    # Arabic and must not trigger reasoning_heavy by itself — only paired
    # with a result marker (يبقى/بقى) does it signal actual conditional
    # reasoning, per spec §4 trigger 5's own example ("لو... يبقى...").
    reason = evaluate_preflight(overflowed=False, correction_count=0, text="لو حبيت اطلب تاني هكلمك")
    assert reason is None
```

- [ ] **Step 3: Run it to verify it currently passes (baseline) and the positive case still fails**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_routing_policy.py -k "conditional or lo_without" -v`
Expected: `test_lo_without_conditional_result_does_not_escalate` PASSES (nothing implemented yet, so nothing escalates); `test_escalates_on_reasoning_heavy_conditional` still FAILS.

- [ ] **Step 4: Implement paired conditional-marker detection**

In `backend/app/engine/routing_policy.py`:
```python
CONDITIONAL_MARKERS = ("لو", "إذا", "اذا")
CONDITIONAL_RESULT_MARKERS = ("يبقى", "هيبقى", "بقى")


def check_reasoning_heavy(text: str) -> str | None:
    question_marks = text.count("?") + text.count("؟")
    density = question_marks / max(1, len(text))
    density_heavy = len(text) >= DENSITY_CHECK_MIN_LENGTH and density > QUESTION_MARK_DENSITY_THRESHOLD
    has_conditional = any(marker in text for marker in CONDITIONAL_MARKERS) and any(
        marker in text for marker in CONDITIONAL_RESULT_MARKERS
    )
    if len(text) > REASONING_LENGTH_THRESHOLD or density_heavy or has_conditional:
        return "reasoning_heavy_content"
    return None
```

- [ ] **Step 5: Run both tests to verify they pass**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_routing_policy.py -v`
Expected: all PASS, including both the positive and negative conditional-language cases.

- [ ] **Step 6: Commit**

```bash
git add backend/app/engine/routing_policy.py backend/tests/engine/test_routing_policy.py
git commit -m "feat: detect paired conditional language as reasoning-heavy (spec §4 trigger 5)"
```

---

### Task 4: Fix spam-remainder check stripping the question mark it's about to test for

**Files:**
- Modify: `backend/app/engine/tier0_rules.py`
- Test: `backend/tests/engine/test_tier0_rules.py`

**Interfaces:**
- Consumes: nothing new
- Produces: `match_tier0(normalized_text: str) -> str | None` — same signature; the `"spam"` branch's question-detection no longer discards the evidence it's checking for.

- [ ] **Step 1: Run the existing failing test**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_tier0_rules.py::test_product_link_with_question_is_not_spam -v`
Expected: FAIL. Root cause: `remainder = SPAM_PATTERN.sub("", text).strip(" \t\n.,!؟?،-")` strips the trailing `؟`/`?` **before** `has_question = "?" in remainder or "؟" in remainder` checks for it, so a genuine question containing a product link (e.g. `"هل الفستان ده متاح؟ https://instagram.com/p/xyz"`) has its `؟` stripped along with trailing whitespace, `has_question` becomes `False`, and the short remainder gets misclassified `"spam"`.

- [ ] **Step 2: Open `backend/app/engine/tier0_rules.py` and locate the two lines**

Find (inside `match_tier0`, in the URL/spam-check branch):
```python
remainder = SPAM_PATTERN.sub("", text).strip(" \t\n.,!؟?،-")
has_question = "?" in remainder or "؟" in remainder
```

- [ ] **Step 3: Reorder so the question mark is checked before it's stripped**

Replace with:
```python
url_stripped = SPAM_PATTERN.sub("", text).strip()
has_question = "?" in url_stripped or "؟" in url_stripped
remainder = url_stripped.strip(" \t\n.,!،-")
```
(`؟` and `?` removed from the second `.strip()`'s charset since `has_question` is now evaluated first, against the pre-strip text — leaving them in the second strip's charset would be harmless but redundant; removing them makes the ordering the actual fix, not incidental.) Keep every other line in `match_tier0` — the empty/single-emoji/greeting checks and the final `len(remainder) <= SPAM_REMAINDER_MAX_CHARS` decision — unchanged.

- [ ] **Step 4: Run it to verify it passes**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_tier0_rules.py -v`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/tier0_rules.py
git commit -m "fix: check for question mark before stripping it in spam remainder check"
```

---

### Task 5: Fix `scripts/test_engine.py` — the "test it now" manual harness is currently broken

This script is the existing no-DB, no-channel manual verification tool (`python scripts/test_engine.py "<message>"`), which is exactly the "test it separately, right now" shape wanted going forward. It currently raises `TypeError` on any non-tier0 input.

**Files:**
- Modify: `backend/scripts/test_engine.py`

**Interfaces:**
- Consumes: `classify_message(prompt, known_intents, threshold, overflowed, correction_count, text)`, `extract_order(prompt, threshold, overflowed, correction_count, text)` — the real current signatures (both require positional/keyword `overflowed`, `correction_count`, and `text`; the script currently omits `text` from both calls and `overflowed`/`correction_count` from the classification call).

- [ ] **Step 1: Reproduce the crash**

Run: `cd backend && PYTHONPATH=. .venv/bin/python scripts/test_engine.py "عايز اطلب رز"`
Expected: `TypeError: classify_message() missing 3 required positional arguments: 'overflowed', 'correction_count', and 'text'`

- [ ] **Step 2: Fix the two call sites**

In `backend/scripts/test_engine.py`, update the classification call:
```python
    classification, tier, reason = await classify_message(
        prompt=prompt,
        known_intents=intents,
        threshold=0.7,
        overflowed=_overflowed,
        correction_count=0,
        text=text,
    )
```
(`_overflowed` is already computed a few lines above from `build_context_prompt(...)` — the script currently discards it as `_overflowed`; stop discarding it and use it here instead of a hardcoded value.)

And the extraction call:
```python
        extraction, ext_tier, ext_reason = await extract_order(
            prompt=prompt,
            threshold=0.7,
            overflowed=_overflowed,
            correction_count=0,
            text=text,
        )
```

- [ ] **Step 3: Run it again to verify it completes**

Run: `cd backend && PYTHONPATH=. .venv/bin/python scripts/test_engine.py "عايز اطلب رز"`
Expected: no exception; prints intent/confidence/tier (this will make a real call to whatever `NILECHAT_BASE_URL` currently points at — local Ollama today per `.env` — so Ollama must be running, or expect a connection error instead of a `TypeError`, which is itself confirmation the client-side bug is fixed).

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/test_engine.py
git commit -m "fix: test_engine.py now matches classify_message/extract_order's real signatures"
```

---

## Phase 2 — Hugging Face endpoint compatibility check (standalone, non-blocking)

Not gated on Phase 1 and doesn't gate Phases 3–5 — run this whenever an actual HF Inference Endpoint URL/token exists. Current `.env` points `NILECHAT_BASE_URL` at local Ollama (`http://localhost:11434/v1`); the engine code has **no NileChat-specific branching** anywhere (confirmed: `clients.py` builds a plain `AsyncOpenAI(base_url=..., api_key=...)`, and existing tests already mock against `settings.NILECHAT_BASE_URL` dynamically), so switching the three `NILECHAT_*` env vars is the entire "point at HF" change **if** the endpoint honors the same wire contract Ollama does today.

**The one thing that isn't guaranteed by "OpenAI-compatible":** this codebase relies on `response_format={"type": "json_schema", "json_schema": {...}}` (`app/engine/schemas.py::json_schema_response_format`) for actual **grammar-constrained decoding** — not just JSON-shaped output, but output physically unable to violate the `Literal[...]` intent list. Hugging Face's TGI container exposes an OpenAI-compatible `/v1/chat/completions` route (confirmed), but TGI has historically exposed guided/grammar-constrained generation through a separate `grammar` field, not through OpenAI's `response_format`. An endpoint can accept `response_format` in the request body and silently ignore it — a silent quality regression (out-of-vocabulary intents, malformed JSON), not a loud failure. This must be checked empirically, not assumed from "OpenAI-compatible."

### Task 6: Write and run an HF endpoint constrained-decoding verification script

**Files:**
- Create: `backend/scripts/verify_hf_endpoint.py`

**Interfaces:**
- Consumes: `app.engine.schemas.json_schema_response_format`, `app.core.config.settings` (`NILECHAT_BASE_URL`, `NILECHAT_API_KEY`, `NILECHAT_MODEL`)
- Produces: a pass/fail console report; no other code depends on this script.

- [ ] **Step 1: Write the script**

```python
"""Run once against a real NILECHAT_BASE_URL (e.g. a Hugging Face Inference
Endpoint) before switching production traffic to it. Confirms the endpoint
actually enforces response_format={"type": "json_schema", ...} as
constrained decoding, not just accepting-and-ignoring the field — see
Phase 2 of the AI engine plan for why this can't be assumed from
"OpenAI-compatible" alone."""

import asyncio

from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import Literal

from app.core.config import settings
from app.engine.schemas import json_schema_response_format


class _StrictAnswer(BaseModel):
    answer: Literal["yes", "no"]


async def main() -> None:
    client = AsyncOpenAI(base_url=settings.NILECHAT_BASE_URL, api_key=settings.NILECHAT_API_KEY)
    # Deliberately provoke an out-of-schema answer: a neutral/unknown prompt
    # that a model would naturally answer with something other than a bare
    # "yes"/"no" if the schema constraint weren't actually being enforced.
    response = await client.chat.completions.create(
        model=settings.NILECHAT_MODEL,
        messages=[
            {"role": "system", "content": "Answer strictly per the schema."},
            {"role": "user", "content": "What is the capital of France?"},
        ],
        response_format=json_schema_response_format(_StrictAnswer, "strict_answer"),
    )
    content = response.choices[0].message.content
    print(f"Raw response content: {content!r}")
    try:
        parsed = _StrictAnswer.model_validate_json(content)
        print(f"PASS: endpoint enforced the schema — parsed as {parsed.answer!r}")
    except Exception as exc:
        print(f"FAIL: endpoint did NOT enforce response_format as constrained decoding: {exc}")
        print(
            "Contingency: check whether this endpoint exposes TGI's separate `grammar` field "
            "instead of OpenAI's `response_format`, or fall back to prompt-only JSON instructions "
            "with tolerant parsing (already available via app.engine.clients.parse_json_content, "
            "which raises AICallError rather than crashing on malformed content)."
        )


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: Run it against whatever `NILECHAT_BASE_URL` is currently configured**

Run: `cd backend && PYTHONPATH=. .venv/bin/python scripts/verify_hf_endpoint.py`
Expected against local Ollama today: either PASS or FAIL is informative — record which. Re-run this exact script, unchanged, once `.env`'s `NILECHAT_BASE_URL`/`NILECHAT_API_KEY`/`NILECHAT_MODEL` point at the real HF Inference Endpoint, before relying on it in place of Ollama.

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/verify_hf_endpoint.py
git commit -m "feat: add script to verify an OpenAI-compatible endpoint honors response_format json_schema"
```

---

## Phase 3 — AI Gateway abstraction (SRD §15)

Consolidates 5 independently-duplicated raw `client.chat.completions.create(...)` call sites (`classification.py`, `extraction.py`, `embeddings.py`, and an untested 5th orphan call in `clustering/job.py`) behind one seam, so "swap the provider/endpoint" and "fix a bug in retry/parsing/error-handling once" both become one-place changes instead of four-or-five. This phase is a prerequisite for Phase 4 (usage telemetry needs a single place to capture tokens/latency/conversation context) — do it first.

### Task 7: Create `app/engine/gateway.py` and migrate `classification.py`

**Files:**
- Create: `backend/app/engine/gateway.py`
- Modify: `backend/app/engine/classification.py`
- Test: `backend/tests/engine/test_classification.py` (existing tests must keep passing unchanged — this task is a refactor, not a behavior change)

**Interfaces:**
- Produces:
  - `@dataclass(frozen=True) class Provider: name: str; client: AsyncOpenAI; model: str; temperature: float`
  - `def nilechat_provider() -> Provider`
  - `def escalated_provider() -> Provider`
  - `async def complete(provider: Provider, *, system_prompt: str, user_prompt: str, schema_model: type[BaseModel], parse_model: type[T], schema_name: str) -> T` — issues the chat completion, wraps `APIError`/timeout as `AICallError` (re-using `app.engine.clients.AICallError`), applies the existing `OPENROUTER_PROVIDERS` `extra_body` only when `provider.name == "escalated"`, parses via `app.engine.clients.parse_json_content`, validates against `parse_model` (raising `AICallError` on `pydantic.ValidationError`, matching current behavior), and calls `record_ai_call` with timing — identical externally-observable behavior to today's duplicated `_call` functions.
- Consumes (unchanged): `app.engine.clients.{AICallError, parse_json_content, record_ai_call, get_nilechat_client, get_deepseek_client}`, `app.engine.schemas.json_schema_response_format`, `app.core.config.settings`.

- [ ] **Step 1: Write `gateway.py`**

```python
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import TypeVar

from openai import APIError, AsyncOpenAI
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.engine.clients import AICallError, get_deepseek_client, get_nilechat_client, parse_json_content, record_ai_call
from app.engine.schemas import json_schema_response_format

T = TypeVar("T", bound=BaseModel)


@dataclass(frozen=True)
class Provider:
    name: str  # "nilechat" | "escalated" — matches the tier vocabulary already used throughout the engine
    client: AsyncOpenAI
    model: str
    temperature: float


def nilechat_provider() -> Provider:
    return Provider("nilechat", get_nilechat_client(), settings.NILECHAT_MODEL, settings.NILECHAT_TEMPERATURE)


def escalated_provider() -> Provider:
    return Provider("escalated", get_deepseek_client(), settings.DEEPSEEK_MODEL, settings.DEEPSEEK_TEMPERATURE)


async def complete(
    provider: Provider,
    *,
    system_prompt: str,
    user_prompt: str,
    schema_model: type[BaseModel],
    parse_model: type[T],
    schema_name: str,
) -> T:
    kwargs: dict = {
        "model": provider.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": json_schema_response_format(schema_model, schema_name),
        "temperature": provider.temperature,
    }
    if provider.name == "escalated" and settings.OPENROUTER_PROVIDERS:
        kwargs["extra_body"] = {"provider": {"order": settings.OPENROUTER_PROVIDERS}}

    start = time.monotonic()
    try:
        response = await provider.client.chat.completions.create(**kwargs)
    except APIError as exc:
        raise AICallError(str(exc)) from exc

    record_ai_call(provider.name, provider.model, start, response.usage)

    content = parse_json_content(response)
    try:
        return parse_model.model_validate(content)
    except ValidationError as exc:
        raise AICallError(f"schema validation failed: {exc}") from exc
```

- [ ] **Step 2: Run the existing classification tests to confirm they still pass before touching `classification.py`**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_classification.py -v`
Expected: all PASS (this is the pre-refactor baseline).

- [ ] **Step 3: Migrate `classify_message` to use the gateway**

In `backend/app/engine/classification.py`, replace the private `_call` function and its two call sites (tier1 and escalated) inside `classify_message` with calls to `gateway.complete`, passing `schema_model=_intent_response_schema(known_intents)` (the dynamic `Literal`-constrained model — keeps the grammar constraint exactly as today) and `parse_model=IntentClassification` (the static model, keeps the shared `normalize_confidence` validator). Preserve `classify_message`'s existing public signature, preflight/postflight control flow, and return shape `(IntentClassification, tier: str, reason: str | None)` exactly — only the internals that issue the HTTP call change. Import `nilechat_provider`, `escalated_provider`, and `complete` from `app.engine.gateway`.

- [ ] **Step 4: Run the tests to verify no behavior changed**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_classification.py tests/engine/test_pipeline.py -v`
Expected: all PASS, identical results to Step 2 — confirms the refactor is behavior-preserving. `mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions")`-style mocks keep working unchanged since the gateway still calls the same singleton clients at the same base URLs.

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/gateway.py backend/app/engine/classification.py
git commit -m "refactor: route classify_message through app.engine.gateway"
```

---

### Task 8: Migrate `extraction.py` to the gateway

**Files:**
- Modify: `backend/app/engine/extraction.py`
- Test: `backend/tests/engine/test_extraction.py`, `backend/tests/engine/test_pipeline.py`

**Interfaces:**
- Consumes: `app.engine.gateway.{Provider, nilechat_provider, escalated_provider, complete}` (from Task 7)
- Produces: `extract_order(...)` — unchanged public signature and return shape.

- [ ] **Step 1: Run existing tests to confirm the pre-refactor baseline**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_extraction.py -v`
Expected: all PASS (Task 2's fix already landed, so this is now green).

- [ ] **Step 2: Migrate `extract_order`'s private `_call` to `gateway.complete`**

Same pattern as Task 7 Step 3: `schema_model=parse_model=ExtractionResult` (extraction has no dynamic per-request schema, unlike classification's `Literal` intents). Preserve the preflight/postflight control flow and return shape `(ExtractionResult, tier, reason)`.

- [ ] **Step 3: Run the tests to verify no behavior changed**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_extraction.py tests/engine/test_pipeline.py -v`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/app/engine/extraction.py
git commit -m "refactor: route extract_order through app.engine.gateway"
```

---

### Task 9: Migrate `embeddings.py` and the orphan `clustering/job.py` call site, add coverage for the latter

Embeddings use a different OpenAI SDK surface (`client.embeddings.create`, not `chat.completions.create`) and clustering's cluster-labeling call uses plain `{"type": "json_object"}` rather than a validated schema — neither fits `gateway.complete`'s shape, so each gets its own thin, consistent wrapper in the same module rather than being forced through the chat-completion path.

**Files:**
- Modify: `backend/app/engine/gateway.py`, `backend/app/engine/embeddings.py`, `backend/app/clustering/job.py`
- Test: `backend/tests/engine/test_embeddings.py`, new test in `backend/tests/clustering/`

**Interfaces:**
- Produces (added to `gateway.py`):
  - `async def embed(text: str) -> list[float]` — wraps `get_embedding_client().embeddings.create(...)`, `AICallError` on `APIError`, timed via `record_ai_call("embedding", settings.EMBEDDING_MODEL, start, response.usage)`.
  - `async def complete_json(provider: Provider, *, system_prompt: str, user_prompt: str) -> dict` — same call/error/timing shape as `complete`, but `response_format={"type": "json_object"}` and no schema/parse-model validation (for clustering's freeform cluster-label JSON).

- [ ] **Step 1: Run existing tests to confirm the pre-refactor baseline**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_embeddings.py -v` and (find the clustering job's existing test module first: `ls backend/tests/clustering/`) run whatever exists there too.
Expected: all PASS.

- [ ] **Step 2: Add `embed` and `complete_json` to `gateway.py`**

```python
async def embed(text: str) -> list[float]:
    start = time.monotonic()
    try:
        response = await get_embedding_client().embeddings.create(model=settings.EMBEDDING_MODEL, input=text)
    except APIError as exc:
        raise AICallError(str(exc)) from exc
    record_ai_call("embedding", settings.EMBEDDING_MODEL, start, response.usage)
    return list(response.data[0].embedding)


async def complete_json(provider: Provider, *, system_prompt: str, user_prompt: str) -> dict:
    kwargs: dict = {
        "model": provider.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": provider.temperature,
    }
    if provider.name == "escalated" and settings.OPENROUTER_PROVIDERS:
        kwargs["extra_body"] = {"provider": {"order": settings.OPENROUTER_PROVIDERS}}

    start = time.monotonic()
    try:
        response = await provider.client.chat.completions.create(**kwargs)
    except APIError as exc:
        raise AICallError(str(exc)) from exc
    record_ai_call(provider.name, provider.model, start, response.usage)
    return parse_json_content(response)
```
Add `get_embedding_client` to `gateway.py`'s import from `app.engine.clients`.

- [ ] **Step 3: Migrate `embeddings.py::embed_text` to call `gateway.embed`**

`embed_text(text: str) -> list[float]` keeps its exact signature; its body becomes a call to `gateway.embed(text)` (keep `embed_text` as the public name everything else imports — `pipeline.py`, `product_matching.py` — so no other file changes).

- [ ] **Step 4: Write a test for the previously-untested clustering call site**

In `backend/tests/clustering/` (check the existing file naming convention first — the directory exists per `ls backend/tests/clustering/`), add a test that mocks the OpenRouter chat-completions endpoint (same `mock_ai` pattern used elsewhere) and asserts `label_cluster(...)` (`app/clustering/job.py:57-77` — the function `run_clustering()`, `job.py:80-107`, calls per-cluster) returns a parsed label using the mocked response, and that the mock was actually called (`mock_ai.calls` non-empty) — this is the only test coverage this call site has ever had, so it must exist before the refactor, not after, to prove behavior is preserved.

- [ ] **Step 5: Run it to verify it fails against pre-refactor code if written to target the post-refactor function name — otherwise confirm it passes against current code first**

Run: `cd backend && .venv/bin/python -m pytest tests/clustering/ -v`
Expected: PASS against the current (pre-refactor) `clustering/job.py` — this establishes the safety net.

- [ ] **Step 6: Migrate `clustering/job.py`'s raw call to `gateway.complete_json`**

In `label_cluster()` (`app/clustering/job.py:57-77`), replace the direct `client.chat.completions.create(model=..., messages=[...], response_format={"type": "json_object"})` call with `gateway.complete_json(escalated_provider(), system_prompt=..., user_prompt=...)`, preserving whatever prompt content the current call sends (read the function fully before changing it — this plan's research located and named it but did not quote its full prompt text). Keep `label_cluster`'s graceful-degradation behavior on failure (§6 of the spec: "If the OpenRouter API fails or is unavailable, it degrades gracefully to generic fallback labels") — `gateway.complete_json` raises `AICallError` the same way `complete` does, so the existing `except`/fallback branch around the raw call keeps working unchanged, just catching `AICallError` instead of a raw `openai.APIError`.

- [ ] **Step 7: Run all affected tests to verify no behavior changed**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_embeddings.py tests/clustering/ -v`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/app/engine/gateway.py backend/app/engine/embeddings.py backend/app/clustering/job.py backend/tests/clustering/
git commit -m "refactor: route embeddings and clustering's AI call through app.engine.gateway"
```

---

## Phase 4 — Persisted AI usage telemetry (SRD §32)

`record_ai_call` today only logs `tier`, `model`, `duration_ms`, `prompt_tokens`, `completion_tokens` — to a logger with no `conversation_id`/`message_id`, so a log line can't be joined back to a conversation, and nothing is queryable without grepping stdout. This phase persists it. Depends on Phase 3 (the Gateway is the one place that now makes every AI call, so it's the one place that needs to start returning enough information for `pipeline.py` to record a usage event) — do Phase 3 first.

### Task 10: Add the `AIUsageEvent` model and migration

**Files:**
- Create: `backend/app/models/ai_usage_event.py`
- Modify: `backend/app/models/__init__.py`
- Create: new Alembic revision (via `make migrate`, then hand-edit per the `create_type=False` note below)

**Interfaces:**
- Produces: `AIUsageEvent` ORM model — `id, conversation_id, message_id, tier, provider, model, input_tokens, output_tokens, latency_ms, estimated_cost, success, created_at`. No `tenant_id` column: this codebase has no `Tenant` entity yet (only `Merchant`, reachable via `conversation_id` → `Conversation.merchant_id`) — adding a speculative `tenant_id` with nothing to populate it from would violate the "no config/columns for values that can't be set yet" principle; add it if/when a `Tenant` entity exists.

- [ ] **Step 1: Write the model**

```python
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models._ids import new_id


class AIUsageEvent(Base):
    __tablename__ = "ai_usage_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    conversation_id: Mapped[str | None] = mapped_column(ForeignKey("conversations.id"), nullable=True, index=True)
    message_id: Mapped[str | None] = mapped_column(ForeignKey("messages.id"), nullable=True, index=True)
    tier: Mapped[str] = mapped_column(String, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
```

- [ ] **Step 2: Register it in `app/models/__init__.py`**

Add `AIUsageEvent` to the imports and `__all__` list alongside the existing 7 models/enums.

- [ ] **Step 3: Generate and review the migration**

Run: `cd backend && make migrate` (produces `alembic revision --autogenerate -m "Migration"` — rename the generated file's message to `add_ai_usage_events_table` and its revision docstring accordingly). This migration adds no shared/multi-table enum (`tier`/`provider`/`model` are plain `String`, not `Enum`), so the `create_type=False` trap documented in `alembic/versions/2d17ac4bd857_add_classification_schema.py` does not apply here — confirm the autogenerated migration only contains a single `create_table` for `ai_usage_events` plus its two FK indexes before proceeding.

- [ ] **Step 4: Apply it**

Run: `cd backend && make upgrade`
Expected: succeeds; `\d ai_usage_events` in `psql` shows the new table.

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/ai_usage_event.py backend/app/models/__init__.py backend/alembic/versions/
git commit -m "feat: add AIUsageEvent model and migration (SRD §32)"
```

---

### Task 11: Thread `conversation_id`/`message_id` through the gateway and persist usage events from `pipeline.py`

**Files:**
- Modify: `backend/app/engine/gateway.py`, `backend/app/engine/classification.py`, `backend/app/engine/extraction.py`, `backend/app/engine/pipeline.py`, `backend/scripts/test_engine.py`
- Create: `backend/app/engine/cost.py`
- Test: `backend/tests/engine/test_pipeline.py`

**Note on breaking `scripts/test_engine.py` again:** Task 5 (Phase 1) fixed this script's calls to unpack `classify_message`/`extract_order`'s current 3-tuple return. This task changes both functions to return a 4-tuple (`..., CallUsage | None`). Step 7 below re-fixes `test_engine.py`'s unpacking in the same commit as the signature change, so the two don't drift apart.

**Interfaces:**
- Consumes: `AIUsageEvent` (Task 10)
- Produces:
  - `app.engine.gateway.CallUsage` — `@dataclass(frozen=True) class CallUsage: tier: str; provider: str; model: str; input_tokens: int | None; output_tokens: int | None; latency_ms: float`
  - `gateway.complete(...)` now returns `tuple[T, CallUsage]` instead of bare `T` (breaking change to this brand-new-in-Phase-3 function only — acceptable since nothing outside this plan depends on it yet).
  - `classify_message(...) -> tuple[IntentClassification, str, str | None, CallUsage | None]` — 4-tuple; `CallUsage` is `None` only on the tier0 short-circuit path (which never reaches the gateway) or an `AICallError`.
  - `extract_order(...) -> tuple[ExtractionResult, str, str | None, CallUsage | None]` — same pattern.
  - **`gateway.embed()` is explicitly NOT changed to return a tuple** — scope boundary, not an oversight. `embed_text` is called both from `pipeline.py` (once per turn) and from `product_matching.py` (once per extracted line item, i.e. a variable number of times with no single `message_id` naturally to attach to each call individually). Persisting embedding-call usage would mean threading `conversation_id`/`message_id` into `product_matching.py` too — real added scope beyond "usage events for the classify/extract decisions the AI Gateway makes." Embedding calls keep their existing log-line-only telemetry via `record_ai_call` inside `embed()`, unchanged from Phase 3. Revisit if per-embedding cost tracking becomes a real need.
  - `app.engine.cost.estimate_cost(model: str, input_tokens: int | None, output_tokens: int | None) -> float | None` — looks up a per-model `$/1k tokens` rate table; returns `None` if the model isn't in the table (the table starts **empty** — see Step 1 note) or either token count is `None`.

- [ ] **Step 1: Write `app/engine/cost.py`**

```python
"""Per-model cost-per-1k-tokens rate table. Empty by default — estimate_cost
returns None until real provider pricing is filled in here. Deliberately not
guessing at numbers: a wrong estimated_cost is worse than an absent one for
a field whose stated purpose (SRD §32) is unit-economics tracking."""

# model name -> (input $ / 1k tokens, output $ / 1k tokens)
_COST_PER_1K_TOKENS: dict[str, tuple[float, float]] = {}


def estimate_cost(model: str, input_tokens: int | None, output_tokens: int | None) -> float | None:
    rates = _COST_PER_1K_TOKENS.get(model)
    if rates is None or input_tokens is None or output_tokens is None:
        return None
    input_rate, output_rate = rates
    return (input_tokens / 1000) * input_rate + (output_tokens / 1000) * output_rate
```

- [ ] **Step 2: Write the failing test for usage-event persistence**

Add to `backend/tests/engine/test_pipeline.py` (using the existing `mock_ai`/`conversation` fixtures and whatever single-mocked-response helper the file already uses, e.g. `_chat_response`):
```python
async def test_process_message_persists_ai_usage_event(db_session, conversation, mock_ai):
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "greeting", "confidence": 0.95}'))
    )

    result = await process_message(db_session, conversation, "hi", "hi")

    events = (
        await db_session.execute(select(AIUsageEvent).where(AIUsageEvent.message_id == result.message.id))
    ).scalars().all()
    assert len(events) == 1
    assert events[0].tier == "nilechat"
    assert events[0].conversation_id == conversation.id
    assert events[0].latency_ms > 0
```
Add `AIUsageEvent` and `select` to this file's imports if not already present.

- [ ] **Step 3: Run it to verify it fails**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/test_pipeline.py::test_process_message_persists_ai_usage_event -v`
Expected: FAIL — no `AIUsageEvent` rows exist yet.

- [ ] **Step 4: Make `gateway.complete` (and `complete_json`, `embed`) return `CallUsage`**

In `backend/app/engine/gateway.py`, add:
```python
@dataclass(frozen=True)
class CallUsage:
    tier: str
    provider: str
    model: str
    input_tokens: int | None
    output_tokens: int | None
    latency_ms: float
```
Change `complete`'s final lines from `return parse_model.model_validate(content)` (with the `ValidationError` `except` block) to build and return the tuple:
```python
    latency_ms = (time.monotonic() - start) * 1000
    usage = CallUsage(
        tier=provider.name,
        provider="openrouter" if provider.name == "escalated" else "nilechat",
        model=provider.model,
        input_tokens=getattr(response.usage, "prompt_tokens", None) if response.usage else None,
        output_tokens=getattr(response.usage, "completion_tokens", None) if response.usage else None,
        latency_ms=latency_ms,
    )
    try:
        return parse_model.model_validate(content), usage
    except ValidationError as exc:
        raise AICallError(f"schema validation failed: {exc}") from exc
```
(Move the `record_ai_call` logging call to use this same `latency_ms`/usage data rather than recomputing it, so there's one timing measurement, not two.) **Leave `complete_json` and `embed` returning their current bare types** (`dict` and `list[float]` respectively) — their only callers are `label_cluster` (an offline batch job with no single `conversation_id`/`message_id` to attach a usage event to) and `embed_text` (see the Non-Goal note in this task's Interfaces section above). Only `complete` — the classify/extract seam — changes shape in this task.

- [ ] **Step 5: Update `classify_message` and `extract_order` to return `CallUsage` as a 4th tuple element**

Each already receives `(result, usage)` from its (now 2-tuple-returning) `gateway.complete` calls on both the tier1 and escalated paths — thread whichever `usage` was actually used (the one from the call that produced the returned `result`) through as the new 4th return value. On the tier0-adjacent "escalate directly on preflight" path and the postflight-triggered re-call path, return the **escalated** call's `usage` (the one whose result is actually returned), not the discarded tier1 attempt's.

- [ ] **Step 6: Update `pipeline.py` to persist `AIUsageEvent` rows on both the classification and extraction call sites**

Add imports: `from app.engine.cost import estimate_cost` and `AIUsageEvent` to the existing `from app.models import (...)` block.

Add a small local helper (avoids repeating the same `AIUsageEvent(...)` construction twice):
```python
def _usage_event(
    conversation_id: str, message_id: str, usage: "CallUsage | None", *, success: bool, failed_tier: str | None = None
) -> AIUsageEvent:
    if usage is not None:
        return AIUsageEvent(
            conversation_id=conversation_id,
            message_id=message_id,
            tier=usage.tier,
            provider=usage.provider,
            model=usage.model,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            latency_ms=usage.latency_ms,
            estimated_cost=estimate_cost(usage.model, usage.input_tokens, usage.output_tokens),
            success=success,
        )
    # AICallError path: no CallUsage was produced, but the failure itself is
    # still worth a row (SRD §32's `success` field exists for exactly this).
    return AIUsageEvent(
        conversation_id=conversation_id,
        message_id=message_id,
        tier=failed_tier or "unknown",
        provider="nilechat" if failed_tier == "nilechat" else "openrouter",
        model="unknown",
        input_tokens=None,
        output_tokens=None,
        latency_ms=0.0,
        estimated_cost=None,
        success=False,
    )
```
Import `CallUsage` as a type-only reference (`from app.engine.gateway import CallUsage` — used only for the annotation above; safe since `gateway.py` has no circular import back to `pipeline.py`).

Update the classification call site:
```python
    try:
        classification, tier, reason, usage = await classify_message(
            prompt,
            known_intents,
            settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
            overflowed,
            correction_count,
            normalized_text,
        )
    except AICallError as exc:
        logger.warning("classification_failed message_id=%s error=%s", message.id, exc)
        message.escalation_reason = "ai_call_failed"
        session.add(_usage_event(conversation.id, message.id, None, success=False, failed_tier="nilechat"))
        await session.flush()
        return PipelineResult(message=message, order=None)

    session.add(_usage_event(conversation.id, message.id, usage, success=True))
```

Update the extraction call site the same way:
```python
        try:
            extraction, extraction_tier, extraction_reason, extraction_usage = await extract_order(
                extraction_prompt,
                settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
                extraction_overflowed,
                correction_count,
                normalized_text,
            )
        except AICallError as exc:
            logger.warning("extraction_failed message_id=%s error=%s", message.id, exc)
            if not message.escalation_reason:
                message.escalation_reason = "ai_call_failed"
            session.add(_usage_event(conversation.id, message.id, None, success=False, failed_tier="nilechat"))
            await session.flush()
            return PipelineResult(message=message, order=None)

        session.add(_usage_event(conversation.id, message.id, extraction_usage, success=True))
```
(`AIUsageEvent.message_id` always references the inbound `Message`, never the `Order` — both the classification and extraction events for one customer turn share the same `message_id`, distinguished by `tier`/timing, which is the intended shape per SRD §32's field list.)

- [ ] **Step 7: Re-fix `scripts/test_engine.py`'s unpacking for the new 4-tuple return**

Update both call sites (already touched once in Task 5) to unpack 4 values instead of 3:
```python
    classification, tier, reason, _usage = await classify_message(
        prompt=prompt,
        known_intents=intents,
        threshold=0.7,
        overflowed=_overflowed,
        correction_count=0,
        text=text,
    )
```
and
```python
        extraction, ext_tier, ext_reason, _ext_usage = await extract_order(
            prompt=prompt,
            threshold=0.7,
            overflowed=_overflowed,
            correction_count=0,
            text=text,
        )
```
(`_usage`/`_ext_usage` unused here — this script has no DB session to persist an `AIUsageEvent` against, it only prints to stdout.)

- [ ] **Step 8: Run the new test and the full engine suite to verify nothing regressed**

Run: `cd backend && .venv/bin/python -m pytest tests/engine/ -v`
Expected: all PASS, including the new usage-event test.
Also run: `cd backend && PYTHONPATH=. .venv/bin/python scripts/test_engine.py "عايز اطلب رز"` — confirm it still completes without a `TypeError`/unpacking error.

- [ ] **Step 9: Commit**

```bash
git add backend/app/engine/gateway.py backend/app/engine/classification.py backend/app/engine/extraction.py backend/app/engine/pipeline.py backend/app/engine/cost.py backend/scripts/test_engine.py backend/tests/engine/test_pipeline.py
git commit -m "feat: persist AIUsageEvent rows for every AI call, success or failure"
```

---

## Phase 5 — Evaluation harness (PRD §47, SRD §46–§48)

`LabeledExample` cannot serve as an evaluation set: it's a **live, production-serving** table (few-shot examples injected into real prompts) partly populated by `cluster_labeling` — an unsupervised pipeline where an LLM labels its own clusters. Grading the engine against that table would be grading the model against its own prior output. PRD §47 explicitly wants a dataset "version-controlled separately from production customer data." This harness also runs against the **real** configured endpoint (Ollama today, HF later) — it is deliberately not part of `make test` / CI, since a live-network eval either costs money (OpenRouter escalations) or requires a local model server running, neither of which belongs in an automated test suite that must stay fast and free.

### Task 12: Create the version-controlled evaluation fixture

**Files:**
- Create: `backend/eval/fixtures.json`

**Interfaces:**
- Produces: a JSON array consumed only by Task 13's runner script.

- [ ] **Step 1: Write `backend/eval/fixtures.json`**

At least one example per category from spec/SRD §46 (Arabic, Arabizi, mixed language, typos, product search intent, quantities, address extraction, ambiguous request), each with `input`, `expected_intent`, and `expected_escalation_tier` (`"nilechat"` or `"escalated"`, `null` if a tier0 rule should short-circuit it) — matching PRD §47's required fields (`expected_action`/`expected_products` are omitted for this starter set since there's no action/tool layer or product catalog to resolve against yet — see Non-Goals):
```json
[
  {
    "id": "greeting_arabic",
    "input": "السلام عليكم",
    "expected_intent": "greeting",
    "expected_escalation_tier": null
  },
  {
    "id": "purchase_arabizi",
    "input": "3ayz 2 tshirt aswd xl",
    "expected_intent": "purchase_intent",
    "expected_escalation_tier": "nilechat"
  },
  {
    "id": "purchase_mixed_language",
    "input": "عايز اطلب the black one, size L",
    "expected_intent": "purchase_intent",
    "expected_escalation_tier": "nilechat"
  },
  {
    "id": "question_with_typo",
    "input": "هل عندكو مقاسات تانيه",
    "expected_intent": "question",
    "expected_escalation_tier": "nilechat"
  },
  {
    "id": "spam_reaction",
    "input": "👍",
    "expected_intent": "reaction",
    "expected_escalation_tier": null
  },
  {
    "id": "ambiguous_conditional",
    "input": "لو السعر يزيد يبقى هغير الطلب",
    "expected_intent": null,
    "expected_escalation_tier": "escalated"
  },
  {
    "id": "address_extraction",
    "input": "محمد أحمد 01012345678، 15 شارع التحرير الدقي الدور التالت",
    "expected_intent": "purchase_intent",
    "expected_escalation_tier": "nilechat"
  }
]
```
(`expected_intent: null` on `ambiguous_conditional` because it's expected to escalate on the **preflight** `reasoning_heavy_content` trigger — per Task 3/6's pipeline order, preflight escalation happens before any intent is even classified, so there is no tier1 intent to assert against; the runner (Task 13) must handle a `null` `expected_intent` as "don't check intent, only check tier".)

- [ ] **Step 2: Commit**

```bash
git add backend/eval/fixtures.json
git commit -m "feat: add version-controlled AI evaluation fixture set (PRD §47)"
```

---

### Task 13: Write the evaluation runner script

**Files:**
- Create: `backend/scripts/run_eval.py`

**Interfaces:**
- Consumes: `backend/eval/fixtures.json` (Task 12), `app.engine.tier0_rules.match_tier0`, `app.engine.classification.classify_message`, `app.engine.context_budget.build_context_prompt`, `app.core.config.settings`
- Produces: a console pass/fail report with an accuracy summary; no other code depends on this script. Deliberately **not** a pytest file — hits the real configured endpoint and is meant to be run manually (`python scripts/run_eval.py`), the same "test it now, separately" shape as `test_engine.py`, just scored against a fixed expected-output set instead of printed for manual eyeballing.

- [ ] **Step 1: Write `backend/scripts/run_eval.py`**

```python
"""Manual evaluation runner — NOT part of `make test` / CI. Hits the real
configured NILECHAT_BASE_URL (and OPENROUTER for escalations), so it costs
real latency/money and requires whatever endpoint is currently configured
to be reachable. Run after any change to tier0_rules, routing_policy,
classification, or when validating a new NileChat endpoint (e.g. right
after Phase 2's HF compatibility check passes).

Usage: PYTHONPATH=. .venv/bin/python scripts/run_eval.py
"""

import asyncio
import json
from pathlib import Path

from app.core.config import settings
from app.engine.classification import classify_message
from app.engine.context_budget import build_context_prompt
from app.engine.tier0_rules import match_tier0

FIXTURES_PATH = Path(__file__).parent.parent / "eval" / "fixtures.json"
KNOWN_INTENTS = ["greeting", "spam", "reaction", "purchase_intent", "question", "other"]


async def run_case(case: dict) -> tuple[bool, str]:
    text = case["input"]
    tier0_intent = match_tier0(text)
    if tier0_intent is not None:
        ok = case["expected_escalation_tier"] is None and tier0_intent == case["expected_intent"]
        return ok, f"tier0 -> intent={tier0_intent!r}"

    prompt, overflowed = build_context_prompt(
        history=[],
        slots={},
        current_text=text,
        max_turns=settings.CONTEXT_HISTORY_TURNS,
        token_budget=settings.NILECHAT_CONTEXT_TOKEN_BUDGET,
    )
    classification, tier, reason, _usage = await classify_message(
        prompt, KNOWN_INTENTS, settings.CLASSIFICATION_CONFIDENCE_THRESHOLD, overflowed, correction_count=0, text=text
    )

    tier_ok = tier == case["expected_escalation_tier"]
    intent_ok = case["expected_intent"] is None or classification.intent == case["expected_intent"]
    detail = f"tier={tier!r} (expected {case['expected_escalation_tier']!r}), intent={classification.intent!r}"
    if reason:
        detail += f", reason={reason!r}"
    return tier_ok and intent_ok, detail


async def main() -> None:
    cases = json.loads(FIXTURES_PATH.read_text())
    passed = 0
    for case in cases:
        ok, detail = await run_case(case)
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {case['id']}: {detail}")
        passed += ok

    print(f"\n{passed}/{len(cases)} passed ({passed / len(cases):.0%})")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: Run it against the currently-configured endpoint**

Run: `cd backend && PYTHONPATH=. .venv/bin/python scripts/run_eval.py`
Expected: a per-case PASS/FAIL report and an overall accuracy percentage. This is the concrete "test the AI engine separately, right now" deliverable — re-run unchanged after Phase 1's fixes land, and again after pointing `NILECHAT_BASE_URL` at a real HF endpoint (Phase 2), to compare accuracy across the endpoint swap.

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/run_eval.py
git commit -m "feat: add manual evaluation runner scoring fixtures.json against the live engine"
```

---

## Verification

**Per phase:**
- Phase 1: `cd backend && .venv/bin/python -m pytest tests/engine/ -v` goes from 5 failed/35 passed/1 error to all passing. `PYTHONPATH=. .venv/bin/python scripts/test_engine.py "عايز اطلب رز"` completes without `TypeError`.
- Phase 2: `scripts/verify_hf_endpoint.py` produces a clear PASS/FAIL against whatever endpoint is configured.
- Phase 3: `cd backend && make test` stays green throughout (each migration task is a behavior-preserving refactor verified by the existing suite); the new clustering test (Task 9) passes both before and after that task's refactor step.
- Phase 4: the new `test_process_message_persists_ai_usage_event` passes; a manual `POST` to `/messages` followed by `SELECT * FROM ai_usage_events ORDER BY created_at DESC LIMIT 1;` shows a row with realistic `latency_ms` and correct `conversation_id`/`message_id`.
- Phase 5: `scripts/run_eval.py` runs to completion and prints an accuracy percentage; re-running it is how the user validates the HF endpoint switch without needing channels, auth, or a dashboard.

**End to end, after all phases:**
1. `cd backend && make lint && make test` clean.
2. `PYTHONPATH=. .venv/bin/python scripts/run_eval.py` — record the baseline accuracy percentage against the currently-configured endpoint.
3. Point `.env`'s `NILECHAT_BASE_URL`/`NILECHAT_API_KEY`/`NILECHAT_MODEL` at the real Hugging Face Inference Endpoint once provisioned; re-run `scripts/verify_hf_endpoint.py`, then `scripts/run_eval.py` again and compare against the Step 2 baseline.

## Execution options

Two ways to run this once approved:

1. **Subagent-Driven (recommended)** — a fresh subagent per task, with review between tasks.
2. **Inline Execution** — batch execution in this session with checkpoints for review.
