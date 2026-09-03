# Graph Report - tijaratk-bot  (2026-09-02)

## Corpus Check
- 304 files · ~268,236 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1105 nodes · 2783 edges · 88 communities (78 shown, 10 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 229 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Engine Module
- Channels Module
- Models Module
- Checkout Module
- Engine Module
- Delivery Module
- Layout.tsx Module
- Engine Module
- Alembic Module
- Package.json Module
- Messages.ts Module
- Engine Module
- Tsconfig.json Module
- Store_knowledge Module
- Engine Module
- Messages Module
- Engine Module
- Domains Module
- Engine Module
- Auth Module
- Channels Module
- Engine Module
- Auth Module
- Conversations Module
- Engine Module
- Engine Module
- Settings.json Module
- App Module
- Auth Module
- Domains Module
- Auth Module
- Auth Module
- Health Module
- Page.tsx Module
- Versions Module
- Versions Module
- Versions Module
- Core Module
- Opencode.json Module
- Graphify.js Module
- Testimonials.tsx Module
- Eslint.config.mjs Module
- Next.config.ts Module
- Postcss.config.mjs Module
- Pyproject.toml Module

## God Nodes (most connected - your core abstractions)
1. `Product` - 103 edges
2. `Merchant` - 59 edges
3. `ProductVariant` - 59 edges
4. `process_message()` - 45 edges
5. `get_db()` - 41 edges
6. `ConvState` - 38 edges
7. `add_item()` - 37 edges
8. `new_id()` - 35 edges
9. `get_current_merchant()` - 33 edges
10. `Conversation` - 32 edges

## Surprising Connections (you probably didn't know these)
- `test_ingest_message_requires_authentication()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/test_messages_router.py → backend/app/core/database.py
- `test_meta_post_creates_message_and_enqueues_job()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/channels/test_router.py → backend/app/core/database.py
- `test_meta_post_duplicate_delivery_enqueues_again_for_worker_idempotency()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/channels/test_router.py → backend/app/core/database.py
- `test_meta_post_rejects_invalid_signature()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/channels/test_router.py → backend/app/core/database.py
- `test_meta_post_unparseable_body_still_returns_200()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/channels/test_router.py → backend/app/core/database.py

## Import Cycles
- None detected.

## Communities (88 total, 10 thin omitted)

### Community 0 - "Engine Module"
Cohesion: 0.05
Nodes (67): get_products(), AsyncSession, get, ProductRead, ProductVariantRead, BaseModel, get_product(), list_products() (+59 more)

### Community 1 - "Channels Module"
Cohesion: 0.05
Nodes (66): AbstractAsyncContextManager, parse_meta_payload(), verify_meta_signature(), ArqRedis, AsyncSession, get, post, receive_meta_webhook() (+58 more)

### Community 2 - "Models Module"
Cohesion: 0.07
Nodes (61): cluster_messages(), fetch_embedded_messages(), label_cluster(), AsyncSession, representative_messages(), run_clustering(), AsyncSession, Decimal (+53 more)

### Community 3 - "Checkout Module"
Cohesion: 0.08
Nodes (66): add_item(), CartItemNotFoundError, _get_item_for_conversation(), _get_or_create_active_cart(), AsyncSession, Exception, line_item_id does not reference an existing cart item for this conversation's…, remove_item() (+58 more)

### Community 4 - "Engine Module"
Cohesion: 0.08
Nodes (60): check_product_belongs_to_merchant(), check_product_exists(), _check_product_ownership(), check_variant_belongs_to_product(), check_variant_exists(), check_variant_is_active(), _check_variant_ownership(), evaluate_action() (+52 more)

### Community 5 - "Delivery Module"
Cohesion: 0.10
Nodes (42): delete_delivery_area_endpoint(), get_delivery_areas(), patch_delivery_area(), post_delivery_area(), AsyncSession, get, post, Response (+34 more)

### Community 6 - "Layout.tsx Module"
Cohesion: 0.06
Nodes (23): cairo, tajawal, BrandMark(), Page(), PricingSection(), Analytics(), FAQSection(), getFaqs() (+15 more)

### Community 7 - "Engine Module"
Cohesion: 0.09
Nodes (29): ActionResolution, AsyncSession, Conversation, _render_response(), resolve_action(), ProposedActionEnvelope, Exception, Raised by a tool handler whose backing service does not exist yet. (+21 more)

### Community 8 - "Alembic Module"
Cohesion: 0.08
Nodes (28): asyncio, do_run_migrations(), Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, Run migrations in 'online' mode., run_async_migrations(), run_migrations_offline(), run_migrations_online() (+20 more)

### Community 9 - "Package.json Module"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, dependencies, @inlang/paraglide-js, @inlang/paraglide-next, next, react, react-dom (+29 more)

### Community 10 - "Messages.ts Module"
Cohesion: 0.11
Nodes (22): IngestState, sendMessage(), AIInsights(), findProduct(), initialState, MessageComposer(), Home(), formatVariants() (+14 more)

### Community 11 - "Engine Module"
Cohesion: 0.22
Nodes (30): _correction_count(), _known_intents(), _merchant_info(), PipelineResult, process_message(), AsyncSession, _chat_response(), _embedding_response() (+22 more)

### Community 12 - "Tsconfig.json Module"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 13 - "Store_knowledge Module"
Cohesion: 0.12
Nodes (22): get_store_knowledge(), AsyncSession, get, BaseModel, StoreKnowledgeRead, AsyncSession, Keyword-match MVP for SRD §23 ("keyword/full-text retrieval"). A row matches…, search() (+14 more)

### Community 14 - "Engine Module"
Cohesion: 0.19
Nodes (19): AsyncOpenAI, AICallError, get_deepseek_client(), get_embedding_client(), parse_json_content(), Exception, Model call failed or returned unusable content., §7's observability requirement: log token counts + latency for every AI call,… (+11 more)

### Community 15 - "Messages Module"
Cohesion: 0.17
Nodes (17): ingest(), AsyncSession, MessageIngestRequest, MessageIngestResponse, post, Response, MessageIngestRequest, MessageIngestResponse (+9 more)

### Community 16 - "Engine Module"
Cohesion: 0.23
Nodes (14): extract_order(), build_system_prompt(), ConvState, test_raw_message(), _chat_response(), test_extract_order_flags_ambiguous_fields(), test_extract_order_returns_result_when_clean(), test_extract_order_skips_ai_call_on_repeated_correction() (+6 more)

### Community 17 - "Domains Module"
Cohesion: 0.19
Nodes (14): get_db(), Dependency function that yields a database session., _mock_facebook_success(), mock, test_facebook_callback_creates_merchant_and_returns_token(), test_facebook_callback_rejects_invalid_facebook_token(), test_facebook_callback_rejects_suspended_merchant(), test_delivery_area_crud_happy_path() (+6 more)

### Community 18 - "Engine Module"
Cohesion: 0.20
Nodes (16): check_ambiguous_fields(), check_confidence_threshold(), check_reasoning_heavy(), check_repeated_correction(), evaluate_postflight(), evaluate_preflight(), Triggers knowable before any model call., Triggers only knowable from the model's output. (+8 more)

### Community 19 - "Auth Module"
Cohesion: 0.25
Nodes (13): get_current_merchant(), AsyncSession, HTTPAuthorizationCredentials, MerchantStatus, _bearer(), HTTPAuthorizationCredentials, test_get_current_merchant_dev_bypass_returns_merchant_when_configured_and_no_token(), test_get_current_merchant_invalid_token_raises_401() (+5 more)

### Community 20 - "Channels Module"
Cohesion: 0.31
Nodes (10): get_arq_pool(), ArqRedis, _messenger_body(), _sign_meta(), test_meta_post_creates_message_and_enqueues_job(), test_meta_post_duplicate_delivery_enqueues_again_for_worker_idempotency(), test_meta_post_rejects_invalid_signature(), test_meta_post_unparseable_body_still_returns_200() (+2 more)

### Community 21 - "Engine Module"
Cohesion: 0.23
Nodes (8): build_context_prompt(), main(), Manual evaluation runner — NOT part of `make test` / CI. Hits the real…, run_case(), FakeExample, FakeMessage, test_build_context_prompt_includes_examples(), test_build_context_prompt_includes_history_and_current()

### Community 22 - "Auth Module"
Cohesion: 0.36
Nodes (8): create_access_token(), decode_access_token(), Decode and validate a JWT. Returns the merchant_id (the "sub" claim) on…, Encode a JWT with claims {"sub": merchant_id, "exp": <now +…, test_create_and_decode_access_token_round_trip(), test_decode_access_token_returns_none_for_garbage_input(), test_decode_access_token_returns_none_when_expired(), test_decode_access_token_returns_none_when_tampered()

### Community 23 - "Conversations Module"
Cohesion: 0.29
Nodes (7): get_conversations(), AsyncSession, get, ConversationRead, BaseModel, list_conversations(), AsyncSession

### Community 24 - "Engine Module"
Cohesion: 0.38
Nodes (8): classify_message(), _intent_response_schema(), BaseModel, _chat_response(), test_classify_message_flags_low_confidence(), test_classify_message_rejects_off_vocabulary_intent(), test_classify_message_returns_result_when_confident(), test_classify_message_skips_ai_call_on_repeated_correction()

### Community 25 - "Engine Module"
Cohesion: 0.36
Nodes (8): match_tier0(), test_bare_link_is_spam(), test_greeting_matches(), test_normal_message_has_no_match(), test_product_link_with_long_sentence_is_not_spam(), test_product_link_with_question_is_not_spam(), test_single_emoji_is_reaction(), test_spam_link_matches()

### Community 26 - "Settings.json Module"
Cohesion: 0.20
Nodes (9): languageTags, modules, plugin.inlang.messageFormat, pathPattern, $schema, sourceLanguageTag, ar, en (+1 more)

### Community 27 - "App Module"
Cohesion: 0.33
Nodes (7): configure_logging(), close_arq_pool(), close_ai_clients(), lifespan(), get, root(), FastAPI

### Community 28 - "Auth Module"
Cohesion: 0.42
Nodes (7): Verify a Facebook user access token against the Graph API. Returns the verified…, verify_facebook_access_token(), mock, test_verify_facebook_access_token_returns_identity_on_success(), test_verify_facebook_access_token_returns_none_on_http_error(), test_verify_facebook_access_token_returns_none_when_app_id_mismatch(), test_verify_facebook_access_token_returns_none_when_invalid()

### Community 29 - "Domains Module"
Cohesion: 0.33
Nodes (8): _chat_response(), _embedding_response(), test_ingest_message_rejects_conversation_owned_by_different_merchant(), test_ingest_message_requires_authentication(), test_ingest_purchase_intent_returns_full_order_detail(), test_ingest_question_returns_answer_text(), test_ingest_returns_404_for_unknown_conversation(), test_ingest_tier0_short_circuit_end_to_end()

### Community 30 - "Auth Module"
Cohesion: 0.46
Nodes (6): FacebookIdentity, find_or_create_merchant_by_facebook_id(), AsyncSession, Look up a Merchant by facebook_user_id. If found, return it (login). If not…, test_find_or_create_creates_new_merchant_on_first_login(), test_find_or_create_returns_existing_merchant_on_repeat_login()

### Community 31 - "Auth Module"
Cohesion: 0.39
Nodes (6): facebook_callback(), AsyncSession, post, AuthTokenResponse, FacebookCallbackRequest, BaseModel

### Community 32 - "Health Module"
Cohesion: 0.33
Nodes (5): health_check(), get, Check if the API is running., HealthResponse, BaseModel

### Community 33 - "Page.tsx Module"
Cohesion: 0.33
Nodes (4): TODO: Send response.authResponse.accessToken to backend to persist, TODO: Send response.authResponse.accessToken to backend, FacebookSDK(), Window

### Community 38 - "Opencode.json Module"
Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

## Knowledge Gaps
- **70 isolated node(s):** `$schema`, `.opencode/plugins/graphify.js`, `WorkerSettings`, `tijaratk-bot`, `initialState` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Merchant` connect `Delivery Module` to `Engine Module`, `Channels Module`, `Models Module`, `Checkout Module`, `Engine Module`, `Engine Module`, `Alembic Module`, `Engine Module`, `Store_knowledge Module`, `Messages Module`, `Domains Module`, `Auth Module`, `Conversations Module`, `Domains Module`, `Auth Module`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `Product` connect `Checkout Module` to `Engine Module`, `Models Module`, `Engine Module`, `Delivery Module`, `Engine Module`, `Alembic Module`, `Engine Module`, `Domains Module`, `Auth Module`, `Domains Module`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `ConvState` connect `Engine Module` to `Channels Module`, `Models Module`, `Engine Module`, `Engine Module`, `Domains Module`, `Engine Module`, `Engine Module`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `Product` (e.g. with `add_item()` and `_get_active_cart_items()`) actually correct?**
  _`Product` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Merchant` (e.g. with `get_checkout_state()` and `return_to_ai()`) actually correct?**
  _`Merchant` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `ProductVariant` (e.g. with `add_item()` and `_get_active_cart_items()`) actually correct?**
  _`ProductVariant` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `get_db()` (e.g. with `test_facebook_callback_creates_merchant_and_returns_token()` and `test_facebook_callback_rejects_invalid_facebook_token()`) actually correct?**
  _`get_db()` has 23 INFERRED edges - model-reasoned connections that need verification._