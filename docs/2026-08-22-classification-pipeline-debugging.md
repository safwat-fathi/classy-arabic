# Classification Pipeline: Debugging Session Log — 2026-08-22

## Summary

Session started as a provider swap (NileChat/embeddings to new endpoints), then uncovered a chain of real bugs while chasing why a message classification kept returning wrong results in Swagger. Each issue below blocked the next one from being diagnosable — fixing them one at a time was necessary to see the next layer. This document records what was found, why it existed, and what fixed it, for anyone hitting the same symptoms again or reviewing the history.

---

## 1. App wouldn't boot — `EMBEDDING_BASE_URL`/`EMBEDDING_API_KEY` required but absent from `.env`

**Symptom:** `from app.core.config import settings` raised `pydantic_core.ValidationError: 2 validation errors for Settings`.

**Root cause:** `.env` had already been edited (by hand, before this session) to drop the self-hosted embedding endpoint in favor of routing embeddings through OpenRouter, but `app/core/config.py` still declared `EMBEDDING_BASE_URL`/`EMBEDDING_API_KEY` as required fields with no default. Config and `.env` had drifted out of sync.

**Fix:** Removed both fields from `Settings` (`app/core/config.py`). `app/engine/clients.py::get_embedding_client()` now builds its client from `OPENROUTER_BASE_URL`/`OPENROUTER_API_KEY` instead. Confirmed live: OpenRouter's `baai/bge-m3` returns 1024-dim vectors, matching the `pgvector.Vector(1024)` columns.

## 2. Unclosed `httpx.AsyncClient` per AI call

**Symptom:** none observed directly — found during review, not from a failure.

**Root cause:** all three client factories (`get_nilechat_client`, `get_deepseek_client`, `get_embedding_client`) explicitly passed `http_client=httpx.AsyncClient()`. Since these are called fresh on every classification/extraction/embedding call, each call built and never closed an `httpx.AsyncClient` — a connection/fd leak under any real load.

**Fix:** Removed the `http_client=` kwarg from all three. `AsyncOpenAI()` manages its own client when none is passed.

## 3. `respx` couldn't mock any AI call — silently hit the real network

**Symptom:** after fixing (1), the full test suite failed with `httpcore.ConnectError` / DNS resolution errors on every test that mocks an AI call.

**Root cause:** `openai>=3.3.1` moved its HTTP layer to a new package, `httpx2` (a distinct package from `httpx`, not a version bump — same author, published separately). `respx` 0.23.1 only patches `httpx`. Every `client.chat.completions.create(...)`/`embeddings.create(...)` call was escaping the mock layer and hitting the real network. This was **pre-existing and unrelated to the config change** — it was only ever exposed because the mock target URLs became syntactically correct (matching real hostnames) instead of `localhost:8001`/`localhost:8002`, which would have failed the same way but less visibly.

**Fix:** Added `pytest-httpx2` (same author as `respx`, built specifically for this). `tests/conftest.py`'s `mock_ai` fixture now wraps the plugin's `httpx2_mock` fixture instead of calling `respx.mock()` directly — every existing `mock_ai.post(...)` call site kept working unchanged.

## 4. Test mock URLs were hardcoded, not settings-driven

**Root cause:** `tests/engine/test_{classification,extraction,embeddings,pipeline}.py` hardcoded `http://localhost:8001/...` and `http://localhost:8002/v1/embeddings` as respx mock targets. Once the real base URLs changed (OpenRouter for embeddings, an HF endpoint or Ollama for NileChat), these literals silently stopped matching anything real — and since `Settings()` reads `.env` at import time, tests use whatever's actually configured, not a fixed value.

**Fix:** All mock URLs now built as `f"{settings.NILECHAT_BASE_URL}/chat/completions"` / `f"{settings.OPENROUTER_BASE_URL}/embeddings"` — tests stay correct regardless of what's in `.env`.

## 5. CLI test script (`scripts/test_engine.py`) sent a different prompt than the real pipeline

**Symptom:** identical raw text classified differently through `scripts/test_engine.py` vs. the real `POST /api/v1/messages/` endpoint.

**Root cause:** `scripts/test_engine.py` called `classify_message`/`extract_order` with a bare `f"customer: {text}"` prompt. The real pipeline (`app/engine/pipeline.py::process_message`) builds its prompt via `build_context_prompt()`, which always prepends a `slots: {...}` line — even for a brand-new conversation with no history. The model was seeing two different inputs for "the same" message.

