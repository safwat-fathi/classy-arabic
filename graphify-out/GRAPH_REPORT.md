# Graph Report - classy-arabic  (2026-08-23)

## Corpus Check
- 108 files · ~74,459 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 386 nodes · 717 edges · 35 communities (28 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- AI Engine Clients & Extraction
- Database Models & Seeding
- Frontend Dependencies & Config
- Frontend TypeScript Config
- Frontend App Components & Libs
- Backend API Routing & Products
- Message Clustering & Embeddings
- Product Matching & Database Core
- Context Budget & Tier 0 Rules
- Message Ingestion Domain
- AI Engine Routing Policy
- AI Engine Pipeline Processing
- Conversations Domain
- Alembic Migrations Environment
- Frontend Layout Styles
- Migration: Classification Schema
- Migration: Missing FK & Indexes
- Backend Core Config
- Frontend ESLint Config
- Frontend Next.js Config
- Frontend PostCSS Config
- Project Package Definition

## God Nodes (most connected - your core abstractions)
1. `process_message()` - 25 edges
2. `Message` - 19 edges
3. `evaluate_preflight()` - 16 edges
4. `compilerOptions` - 16 edges
5. `get_db()` - 15 edges
6. `classify_message()` - 14 edges
7. `AICallError` - 14 edges
8. `embed_text()` - 14 edges
9. `extract_order()` - 14 edges
10. `LabeledExample` - 14 edges

## Surprising Connections (you probably didn't know these)
- `test()` --calls--> `get_nilechat_client()`  [INFERRED]
  test_nilechat.py → backend/app/engine/clients.py
- `test()` --calls--> `json_schema_response_format()`  [INFERRED]
  test_nilechat.py → backend/app/engine/schemas.py
- `test_list_conversations_filters_by_merchant_id()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/test_conversations_router.py → backend/app/core/database.py
- `test_list_conversations_without_filter_returns_all()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/test_conversations_router.py → backend/app/core/database.py
- `test_ingest_returns_404_for_unknown_conversation()` --indirect_call--> `get_db()`  [INFERRED]
  backend/tests/domains/test_messages_router.py → backend/app/core/database.py

## Import Cycles
- None detected.

## Communities (35 total, 7 thin omitted)

### Community 0 - "AI Engine Clients & Extraction"
Cohesion: 0.10
Nodes (30): AsyncOpenAI, _call(), classify_message(), _intent_response_schema(), BaseModel, AICallError, get_deepseek_client(), get_embedding_client() (+22 more)

### Community 1 - "Database Models & Seeding"
Cohesion: 0.17
Nodes (20): Conversation, Base, ConvState, Direction, ModelTier, OrderStatus, new_id(), Merchant (+12 more)

### Community 2 - "Frontend Dependencies & Config"
Cohesion: 0.06
Nodes (33): eslint, eslint-config-next, dependencies, next, react, react-dom, devDependencies, eslint (+25 more)

### Community 3 - "Frontend TypeScript Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 4 - "Frontend App Components & Libs"
Cohesion: 0.13
Nodes (19): IngestState, sendMessage(), findProduct(), initialState, MessageComposer(), Home(), formatVariants(), getDummyPrice() (+11 more)

### Community 5 - "Backend API Routing & Products"
Cohesion: 0.10
Nodes (18): configure_logging(), health_check(), get, Check if the API is running., HealthResponse, BaseModel, get_products(), AsyncSession (+10 more)

### Community 6 - "Message Clustering & Embeddings"
Cohesion: 0.15
Nodes (19): cluster_messages(), fetch_embedded_messages(), label_cluster(), AsyncSession, representative_messages(), run_clustering(), embed_text(), find_similar_examples() (+11 more)

### Community 7 - "Product Matching & Database Core"
Cohesion: 0.16
Nodes (19): get_db(), Dependency function that yields a database session., match_line_items_to_products(), AsyncSession, ExtractedLineItem, Product, Base, test_list_conversations_without_filter_returns_all() (+11 more)

### Community 8 - "Context Budget & Tier 0 Rules"
Cohesion: 0.14
Nodes (17): build_context_prompt(), estimate_tokens(), match_tier0(), test_raw_message(), FakeExample, FakeMessage, test_build_context_prompt_flags_overflow_on_tiny_budget(), test_build_context_prompt_includes_examples() (+9 more)

### Community 9 - "Message Ingestion Domain"
Cohesion: 0.18
Nodes (17): ingest(), AsyncSession, MessageIngestRequest, MessageIngestResponse, MessageIngestRequest, MessageIngestResponse, OrderDetail, OrderLineItem (+9 more)

### Community 10 - "AI Engine Routing Policy"
Cohesion: 0.19
Nodes (16): check_confidence_threshold(), check_context_overflow(), check_reasoning_heavy(), check_repeated_correction(), evaluate_postflight(), evaluate_preflight(), Triggers knowable before any model call — route straight to tier 2., Triggers only knowable from tier-1 output — re-run on tier 2. (+8 more)

### Community 11 - "AI Engine Pipeline Processing"
Cohesion: 0.27
Nodes (16): _correction_count(), _known_intents(), PipelineResult, process_message(), AsyncSession, _chat_response(), _embedding_response(), test_classification_failure_persists_message_instead_of_losing_it() (+8 more)

### Community 12 - "Conversations Domain"
Cohesion: 0.29
Nodes (7): get_conversations(), AsyncSession, get, ConversationRead, BaseModel, list_conversations(), AsyncSession

### Community 13 - "Alembic Migrations Environment"
Cohesion: 0.28
Nodes (8): do_run_migrations(), Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, Run migrations in 'online' mode., run_async_migrations(), run_migrations_offline(), run_migrations_online(), Connection

### Community 14 - "Frontend Layout Styles"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **55 isolated node(s):** `classy-arabic`, `geistSans`, `geistMono`, `metadata`, `initialState` (+50 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `process_message()` connect `AI Engine Pipeline Processing` to `AI Engine Clients & Extraction`, `Database Models & Seeding`, `Message Clustering & Embeddings`, `Product Matching & Database Core`, `Context Budget & Tier 0 Rules`, `Message Ingestion Domain`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `extract_order()` connect `AI Engine Clients & Extraction` to `Context Budget & Tier 0 Rules`, `Database Models & Seeding`, `AI Engine Routing Policy`, `AI Engine Pipeline Processing`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `classify_message()` connect `AI Engine Clients & Extraction` to `Context Budget & Tier 0 Rules`, `Database Models & Seeding`, `AI Engine Routing Policy`, `AI Engine Pipeline Processing`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Message` (e.g. with `Conversation` and `Direction`) actually correct?**
  _`Message` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `get_db()` (e.g. with `test_list_conversations_filters_by_merchant_id()` and `test_list_conversations_without_filter_returns_all()`) actually correct?**
  _`get_db()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `classy-arabic`, `geistSans`, `geistMono` to the rest of the system?**
  _55 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Engine Clients & Extraction` be split into smaller, more focused modules?**
  _Cohesion score 0.09966777408637874 - nodes in this community are weakly interconnected._