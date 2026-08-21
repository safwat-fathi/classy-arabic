# Graph Report - classy-arabic  (2026-08-21)

## Corpus Check
- Corpus is ~2,417 words - fits in a single context window. You may not need a graph.

## Summary
- 46 nodes · 62 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 1,200 input · 800 output

## Community Hubs (Navigation)
- Database Migrations (Alembic)
- AI Data Model & Embeddings
- Core Config & Database Session
- Health Check API Domain
- FastAPI Application Setup & Routing
- AI Pipeline & Routing Policy
- Project Metadata

## God Nodes (most connected - your core abstractions)
1. `Prisma Data Model` - 6 edges
2. `BAAI/bge-m3 Embedding Model` - 5 edges
3. `run_async_migrations()` - 4 edges
4. `health_check()` - 4 edges
5. `HealthResponse` - 4 edges
6. `DeepSeek v4 Flash (Tier 2 Escalated Model)` - 4 edges
7. `Conversation Entity` - 4 edges
8. `do_run_migrations()` - 3 edges
9. `run_migrations_online()` - 3 edges
10. `Settings` - 3 edges

## Surprising Connections (you probably didn't know these)
- `health_check()` --uses--> `HealthResponse`  [INFERRED]
  app/domains/health/router.py → app/domains/health/schemas.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Multi-Tier AI Model Architecture** — message_classification_ai_engine_spec_nilechat_4b, message_classification_ai_engine_spec_deepseek_v4_flash, message_classification_ai_engine_spec_escalation_policy [EXTRACTED 1.00]
- **Core Message & Conversation Data Model** — message_classification_ai_engine_spec_model_merchant, message_classification_ai_engine_spec_model_conversation, message_classification_ai_engine_spec_model_message, message_classification_ai_engine_spec_model_order [EXTRACTED 1.00]

## Communities (8 total, 1 thin omitted)

### Community 0 - "Database Migrations (Alembic)"
Cohesion: 0.28
Nodes (8): do_run_migrations(), Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, Run migrations in 'online' mode., run_async_migrations(), run_migrations_offline(), run_migrations_online(), Connection

### Community 1 - "AI Data Model & Embeddings"
Cohesion: 0.42
Nodes (9): BAAI/bge-m3 Embedding Model, Prisma Data Model, Conversation Entity, LabeledExample Entity, Merchant Entity, Message Entity, Order Entity, Product Entity (+1 more)

### Community 2 - "Core Config & Database Session"
Cohesion: 0.29
Nodes (4): Settings, get_db(), Dependency function that yields a database session., BaseSettings

### Community 3 - "Health Check API Domain"
Cohesion: 0.38
Nodes (5): health_check(), get, Check if the API is running., HealthResponse, BaseModel

### Community 4 - "FastAPI Application Setup & Routing"
Cohesion: 0.47
Nodes (4): lifespan(), get, root(), FastAPI

### Community 5 - "AI Pipeline & Routing Policy"
Cohesion: 0.70
Nodes (5): DeepSeek v4 Flash (Tier 2 Escalated Model), Model Routing & Escalation Policy, NileChat-4B (Tier 1 Primary Model), Message Processing Pipeline, Serving Infrastructure & Observability

## Knowledge Gaps
- **1 isolated node(s):** `classy-arabic`
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BAAI/bge-m3 Embedding Model` connect `AI Data Model & Embeddings` to `AI Pipeline & Routing Policy`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `classy-arabic` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._