**Fix:** `scripts/test_engine.py` now calls `build_context_prompt()` itself (empty history, empty slots) and reuses that one prompt for both classification and extraction, matching `pipeline.py`'s own behavior exactly.

## 6. No `temperature`/`seed` pinned on any AI call

**Root cause:** `classification.py`/`extraction.py` never set `temperature` on `chat.completions.create(...)`. Against a local Ollama-served model this meant classification could vary between otherwise-identical calls.

**Fix:** Added `NILECHAT_TEMPERATURE: float = 0.1` to `Settings`, passed only on the tier-1 (nilechat) call — tier-2 (DeepSeek, a hosted model) left at its provider default, since this was about taming a specific local model's variance, not changing escalation behavior.

## 7. `pytest` was trying to collect `scripts/test_engine.py` as a real test

**Symptom:** after fixing (5), `uv run pytest` reported `ERROR scripts/test_engine.py::test_raw_message — fixture 'text' not found`.

**Root cause:** the file's name (`test_engine.py`) and its function (`test_raw_message(text: str)`) both match pytest's default discovery pattern, and with no `testpaths` configured, pytest scans the whole repo, not just `tests/`.

**Fix:** Added `testpaths = ["tests"]` to `[tool.pytest.ini_options]` in `pyproject.toml`.

## 8. `_known_intents()` could narrow the model's option list down to a single wrong value — the big one

**Symptom:** a clearly purchase-intent message (`"عايزة اطلب الفستان الصيفي الابيض مقاس لارج"`) kept classifying as `question` with a suspiciously exact confidence (`0.9999999999999999`), consistently, across many retries and after fixes 1–7 above.

**Root cause:** `app/engine/pipeline.py::_known_intents()`:
```python
async def _known_intents(session):
    result = await session.execute(select(Message.intent).where(Message.intent.is_not(None)).distinct())
    intents = {row[0] for row in result.all()}
    return sorted(intents) if intents else list(DEFAULT_INTENTS)
```
queries **every** `Message.intent` in the entire database (no merchant/conversation scoping) and **replaces** `DEFAULT_INTENTS` with whatever's been observed, rather than adding to it. `scripts/seed.py` inserts one message with `intent="question"` hardcoded. Once that row existed, this function returned `["question"]` and *only* `["question"]` — the classification system prompt then literally said *"Known intents so far: question."* The model was never shown `purchase_intent`, `greeting`, etc. as options. It correctly picked the only option it was given, then that got persisted, reinforcing the same narrowed list for the next message — a self-reinforcing bug, not model flakiness.

**Fix:**
```python
async def _known_intents(session):
    result = await session.execute(select(Message.intent).where(Message.intent.is_not(None)).distinct())
    observed = {row[0] for row in result.all()}
    return sorted(observed | set(DEFAULT_INTENTS))
```
Always unions with the baseline set instead of replacing it. Added regression tests (`tests/engine/test_pipeline.py::test_known_intents_includes_defaults_even_when_db_has_narrower_history`, `test_known_intents_adds_newly_observed_labels`).

**Open design question, not resolved here:** this function is still global — a real multi-merchant deployment would presumably want known-intent tracking scoped per merchant (or per some shared taxonomy), not pooled across every merchant in the database. Flagging rather than silently deciding, since it's a product decision.

## 9. Ollama's `nilechat` Modelfile chat template silently dropped the system prompt

**Symptom:** even after fix (8), the same message still misclassified, still with the same `0.9999999999999999` confidence pattern.

**Root cause:** `ollama show nilechat --modelfile` revealed the imported model's `TEMPLATE`:
```
{{- if eq .Role "user" }}<start_of_turn>user
{{- if and (eq $i 1) $.System }}
{{ $.System }}
{{ end }}
{{ .Content }}<end_of_turn>
```
The system prompt is only injected when the message index `$i` equals **1** (the *second* message). Every classification call has exactly one user turn (`$i == 0` — a fresh conversation, no history yet), so that condition was never true. The entire task instructions, known-intents list, and JSON-schema requirement were silently dropped from every single call; the model was generating from bare, uninstructed text. This explains both the wrong answers and the suspiciously flat confidence — a model with no task framing, self-reporting confidence on a task it was never told about.

