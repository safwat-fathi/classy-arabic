# AI-Driven Responses & Merchant AI Learning — Implementation Status

Date: 2026-09-05
Source plan: `implement-ai-driven-response.md` (reviewed & challenged) + two requested features: Custom AI Learning UI, Continuous Learning from previous conversations.

---

## 1. What the plan was

### 1a. Challenges applied to the original plan

The original `implement-ai-driven-response.md` had five real problems that were corrected before implementation:

1. **It never fixed the case it was written for.** Pure greetings (`"hi"`, `"أهلا"`) match the tier-0 regex in `engine/tier0_rules.py` and return *before* classification — so a generation step hooked after classification would never run for greetings. Fix: generation is hooked into the tier-0 greeting path too.
2. **It ignored the tool-use path.** Merchants with `ai_tool_ordering_enabled=true` reply via `engine/action_resolution.py` with hardcoded **English** templates. Fix: action outcomes are now rephrased by the same generation step.
3. **It deleted the safety net.** Removing all hardcoded strings would mean: generation call fails → customer gets silence. Fix: worker keeps the order-confirmation fallback; generation failures return `None` and never crash the reply path.
4. **Existing bug folded in.** On low-confidence classification the pipeline triggered human handoff and *still* auto-replied from knowledge search. Fix: escalation now returns early with `answer_text=None` on both the classification and action paths.
5. **Mis-described current behavior.** Knowledge search runs for every non-order message (keyword substring match), not "if it's a question". Generation now grounds on the top knowledge match whenever one exists.

### 1b. Final approved plan (three parts)

