# Graph Report - tijaratk-bot  (2026-09-03)

## Corpus Check
- 274 files · ~270,363 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1586 nodes · 3408 edges · 129 communities (115 shown, 14 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 232 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db0ecb45`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ActionArgumentError
- ChannelConnection
- app/models/__init__.py
- Product
- test_product_matching.py
- delivery/router.py
- app/page.tsx
- resolve_action
- LabeledExample
- devDependencies
- workspace.tsx
- process_message
- compilerOptions
- Merchant
- gateway.py
- ingest_message
- build_system_prompt
- get_db
- evaluate_preflight
- get_current_merchant
- channels/test_router.py
- build_context_prompt
- create_access_token
- conversations/router.py
- ConvState
- match_tier0
- settings.json
- FastAPI
- verify_facebook_access_token
- TijaratkBot_SRD.md
- TijaratkBot_PRD.md
- auth/router.py
- health_check
- onboarding/page.tsx
- 1511b3371e51_add_ai_usage_events_table.py
- 2d17ac4bd857_add_classification_schema.py
- fb2585d043c4_add_missing_fk_and_intent_indexes.py
- Settings
- opencode.json
- graphify.js
- testimonials.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- tijaratk-bot
- products/service.py
- Backend review & remediation plan — classy-arabic (`backend/`)
- TijaratkBot AI Engine — Correctness, Gateway, Observability & Evaluation Implementation Plan
- AI Action Validator + Tool Layer Implementation Plan
- Public Demo Page Security Hardening Implementation Plan
- Global Constraints
- Channel Ingestion (Facebook, Instagram, WhatsApp Webhooks) Implementation Plan
- Classification Pipeline: Debugging Session Log — 2026-08-22
- Cart & Checkout Services + Order Service Hardening Implementation Plan
- Global Constraints
- merchant.py
- Demo Merchant Seed Implementation Plan
- TijaratkBot Marketing Site — SEO & Frontend Performance Plan
- Commerce Layer Completion — Doc Reconciliation + Safe-to-Land Gaps
- TijaratkBot: Message Classification & AI Engine — Technical Spec (Core)
- TijaratkBot
- 2. 16-Task Roadmap & Progress Status
- README.md
- CLAUDE.md
- handoff/test_router.py
- test_action_schemas.py
- 33. Onboarding
- extract_order
- 44. Failure Handling
- AGENTS.md
- 15. AI Tool/Action Set
- 32. Merchant Dashboard Requirements
- 3. Technology Baseline
- frontend/README.md
- MVP Scope
- 45. Latency Targets
- 46. Testing Strategy
- 52. Recommended Initial Plan Configuration
- This is NOT the Next.js you know
- 2. Product Positioning
- 37. Future Roadmap
- 6. Core Product Modes
- TijaratkBot — Product Requirements Document (PRD)

## God Nodes (most connected - your core abstractions)
1. `Product` - 103 edges
2. `Merchant` - 69 edges
3. `ProductVariant` - 63 edges
4. `process_message()` - 45 edges
5. `get_db()` - 42 edges
6. `new_id()` - 41 edges
7. `ConvState` - 38 edges
8. `add_item()` - 37 edges
9. `get_current_merchant()` - 35 edges
10. `Conversation` - 32 edges

## Surprising Connections (you probably didn't know these)
- `test_facebook_callback_creates_merchant_and_returns_token()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/auth/test_router.py → backend/app/core/database.py
- `test_facebook_callback_rejects_invalid_facebook_token()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/auth/test_router.py → backend/app/core/database.py
- `test_facebook_callback_rejects_suspended_merchant()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/auth/test_router.py → backend/app/core/database.py
- `test_meta_post_creates_message_and_enqueues_job()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/channels/test_router.py → backend/app/core/database.py
- `test_meta_post_duplicate_delivery_enqueues_again_for_worker_idempotency()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/channels/test_router.py → backend/app/core/database.py

## Import Cycles
- None detected.

## Communities (129 total, 14 thin omitted)

### Community 0 - "ActionArgumentError"
Cohesion: 0.06
Nodes (68): _ActionBase, AddToCartAction, CreateOrderAction, ExtractionResult, GetCheckoutStateAction, GetDeliveryInfoAction, GetProductAction, IntentClassification (+60 more)

### Community 1 - "ChannelConnection"
Cohesion: 0.08
Nodes (49): parse_meta_payload(), verify_meta_signature(), ArqRedis, AsyncSession, get, post, receive_meta_webhook(), receive_twilio_webhook() (+41 more)

### Community 2 - "app/models/__init__.py"
Cohesion: 0.05
Nodes (78): AbstractAsyncContextManager, ConversationNotFoundError, create_manual_order(), ProductNotFoundError, AsyncSession, Exception, AsyncSession, Decimal (+70 more)

### Community 3 - "Product"
Cohesion: 0.05
Nodes (110): add_item(), CartItemNotFoundError, _get_item_for_conversation(), _get_or_create_active_cart(), AsyncSession, Exception, line_item_id does not reference an existing cart item for this conversation's…, remove_item() (+102 more)

### Community 4 - "test_product_matching.py"
Cohesion: 0.18
Nodes (25): build_resolved_order_lines(), match_line_items_to_products(), match_variant_hint(), AsyncSession, Batch-loads Product and ProductVariant rows for every resolved id across all…, Pure, no DB access. Case-insensitive substring match: first check `hint`…, For each item with a resolved product_id, load that product's ACTIVE…, resolve_variants_for_line_items() (+17 more)

### Community 5 - "delivery/router.py"
Cohesion: 0.18
Nodes (28): delete_delivery_area_endpoint(), get_delivery_areas(), patch_delivery_area(), post_delivery_area(), AsyncSession, delete, get, post (+20 more)

### Community 6 - "app/page.tsx"
Cohesion: 0.06
Nodes (23): cairo, tajawal, BrandMark(), Page(), PricingSection(), Analytics(), FAQSection(), getFaqs() (+15 more)

### Community 7 - "resolve_action"
Cohesion: 0.30
Nodes (12): ActionResolution, AsyncSession, Conversation, _render_response(), resolve_action(), ActionOutcome, _chat_response(), test_resolve_action_escalates_on_invalid_json_after_retry() (+4 more)

### Community 8 - "LabeledExample"
Cohesion: 0.07
Nodes (37): asyncio, do_run_migrations(), Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, Run migrations in 'online' mode., run_async_migrations(), run_migrations_offline(), run_migrations_online() (+29 more)

### Community 9 - "devDependencies"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, dependencies, @inlang/paraglide-js, @inlang/paraglide-next, next, react, react-dom (+29 more)

### Community 10 - "workspace.tsx"
Cohesion: 0.11
Nodes (22): IngestState, sendMessage(), AIInsights(), findProduct(), initialState, MessageComposer(), Home(), formatVariants() (+14 more)

### Community 11 - "process_message"
Cohesion: 0.23
Nodes (29): _correction_count(), _known_intents(), _merchant_info(), PipelineResult, process_message(), AsyncSession, _chat_response(), _embedding_response() (+21 more)

### Community 12 - "compilerOptions"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 13 - "Merchant"
Cohesion: 0.09
Nodes (43): AsyncSession, post, return_to_ai(), takeover_conversation(), HandoffReturnRequest, HandoffTakeoverRequest, BaseModel, create() (+35 more)

### Community 14 - "gateway.py"
Cohesion: 0.19
Nodes (19): AsyncOpenAI, AICallError, get_deepseek_client(), get_embedding_client(), parse_json_content(), Exception, Model call failed or returned unusable content., §7's observability requirement: log token counts + latency for every AI call,… (+11 more)

### Community 15 - "ingest_message"
Cohesion: 0.17
Nodes (17): ingest(), AsyncSession, MessageIngestRequest, MessageIngestResponse, post, Response, MessageIngestRequest, MessageIngestResponse (+9 more)

### Community 16 - "build_system_prompt"
Cohesion: 0.31
Nodes (6): build_system_prompt(), test_build_system_prompt_accepts_action_task_block(), test_empty_slots_says_nothing_gathered(), test_includes_merchant_name_and_dialect_guidance(), test_nonempty_slots_are_serialized_without_ascii_escaping(), test_state_gloss_is_included()

### Community 17 - "get_db"
Cohesion: 0.18
Nodes (16): get_db(), Dependency function that yields a database session., test_delivery_area_crud_happy_path(), test_delivery_areas_endpoints_require_auth(), test_patch_and_delete_reject_cross_merchant_area(), test_get_conversations_requires_authentication(), test_list_conversations_filters_by_merchant_id(), _chat_response() (+8 more)

### Community 18 - "evaluate_preflight"
Cohesion: 0.20
Nodes (16): check_ambiguous_fields(), check_confidence_threshold(), check_reasoning_heavy(), check_repeated_correction(), evaluate_postflight(), evaluate_preflight(), Triggers knowable before any model call., Triggers only knowable from the model's output. (+8 more)

### Community 19 - "get_current_merchant"
Cohesion: 0.29
Nodes (12): get_current_merchant(), AsyncSession, HTTPAuthorizationCredentials, _bearer(), HTTPAuthorizationCredentials, test_get_current_merchant_dev_bypass_returns_merchant_when_configured_and_no_token(), test_get_current_merchant_invalid_token_raises_401(), test_get_current_merchant_missing_token_raises_401() (+4 more)

### Community 20 - "channels/test_router.py"
Cohesion: 0.31
Nodes (10): get_arq_pool(), ArqRedis, _messenger_body(), _sign_meta(), test_meta_post_creates_message_and_enqueues_job(), test_meta_post_duplicate_delivery_enqueues_again_for_worker_idempotency(), test_meta_post_rejects_invalid_signature(), test_meta_post_unparseable_body_still_returns_200() (+2 more)

### Community 21 - "build_context_prompt"
Cohesion: 0.29
Nodes (6): build_context_prompt(), FakeExample, FakeMessage, test_build_context_prompt_includes_examples(), test_build_context_prompt_includes_history_and_current(), test_build_context_prompt_action_mode_runs()

### Community 22 - "create_access_token"
Cohesion: 0.36
Nodes (8): create_access_token(), decode_access_token(), Decode and validate a JWT. Returns the merchant_id (the "sub" claim) on…, Encode a JWT with claims {"sub": merchant_id, "exp": <now +…, test_create_and_decode_access_token_round_trip(), test_decode_access_token_returns_none_for_garbage_input(), test_decode_access_token_returns_none_when_expired(), test_decode_access_token_returns_none_when_tampered()

### Community 23 - "conversations/router.py"
Cohesion: 0.22
Nodes (15): Send a text message to a Facebook/Messenger user via the Send API. Returns True…, send_facebook_reply(), get_conversations(), get_messages(), AsyncSession, get, post, reply_to_conversation() (+7 more)

### Community 24 - "ConvState"
Cohesion: 0.28
Nodes (13): classify_message(), _intent_response_schema(), BaseModel, ConvState, main(), Manual evaluation runner — NOT part of `make test` / CI. Hits the real…, run_case(), test_raw_message() (+5 more)

### Community 25 - "match_tier0"
Cohesion: 0.36
Nodes (8): match_tier0(), test_bare_link_is_spam(), test_greeting_matches(), test_normal_message_has_no_match(), test_product_link_with_long_sentence_is_not_spam(), test_product_link_with_question_is_not_spam(), test_single_emoji_is_reaction(), test_spam_link_matches()

### Community 26 - "settings.json"
Cohesion: 0.20
Nodes (9): languageTags, modules, plugin.inlang.messageFormat, pathPattern, $schema, sourceLanguageTag, ar, en (+1 more)

### Community 27 - "FastAPI"
Cohesion: 0.25
Nodes (7): configure_logging(), close_arq_pool(), close_ai_clients(), lifespan(), get, root(), FastAPI

### Community 28 - "verify_facebook_access_token"
Cohesion: 0.50
Nodes (7): Verify a Facebook user access token against the Graph API. Returns the verified…, verify_facebook_access_token(), mock, test_verify_facebook_access_token_returns_identity_on_success(), test_verify_facebook_access_token_returns_none_on_http_error(), test_verify_facebook_access_token_returns_none_when_app_id_mismatch(), test_verify_facebook_access_token_returns_none_when_invalid()

### Community 29 - "TijaratkBot_SRD.md"
Cohesion: 0.04
Nodes (53): 10. Product Search, 11. Conversation, 12. Conversation State, 13. Message, 14. AI Orchestrator, 15. AI Gateway, 16. L0 Router, 17. L1 Nile-Chat Service (+45 more)

### Community 30 - "TijaratkBot_PRD.md"
Cohesion: 0.06
Nodes (31): 10. L0 — Deterministic Layer, 11. L1 — Nile-Chat 4B, 12. L2 — DeepSeek V4 Flash, 13. L3 — Human Escalation, 14. AI Action Architecture, 16. Catalog Retrieval, 17. Egyptian Arabic and Arabizi Normalization, 18. Conversation State (+23 more)

### Community 31 - "auth/router.py"
Cohesion: 0.17
Nodes (17): FacebookIdentity, FacebookPage, fetch_user_pages(), Fetch the Facebook Pages managed by this user. Each page comes with a page-…, facebook_callback(), AsyncSession, post, AuthTokenResponse (+9 more)

### Community 32 - "health_check"
Cohesion: 0.33
Nodes (5): health_check(), get, Check if the API is running., HealthResponse, BaseModel

### Community 38 - "opencode.json"
Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

### Community 88 - "products/service.py"
Cohesion: 0.19
Nodes (25): create(), delete(), get_products(), AsyncSession, delete, get, post, put (+17 more)

### Community 89 - "Backend review & remediation plan — classy-arabic (`backend/`)"
Cohesion: 0.07
Nodes (27): B1 — Every prompt contains the current message twice, B2 — The 2048-token ceiling is enforced nowhere, B3 — Empty orders auto-confirm, B4 — Any AI hiccup drops the inbound message, Backend review & remediation plan — classy-arabic (`backend/`), Context, Migration, Phase 0 — Baseline (+19 more)

### Community 90 - "TijaratkBot AI Engine — Correctness, Gateway, Observability & Evaluation Implementation Plan"
Cohesion: 0.08
Nodes (23): Execution options, Global Constraints, Non-Goals (explicit — do not build these here), Phase 1 — Correctness fixes (5 empirically-verified failures on `HEAD`), Phase 2 — Hugging Face endpoint compatibility check (standalone, non-blocking), Phase 3 — AI Gateway abstraction (SRD §15), Phase 4 — Persisted AI usage telemetry (SRD §32), Phase 5 — Evaluation harness (PRD §47, SRD §46–§48) (+15 more)

### Community 91 - "AI Action Validator + Tool Layer Implementation Plan"
Cohesion: 0.08
Nodes (23): AI Action Validator + Tool Layer Implementation Plan, Execution options, Global Constraints, Non-Goals (explicit — do not build these here), Phase 1 — Action Schema, Audit Model & Validator Core, Phase 2 — Functional Tools, Phase 3 — Pipeline Integration, Phase 4 — Stubbed Tools (contract + validation + tests, real seam, deferred business logic) (+15 more)

### Community 92 - "Public Demo Page Security Hardening Implementation Plan"
Cohesion: 0.10
Nodes (20): Global Constraints, Non-Goals, Out of scope, flagged for follow-up, Phase 1 — Cheap, independent fixes, Phase 2 — Shared infrastructure, Phase 3 — Demo isolation, Public Demo Page Security Hardening Implementation Plan, Self-Review (+12 more)

### Community 93 - "Global Constraints"
Cohesion: 0.11
Nodes (17): Global Constraints, Message Classification & AI Engine Implementation Plan, Task 10: Pipeline orchestrator, Task 11: Messages domain (HTTP entry point), Task 12: Clustering job, Task 13: Clustering CLI entrypoint, Task 14: Full-suite verification, Task 1: Dependencies (+9 more)

### Community 94 - "Channel Ingestion (Facebook, Instagram, WhatsApp Webhooks) Implementation Plan"
Cohesion: 0.12
Nodes (16): Channel Ingestion (Facebook, Instagram, WhatsApp Webhooks) Implementation Plan, Execution options, Global Constraints, Non-Goals (explicit — do not build these here), Task 10: arq worker, Task 11: Docs and final verification, Task 1: Dependencies and configuration, Task 2: Models — Channel enum, ChannelConnection, WebhookEvent, and column additions (+8 more)

### Community 95 - "Classification Pipeline: Debugging Session Log — 2026-08-22"
Cohesion: 0.13
Nodes (14): 10. Model ignored "pick from this list" even with the system prompt correctly arriving, 1. App wouldn't boot — `EMBEDDING_BASE_URL`/`EMBEDDING_API_KEY` required but absent from `.env`, 2. Unclosed `httpx.AsyncClient` per AI call, 3. `respx` couldn't mock any AI call — silently hit the real network, 4. Test mock URLs were hardcoded, not settings-driven, 5. CLI test script (`scripts/test_engine.py`) sent a different prompt than the real pipeline, 6. No `temperature`/`seed` pinned on any AI call, 7. `pytest` was trying to collect `scripts/test_engine.py` as a real test (+6 more)

### Community 96 - "Cart & Checkout Services + Order Service Hardening Implementation Plan"
Cohesion: 0.13
Nodes (14): Cart & Checkout Services + Order Service Hardening Implementation Plan, Follow-ups (explicitly not built in this plan), Global Constraints, Non-Goals (explicit — do not build these here), Phase 1 — Schema Foundation & Infrastructure, Phase 2 — Cart Service, Phase 3 — Order Hardening, Task 1: Fix the `dispatch_action` commit gap (+6 more)

### Community 97 - "Global Constraints"
Cohesion: 0.14
Nodes (13): DeepSeek-Only Engine Implementation Plan, Explicitly out of scope, Global Constraints, Self-review (spec coverage / placeholders / type consistency), Task 1: `app/engine/prompts.py` — shared system-prompt composer, Task 2: Simplify `context_budget.py` and `routing_policy.py`, Task 3: Collapse `ModelTier` to `RULE` / `DEEPSEEK`, Task 4: Collapse the model layer — `clients.py`, `gateway.py`, `classification.py`, `extraction.py`, `clustering/job.py` (+5 more)

### Community 98 - "merchant.py"
Cohesion: 0.26
Nodes (8): MerchantStatus, _mock_facebook_success(), mock, test_facebook_callback_creates_merchant_and_returns_token(), test_facebook_callback_rejects_invalid_facebook_token(), test_facebook_callback_rejects_suspended_merchant(), test_merchant_facebook_user_id_allows_multiple_nulls(), test_merchant_facebook_user_id_unique_constraint()

### Community 99 - "Demo Merchant Seed Implementation Plan"
Cohesion: 0.15
Nodes (12): Demo Merchant Seed Implementation Plan, Global Constraints, Out of scope, flagged for follow-up, Self-Review, Task 1: `StoreKnowledge` model and migration, Task 2: Real `store_knowledge.service.search()` — keyword-match MVP, Task 3: Thread the answer back through the pipeline, Task 4: Expose `Product.price` over the API (+4 more)

### Community 100 - "TijaratkBot Marketing Site — SEO & Frontend Performance Plan"
Cohesion: 0.17
Nodes (11): 1. What's already good, 2. Findings by priority, 3. Suggested execution order, 4. Verification (how to confirm each batch actually worked), Context, Critical files, P0 — Critical (wrong signals actively working against indexing/trust), P1 — High (large gaps, contained fixes) (+3 more)

### Community 101 - "Commerce Layer Completion — Doc Reconciliation + Safe-to-Land Gaps"
Cohesion: 0.18
Nodes (10): Commerce Layer Completion — Doc Reconciliation + Safe-to-Land Gaps, Deferred (mechanical, but blocked on other in-flight work), Execution log, Global Constraints, Recommended follow-up plans (need their own design pass — not tasked here), Self-review, Task 1: Documentation reconciliation, Task 2: Make `create_order`'s `confirm` parameter do something (+2 more)

### Community 102 - "TijaratkBot: Message Classification & AI Engine — Technical Spec (Core)"
Cohesion: 0.18
Nodes (11): 1.1 Retired Model (formerly Tier 1): MBZUAI-Paris/Nile-Chat-4B, 1.2 Sole LLM Tier: DeepSeek v4 Flash (via OpenRouter API), 1.3 Embedding Model: BAAI/bge-m3 (Self-Hosted Multilingual), 1. Model References, 2. Data Model, 3. Pipeline, 4. Review-Flagging Policy, 5. Embeddings (+3 more)

### Community 103 - "TijaratkBot"
Cohesion: 0.18
Nodes (11): Architecture, Backend, Documentation, Frontend, Getting started, Prerequisites, Project structure, Status (+3 more)

### Community 104 - "2. 16-Task Roadmap & Progress Status"
Cohesion: 0.18
Nodes (10): 1. Project & Architecture Context, 2. 16-Task Roadmap & Progress Status, 3. Important Architectural Rulings & Invariant Rules, 4. Immediate Execution Guide: Task 8 (Delivery Service), ✅ Phase 0 — Product Variants & Order Writer Consolidation (COMPLETED), ✅ Phase 1 — Multi-Tenancy & Auth Spine (COMPLETED), ⏳ Phase 2 — Delivery Service (CURRENT & NEXT TASK), Session Handover & Context Summary: Tijaratk Bot Multi-Phase Plan (+2 more)

### Community 105 - "README.md"
Cohesion: 0.20
Nodes (6): Explicitly out of scope for now (PRD §5), Near-term — MVP gap-closers, Now — built today, Phase 2 (per PRD §37), Phase 3 (per PRD §37), Roadmap

### Community 106 - "CLAUDE.md"
Cohesion: 0.20
Nodes (9): App layout, Architecture, Commands, ⛔ CRITICAL SECURITY RULE: Environment Variables & Secrets, Database/enum gotcha (Alembic), Known in-progress / not-yet-implemented, Testing, Two-stage AI routing (+1 more)

### Community 107 - "handoff/test_router.py"
Cohesion: 0.46
Nodes (7): override_deps(), AsyncSession, Conversation, fixture, sample_conversation(), test_return_to_ai(), test_takeover_conversation()

### Community 109 - "33. Onboarding"
Cohesion: 0.29
Nodes (7): 33. Onboarding, Step 1, Step 2, Step 3, Step 4, Step 5, Step 6

### Community 110 - "extract_order"
Cohesion: 0.67
Nodes (5): extract_order(), _chat_response(), test_extract_order_flags_ambiguous_fields(), test_extract_order_returns_result_when_clean(), test_extract_order_skips_ai_call_on_repeated_correction()

### Community 111 - "44. Failure Handling"
Cohesion: 0.33
Nodes (6): 44. Failure Handling, AI produces invalid JSON, Both unavailable, Commerce action fails, DeepSeek unavailable, Nile-Chat unavailable

### Community 112 - "AGENTS.md"
Cohesion: 0.40
Nodes (3): ⛔ CRITICAL SECURITY RULE: Environment Variables & Secrets, General Guidelines, graphify

### Community 113 - "15. AI Tool/Action Set"
Cohesion: 0.40
Nodes (5): 15. AI Tool/Action Set, Cart, Catalog, Checkout, Knowledge

### Community 114 - "32. Merchant Dashboard Requirements"
Cohesion: 0.40
Nodes (5): 32. Merchant Dashboard Requirements, AI, Conversations, Orders, Products

### Community 115 - "3. Technology Baseline"
Cohesion: 0.40
Nodes (5): 3. Technology Baseline, AI, Backend, Frontend, Infrastructure

### Community 116 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 117 - "MVP Scope"
Cohesion: 0.50
Nodes (4): 4. Product Scope, Customer, Merchant, MVP Scope

### Community 118 - "45. Latency Targets"
Cohesion: 0.50
Nodes (4): 45. Latency Targets, L0, L1, L2

### Community 119 - "46. Testing Strategy"
Cohesion: 0.50
Nodes (4): 46. Testing Strategy, AI tests, Integration tests, Unit tests

### Community 120 - "52. Recommended Initial Plan Configuration"
Cohesion: 0.50
Nodes (4): 52. Recommended Initial Plan Configuration, Growth, Pro, Starter

### Community 123 - "2. Product Positioning"
Cohesion: 0.67
Nodes (3): 2. Product Positioning, AI promise, Core promise

### Community 124 - "37. Future Roadmap"
Cohesion: 0.67
Nodes (3): 37. Future Roadmap, Phase 2, Phase 3

### Community 125 - "6. Core Product Modes"
Cohesion: 0.67
Nodes (3): 6.1 Catalog Mode, 6.2 AI Commerce Mode, 6. Core Product Modes

## Knowledge Gaps
- **404 isolated node(s):** `$schema`, `.opencode/plugins/graphify.js`, `WorkerSettings`, `tijaratk-bot`, `initialState` (+399 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Merchant` connect `Merchant` to `ChannelConnection`, `app/models/__init__.py`, `Product`, `merchant.py`, `delivery/router.py`, `test_product_matching.py`, `resolve_action`, `LabeledExample`, `handoff/test_router.py`, `ingest_message`, `get_db`, `get_current_merchant`, `conversations/router.py`, `products/service.py`, `auth/router.py`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `Product` connect `Product` to `ActionArgumentError`, `app/models/__init__.py`, `merchant.py`, `test_product_matching.py`, `resolve_action`, `process_message`, `Merchant`, `get_db`, `products/service.py`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `process_message()` connect `process_message` to `app/models/__init__.py`, `test_product_matching.py`, `resolve_action`, `LabeledExample`, `Merchant`, `gateway.py`, `ingest_message`, `extract_order`, `build_context_prompt`, `ConvState`, `match_tier0`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `Product` (e.g. with `add_item()` and `_get_active_cart_items()`) actually correct?**
  _`Product` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Merchant` (e.g. with `get_checkout_state()` and `return_to_ai()`) actually correct?**
  _`Merchant` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `ProductVariant` (e.g. with `add_item()` and `create_manual_order()`) actually correct?**
  _`ProductVariant` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `get_db()` (e.g. with `test_facebook_callback_creates_merchant_and_returns_token()` and `test_facebook_callback_rejects_invalid_facebook_token()`) actually correct?**
  _`get_db()` has 23 INFERRED edges - model-reasoned connections that need verification._