**Fix:** off-by-one in the Modelfile, `eq $i 1` → `eq $i 0`. Reconstructed the model with `ollama create nilechat -f <corrected Modelfile>`. Confirmed via a raw-prompt/raw-response diagnostic that the system prompt now reaches the model and it correctly reasons about the message content. **This lives outside the git repo** (Ollama's local model registry) — nothing to commit here, but worth documenting since the next person to re-import this model from scratch will hit the identical bug unless they know to fix the template.

## 10. Model ignored "pick from this list" even with the system prompt correctly arriving

**Symptom:** after fix (9), the model correctly *understood* the message ("customer wants to order a white summer dress") but invented a new label (`customer_wants_to_order_a_summer_white_dress_size_large`) instead of picking `purchase_intent` from the given list — even after three separate prompt-wording attempts, including an explicit few-shot example.

**Root cause:** `IntentClassification.intent` (`app/engine/schemas.py`) is a plain `str`. JSON-schema/grammar-constrained decoding enforces valid JSON *shape* (a string value exists), never the *value* itself. A quantized 3.9B local model (`Q3_K_M`) reliably ignores prose instructions to restrict itself to a given set, regardless of how the instruction is worded.

**Fix:** `app/engine/classification.py::_intent_response_schema()` now builds a **dynamic** pydantic model per call with `intent: Literal[tuple(known_intents)]`, used only to build the `response_format` JSON schema sent to the API — actual parsing still goes through the static `IntentClassification` model (keeping its `normalize_confidence` validator). This makes grammar-constrained decoding physically unable to emit any value outside the known set, independent of the model's instruction-following quality. Verified 3/3 consistent correct results in isolation.

**Side effect this exposed — DB pollution from live debugging (fix 11):** two `Message` rows from earlier failed live-testing attempts had `intent='customer'` persisted (a real value the model emitted before fix 9 landed). Because `_known_intents()` unions *all* historical values, `'customer'` became a legitimate member of the `Literal` enum, and the model validly — correctly, given the (polluted) options — picked it again. Not a bug in the Literal-enum mechanism; a data-cleanliness artifact from this debugging session's own test traffic. Deleted the two `intent='customer'` rows (user-approved, since it's a destructive DB operation) and re-verified: `POST /api/v1/messages/` with the exact message that failed throughout this entire session now returns `intent: purchase_intent`, creates an `Order`, and correctly resolves the line item to the seeded product via `product_matching.py`.

---

## Also built this session (not a bug fix): product-to-line-item matching

`app/engine/product_matching.py::match_line_items_to_products` — embeds each extracted line item's `product_name`, cosine-matches against `Product.embedding` scoped to the conversation's merchant, attaches `product_id` when a close-enough match exists. Wired into `pipeline.py` right after extraction. Required:
- `ExtractedLineItem.product_id: str | None` added to the schema.
- `scripts/seed.py` now actually embeds products (nothing did before — `Product.embedding` was always `None`).
- New Alembic migration adding an HNSW index on `products.embedding` — the original migration had one for `messages` and `labeled_examples` but not `products`.
- `max_distance` default started at `0.3` (borrowed from `clustering.py`'s unrelated threshold) but real `bge-m3` distances showed a genuine same-product match at `0.41` — raised the default to `0.45` based on that one real calibration point, documented in code as still "pending more real data."

## Known gaps / things not fixed here

- **`_known_intents()` has no merchant/conversation scoping.** Works correctly for a single-tenant test setup; a real multi-merchant deployment likely wants this scoped. Not decided or changed — flagged as a product question.
- **Self-reported confidence is still a soft, uncalibrated signal** (per the original engine plan's own words: "explicitly a placeholder pending real calibration data"). Fix 9/10 removed the specific failure mode that was producing artificially flat `0.999...` values, but confidence is still model-reported, not logprob-derived.
- **`MessageIngestResponse` doesn't expose line items or `product_id`** — verifying product matching worked required querying the DB directly. Not part of this session's scope to change.
- **No Product CRUD API** — still true, matches the original engine plan's explicit exclusion. The seeder is the only thing that creates `Product` rows.
- **The `nilechat` Ollama model is `Q3_K_M`-quantized (heavy compression of a 3.9B model).** Even with the template and schema fixes, expect this to be a weaker classifier than the hosted DeepSeek escalation tier — the pipeline's tier-2 escalation exists precisely for this reason.