- **Part A — AI-generated replies**: new `engine/generation.py` (`generate_reply`, structured `{reply}` output via the existing `complete()` gateway so usage tracking comes free). Called from: tier-0 greeting path, classification path (grounded on `store_info` when a knowledge match exists), and the action path (rephrasing `action_result` facts into Arabic). Never called for orders, spam/reactions, escalations, or human takeovers. Order confirmations stay hardcoded (no AI near order numbers).
- **Part B — Custom AI Learning**: merchant CRUD for `labeled_examples` (the few-shot mechanism already existed — `find_similar_examples` + dynamic intent vocabulary). Critical non-obvious step: **embed text on write**, otherwise examples never surface. Frontend training page under `/merchant/training`.
- **Part C — Continuous Learning**: schedule the existing `clustering/job.py` behind a new opt-in merchant flag `auto_learning_enabled` (default OFF), scoped per-merchant (the job previously clustered all tenants' messages mixed together), surfaced in settings UI. Auto-learned examples appear in the training UI with a "تلقائي" source badge and can be deleted.

---

## 2. What is DONE

### Backend

| File | Change |
|---|---|
| `app/engine/generation.py` | **New.** `generate_reply()` — one DeepSeek call, `GeneratedReply` schema, returns `(reply, CallUsage)`. |
| `app/engine/prompts.py` | **New** `GENERATION_TASK_BLOCK`: Egyptian Arabic persona, ground only in `store_info`/`action_result`, never invent facts. |
| `app/engine/schemas.py` | **New** `GeneratedReply` model. |
| `app/engine/pipeline.py` | Tier-0 greeting → AI generation. Escalation guard (no auto-reply after handoff) on classification + action paths. Classification path: knowledge match → `store_info`-grounded generation; no match → generation with "say you'll check" instruction. Action path: `action_result` rephrased by AI. `_generate_reply` helper: fail-open (`None` + failure usage event). |
| `app/worker.py` | Removed hardcoded greeting fallback; kept order-confirmation fallback. Added daily 03:00 arq cron `run_auto_learning`. |
| `app/domains/labeled_examples/` | **New domain** (router/service/schemas): `GET/POST/PUT/DELETE /labeled-examples/`, merchant-scoped, snake_case intent validation, embeds text on create and on text update (fail-open if embedding API is down). |
| `app/domains/merchants/router.py` | **New.** `GET/PATCH /merchants/me/settings` — `auto_learning_enabled` only. |
| `app/models/merchant.py` + `alembic/versions/a1b2c3d4e5f6_*.py` | New `auto_learning_enabled` column (default false). **Migration applied to local dev DB only.** |
| `app/models/enums.py` | `DEFAULT_INTENTS` moved here (single source of truth; pipeline re-imports it). |
| `app/clustering/job.py` | Fetches only opted-in merchants (`auto_learning_enabled=true`); clusters **per merchant** (no cross-tenant mixing); `source="cluster_labeling"` on created examples. |
| `app/api/router.py` | Registered `/labeled-examples` and `/merchants` routers. |
| `app/engine/action_resolution.py` | Translated internal action-path escalation messages to Arabic for consistency. |

### Frontend

| File | Change |
|---|---|
| `lib/training.ts` | **Modified.** `LabeledExample` type. Removed hardcoded `DEFAULT_INTENTS` in favor of backend fetch. |
| `app/merchant/training/page.tsx` + `training-client.tsx` | **New page.** Server-fetched list; add/edit/delete examples; intent datalist suggestions fetched from backend; JSON extraction editing; source badge (يدوي/تلقائي). |
| `app/merchant/settings/page.tsx` + `auto-learning-toggle.tsx` | **New** "التعلم المستمر" toggle → `PATCH /merchants/me/settings`. |
| `app/merchant/sidebar-client.tsx` | New nav entry "تدريب الـ AI". |
| `app/demo/actions.ts` | Server actions: `fetchExamplesAction`, `createExampleAction` (with extraction), `updateExampleAction` (with extraction), `deleteExampleAction`, `updateAutoLearningAction`. |
| `lib/dal.ts` | Exported `getAuthToken`; added `getMerchantSettings()`. |

### Tests (all written, all passing)

- `tests/engine/test_pipeline.py`: 5 new tests — tier-0 greeting generation; greeting generation failure → `None` + failure usage event; question-path generation failure → `None`; low-confidence classification escalates **without** auto-reply; no-knowledge generation prompt contains no `store_info:`. Updated 4 existing tests for the two-call (classification + generation) pipeline and the knowledge-as-grounding semantics.
- `tests/domains/labeled_examples/test_service.py`: **new** — embed-on-write, fail-open on embedding failure, re-embed on text change, snake_case intent validation.
- `tests/clustering/test_job.py`: fixtures opt the merchant into auto-learning.
- `tests/domains/test_messages_router.py`: updated question-ingest test for the generation call.

### Verification status

- `uv run pytest`: **267 passed, 17 failed — all 17 verified pre-existing** (redis not running locally; missing `AUTH_DEV_BYPASS_MERCHANT_ID` setting; meta client tests). Confirmed by running against `git stash` baseline.
- `make -C backend lint`: clean.
- `pnpm -C frontend lint`: 0 errors (233 pre-existing warnings in generated paraglide files).
- `tsc --noEmit`: clean.

---

## 3. What is NOT done

1. **No live smoke test against real Facebook Messenger.** All verification is mocked (pytest-httpx2). The manual checks from the plan (real greeting → dynamic reply; real question → grounded answer; inspect `ai_usage_events`) still need to be run against a live environment.
2. **Migration applied to local dev DB only.** Other environments need `alembic upgrade head` (revision `a1b2c3d4e5f6`).
3. **No review/approval queue for auto-learned examples.** Clustered examples go live immediately and influence classification. Deliberate simplification — merchants prune bad ones from the training page. Add approval flow if bad auto-labels become a real problem.
4. **Clustering cron is daily 03:00 server-local, hardcoded.** No per-merchant scheduling, no cost cap beyond the existing `limit=1000` fetch cap. `ponytail` note: upgrade to a settings value when someone actually needs to change it.
5. **Tier-0 path now fetches history + merchant info even for spam/reactions** (one extra cheap query each). Accepted trade-off for hooking generation into the tier-0 greeting path.
6. **Cost/latency watch item:** the classification path is now 2–3 sequential LLM calls per non-order message (embed + classify + generate; +1 on tier-0 greetings). Monitor `ai_usage_events` after rollout.

## 4. Files changed (summary)

16 modified, 7 new (see `git status`). Nothing committed — all changes are in the working tree.
