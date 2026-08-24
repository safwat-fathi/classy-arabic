# TijaratkBot — Software Requirements Document (SRD)

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Technical Definition

---

# 1. System Overview

TijaratkBot is a multi-tenant social-commerce platform that connects merchant product catalogs to customer conversations on supported social messaging channels.

The system supports two modes:

- **Catalog Mode:** deterministic product/catalog shopping through DMs.
- **AI Commerce Mode:** Catalog Mode plus tiered AI capabilities.

The system is designed around a strict separation between:

1. Customer communication.
2. AI interpretation.
3. Catalog retrieval.
4. Commerce operations.
5. Merchant operations.

AI is never authoritative over commerce data.

---

# 2. High-Level Architecture

```text
                         Social Channels
                    FB / IG / WhatsApp
                              |
                              v
                       Channel Adapters
                              |
                              v
                        Webhook Layer
                              |
                              v
                    Conversation Service
                              |
                              v
                         AI Router
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
       L0 Rules          L1 Nile-Chat 4B    L2 DeepSeek V4
          |                   |                   |
          |                   +---------+---------+
          |                             |
          +-----------------------------+
                        |
                        v
                 Action Validator
                        |
                        v
                 Commerce Services
              +---------+---------+
              |         |         |
              v         v         v
           Catalog     Cart      Orders
              |
              v
           PostgreSQL

                    AI/Conversation State
                         |
                       Redis

                    Model Serving
                         |
                    vLLM / L4
                         |
                   Nile-Chat 4B
```

---

# 3. Technology Baseline

Recommended stack:

## Backend

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Redis

## Frontend

- Next.js
- React
- Tailwind CSS

## AI

- vLLM
- Nile-Chat 4B
- DeepSeek V4 Flash API

## Infrastructure

- Docker
- Nginx
- Cloudflare
- GitHub Actions
- Object storage for product media

These are implementation recommendations and may be changed without changing the product requirements.

---

# 4. Multi-Tenancy

Every merchant is a tenant.

All tenant-owned records must be associated with:

```text
tenant_id
```

Tenant isolation must be enforced at the application/service layer and may additionally use PostgreSQL Row Level Security.

AI requests must always execute in a tenant context.

An AI request must never retrieve:

- another merchant's products
- another merchant's knowledge
- another merchant's customers
- another merchant's conversations
- another merchant's orders

---

# 5. Core Domain Entities

Minimum entities:

```text
Tenant
ChannelConnection
Customer
Conversation
Message
Category
Product
ProductVariant
ProductImage
StoreKnowledge
DeliveryArea
Cart
CartItem
Order
OrderItem
Subscription
SubscriptionAddon
AIRequest
AIAction
AIUsageEvent
HumanHandoff
```

---

# 6. Tenant

Suggested fields:

```text
id
name
slug
phone
status
timezone
currency
created_at
updated_at
```

Default initial currency:

```text
EGP
```

---

# 7. ChannelConnection

Represents a connected Facebook, Instagram or WhatsApp channel.

Suggested fields:

```text
id
tenant_id
channel
external_account_id
external_page_id
access_token_reference
status
metadata
created_at
updated_at
```

Access tokens must not be stored in plaintext application logs.

---

# 8. Product

Suggested fields:

```text
id
tenant_id
category_id
name
slug
description
price
compare_at_price
status
order_mode
metadata
created_at
updated_at
```

Product status:

```text
active
draft
archived
```

---

# 9. ProductVariant

Suggested fields:

```text
id
product_id
label
sku
price
stock
status
attributes
created_at
updated_at
```

Example attributes:

```json
{
  "color": "black",
  "size": "XL"
}
```

---

# 10. Product Search

Initial search should use PostgreSQL.

Required capabilities:

- Exact search
- Case-insensitive search
- Arabic normalization
- Arabizi normalization
- `pg_trgm`
- Full-text search
- Category filtering
- Price filtering
- Variant filtering
- Availability filtering

Potential index:

```sql
CREATE INDEX product_name_trgm_idx
ON products
USING GIN (LOWER(name) gin_trgm_ops);
```

Semantic/vector retrieval may be introduced later.

---

# 11. Conversation

Suggested fields:

```text
id
tenant_id
channel_connection_id
customer_id
status
ai_enabled
human_takeover
current_state
last_message_at
created_at
updated_at
```

Conversation status:

```text
open
closed
archived
```

---

# 12. Conversation State

Store structured state separately from raw messages.

Example:

```json
{
  "intent": "product_purchase",
  "current_product_id": "uuid",
  "selected_variant_id": "uuid",
  "selected_color": "black",
  "selected_size": "XL",
  "last_search": "tshirt",
  "cart_id": "uuid",
  "checkout_stage": "customer_information"
}
```

State must be updateable independently from the message history.

---

# 13. Message

Suggested fields:

```text
id
conversation_id
direction
sender_type
external_message_id
content
content_type
metadata
created_at
```

Sender types:

```text
customer
merchant
ai
system
```

Message content types:

```text
text
image
interactive
location
```

Voice/audio can be added later.

---

# 14. AI Orchestrator

The AI Orchestrator is responsible for:

1. Receiving a normalized customer message.
2. Loading conversation state.
3. Determining whether L0 is sufficient.
4. Building AI context.
5. Calling L1.
6. Validating structured output.
7. Escalating to L2 when required.
8. Executing approved actions.
9. Fetching tool results.
10. Generating the final response.
11. Persisting AI telemetry.

---

# 15. AI Gateway

The AI Gateway provides a provider-neutral interface.

Example:

```ts
interface AIProvider {
  understand(request: AIRequest): Promise<AIResult>;
  generate(request: AIRequest): Promise<AIResult>;
}
```

Implementations:

```text
NileChatProvider
DeepSeekProvider
```

Business services must not call provider SDKs directly.

---

# 16. L0 Router

L0 should identify deterministic operations.

Examples:

```text
open_cart
remove_cart_item
increase_quantity
decrease_quantity
select_category
select_product
select_variant
confirm_order
```

When L0 can resolve the action unambiguously, no LLM request should be generated.

---

# 17. L1 Nile-Chat Service

Nile-Chat 4B runs through vLLM.

The service must support:

- Structured JSON output
- Intent extraction
- Action extraction
- Egyptian Arabic
- Arabizi
- Natural Egyptian response generation

The exact inference parameters must remain configurable.

---

# 18. L2 DeepSeek Service

DeepSeek V4 Flash is accessed through its API.

Use cases:

- Complex reasoning
- Complex extraction
- Ambiguous intent
- Multiple-item cart requests
- Difficult recommendations
- L1 failures
- Structured-output correction

The service should support JSON/tool-based outputs where appropriate.

---

# 19. AI Escalation Algorithm

Initial decision flow:

```text
Incoming message
      |
      v
L0 classifier
      |
      +-- deterministic --> execute
      |
      v
Nile-Chat
      |
      v
Validate output
      |
      +-- valid + unambiguous --> execute
      |
      +-- invalid/ambiguous --> DeepSeek
                              |
                              v
                         Validate output
                              |
                     +--------+--------+
                     |                 |
                  valid              invalid
                     |                 |
                     v                 v
                  execute           human
```

Additional escalation triggers may include:

- Complex request score
- Retrieval ambiguity
- Multiple candidate products
- Conflicting constraints
- Repeated clarification
- High-risk business operation

---

# 20. AI Action Schema

All AI actions must conform to predefined schemas.

Example:

```json
{
  "action": "add_to_cart",
  "items": [
    {
      "variant_id": "uuid",
      "quantity": 2
    }
  ]
}
```

The validator checks:

- Schema
- Tenant ownership
- Product status
- Variant existence
- Stock
- Quantity
- Business rules

Invalid actions are never executed.

---

# 21. AI Tool Layer

Recommended internal tools:

```text
search_products
get_product
get_product_variants

get_cart
add_to_cart
update_cart
remove_from_cart

get_checkout_state
update_customer_info
create_order

search_store_knowledge
```

Each tool is implemented as a deterministic backend service.

---

# 22. Catalog Context Builder

The context builder receives:

```text
tenant_id
conversation_id
customer_message
conversation_state
```

It retrieves only relevant information.

Potential context:

```text
Recent messages
Current cart
Current product
Search results
Relevant variants
Relevant knowledge
Allowed actions
Merchant business rules
```

The entire catalog must not be injected into prompts.

---

# 23. Store Knowledge Retrieval

MVP implementation:

- PostgreSQL table
- Chunked text
- Keyword/full-text retrieval
- Tenant filtering

Example:

```text
StoreKnowledge
--------------
id
tenant_id
type
title
content
status
created_at
updated_at
```

Types:

```text
faq
shipping
returns
exchange
payment
general
```

Embeddings can be added later.

---

# 24. Commerce Engine

Commerce services remain independent of AI.

Required services:

```text
CatalogService
CartService
CheckoutService
OrderService
DeliveryService
CustomerService
```

AI calls these services through validated actions.

---

# 25. Cart Service

Responsibilities:

- Create cart
- Add item
- Update quantity
- Remove item
- Resolve variant
- Validate stock
- Calculate subtotal
- Calculate delivery
- Calculate final total

The Cart Service is authoritative.

---

# 26. Order Service

Responsibilities:

- Validate cart
- Validate customer information
- Validate delivery area
- Create order
- Snapshot product information
- Snapshot prices
- Generate order number
- Associate conversation
- Update order status

AI cannot directly insert orders.

---

# 27. Order Snapshotting

Order items should store snapshots:

```text
product_id
variant_id
name_snapshot
variant_snapshot
unit_price
quantity
```

This prevents later catalog changes from altering historical orders.

---

# 28. Customer Service

Normalize:

- Phone
- Name
- Address

Phone normalization must be deterministic.

Support:

```text
01012345678
+201012345678
201012345678
٠١٠١٢٣٤٥٦٧٨
```

Store a canonical format.

---

# 29. Delivery Service

Merchant configures:

```text
area
delivery_fee
estimated_delivery
status
```

Example:

```text
Nasr City
50 EGP
1-2 days
```

The AI can query delivery information.

The delivery service calculates the actual fee.

---

# 30. AI Response Service

The response service receives verified results.

Example:

```json
{
  "cart_total": 1500,
  "delivery_fee": 50,
  "grand_total": 1550
}
```

It generates a natural response.

The response generator must not be allowed to change the values.

---

# 31. Human Handoff

Entity:

```text
HumanHandoff
--------------
id
conversation_id
reason
triggered_by
status
created_at
resolved_at
```

When active:

```text
conversation.ai_enabled = false
conversation.human_takeover = true
```

AI messages must be blocked while human takeover is active.

---

# 32. AI Usage Tracking

Entity:

```text
AIUsageEvent
--------------
id
tenant_id
conversation_id
message_id
tier
provider
model
input_tokens
output_tokens
latency_ms
estimated_cost
success
created_at
```

Tier:

```text
L0
L1
L2
L3
```

---

# 33. AI Request Logging

Do not log sensitive customer data unnecessarily.

Logs should include identifiers and metrics rather than raw customer information whenever possible.

Production logs must avoid exposing:

- Phone numbers
- Full addresses
- Payment information
- Access tokens
- API keys

---

# 34. Redis Usage

Redis can be used for:

- Conversation locks
- Webhook deduplication
- Queueing
- Rate limiting
- Temporary AI state
- Model request queue
- Idempotency keys

---

# 35. Asynchronous Processing

Incoming social webhooks should be acknowledged quickly.

Architecture:

```text
Webhook
   |
   v
Persist event
   |
   v
Queue
   |
   v
Conversation processor
   |
   v
AI / Commerce
   |
   v
Outbound message
```

This prevents slow AI inference from blocking webhook responses.

---

# 36. Conversation Concurrency

A conversation must have a processing lock.

Example:

```text
conversation:{id}:lock
```

This prevents two customer messages from being processed against stale cart/conversation state simultaneously.

---

# 37. Idempotency

Every external webhook/message should have an idempotency key.

The system must not:

- Process the same customer message twice.
- Add the same cart item twice due to duplicate webhook delivery.
- Create duplicate orders due to retry.

---

# 38. Model Serving

Nile-Chat should initially run through vLLM on an L4 GPU.

Recommended initial deployment:

```text
GPU:
L4 24 GB

Model:
Nile-Chat 4B

Serving:
vLLM
```

The deployment should expose an internal API only.

Public traffic should go through the AI Gateway.

---

# 39. Model Scaling

The architecture must support:

- Multiple inference replicas
- Queue-based load management
- Autoscaling
- Model versioning
- Health checks
- Graceful degradation

At low traffic, scale-to-zero may be considered.

At meaningful production traffic, always-on capacity may be preferred for latency.

---

# 40. DeepSeek Cost Control

DeepSeek should be called only when required.

The system should track:

```text
L2 escalation rate
L2 tokens
L2 cost
L2 cost per order
```

A merchant must not be able to generate unlimited pathological L2 usage without enforcement.

Fair-use enforcement should be applied at the application level.

---

# 41. AI Fair-Use Enforcement

The system should maintain:

```text
daily_ai_turns
monthly_ai_turns
daily_l2_turns
monthly_l2_turns
```

These are internal controls.

The merchant-facing product should not expose unnecessary per-message billing.

When abnormal usage is detected:

1. Warn merchant.
2. Temporarily restrict abnormal usage if required.
3. Offer upgrade/contact path.
4. Preserve normal customer service whenever possible.

---

# 42. Security

Required:

- Tenant isolation
- Token encryption
- Secrets management
- HTTPS
- RBAC for merchant dashboard
- Rate limiting
- Webhook signature validation
- Input validation
- Output schema validation
- Audit logging

---

# 43. AI Prompt Security

Customer messages are untrusted input.

System instructions must prevent the model from:

- Revealing prompts
- Revealing private merchant information
- Changing prices
- Creating discounts
- Bypassing business rules
- Accessing another tenant
- Inventing unavailable products
- Exposing internal identifiers unnecessarily

Backend validation remains the final security boundary.

---

# 44. Failure Handling

## Nile-Chat unavailable

Use DeepSeek if appropriate.

## DeepSeek unavailable

Attempt Nile-Chat if safe.

## Both unavailable

Fall back to deterministic catalog interaction and human takeover.

## AI produces invalid JSON

Retry once with constrained schema.

If still invalid:

Escalate.

## Commerce action fails

Do not tell customer the action succeeded.

Return a safe response based on actual backend state.

---

# 45. Latency Targets

Initial targets:

### L0

p95 < 500 ms excluding channel/network latency.

### L1

p95 < 3 seconds.

### L2

p95 < 8 seconds.

These are initial engineering targets and should be validated against real customer behavior.

---

# 46. Testing Strategy

## Unit tests

- Catalog search
- Arabic normalization
- Arabizi normalization
- Phone normalization
- Cart
- Checkout
- Delivery
- Action validation

## AI tests

Create a fixed Egyptian ecommerce evaluation set.

Categories:

- Arabic
- Arabizi
- Mixed language
- Typos
- Product search
- Variant selection
- Quantities
- Multiple products
- Recommendations
- Address extraction
- Checkout
- Ambiguous requests

## Integration tests

Test:

```text
Message
→ AI
→ Action
→ Catalog
→ Cart
→ Checkout
→ Order
```

---

# 47. AI Evaluation Dataset

Before production launch, create at least:

```text
100–200 labeled conversations
```

Then expand to thousands of real anonymized examples.

Each example should include:

```text
input
expected_intent
expected_action
expected_entities
expected_products
expected_escalation_tier
```

This dataset should be version-controlled separately from production customer data.

---

# 48. Model Evaluation

Benchmark Nile-Chat against at least one alternative model.

Metrics:

- Intent accuracy
- Entity extraction accuracy
- Product resolution accuracy
- Action validity
- Order accuracy
- Arabizi understanding
- Egyptian dialect understanding
- Latency
- Cost

Nile-Chat should remain the default only if it performs adequately on the actual Tijaratk workload.

---

# 49. Monitoring

Infrastructure monitoring:

- CPU
- RAM
- GPU utilization
- VRAM
- GPU queue
- inference latency
- API latency
- Redis
- PostgreSQL
- webhook failures

AI monitoring:

- L0/L1/L2/L3 distribution
- AI success
- action failures
- escalation
- token usage
- cost
- order conversion

Business monitoring:

- conversations
- carts
- orders
- conversion rate
- AI-assisted orders
- human-assisted orders

---

# 50. Billing Architecture

Subscription model must support:

```text
BasePlan
Subscription
SubscriptionAddon
UsageLedger
ExternalUsageCharge
```

Example:

```text
Base:
Growth = 749 EGP

Addon:
AI = 350 EGP

Third-party:
WhatsApp Meta usage = variable pass-through
```

Billing must never hard-code plan prices in application logic.

---

# 51. Plan Entitlements

Example entitlement structure:

```json
{
  "channels": ["facebook", "instagram"],
  "catalog": true,
  "ai": false,
  "ai_fair_use": false,
  "users": 1
}
```

When AI is added:

```json
{
  "channels": ["facebook", "instagram"],
  "catalog": true,
  "ai": true,
  "ai_fair_use": true,
  "users": 1
}
```

---

# 52. Recommended Initial Plan Configuration

### Starter

```text
499 EGP
Facebook OR Instagram
Catalog
DM shopping
Cart
Checkout
Orders
```

AI:

```text
+250 EGP
```

### Growth

```text
749 EGP
Facebook + Instagram
Everything in Starter
Higher operational limits
```

AI:

```text
+350 EGP
```

### Pro

```text
1,199 EGP
Facebook + Instagram + WhatsApp
Higher operational limits
Multiple users
```

AI:

```text
+450 EGP
```

All prices are configurable.

---

# 53. API Boundaries

Recommended modules:

```text
AuthModule
TenantModule
ChannelModule
CatalogModule
ConversationModule
CartModule
CheckoutModule
OrderModule
CustomerModule
DeliveryModule
KnowledgeModule
AIModule
BillingModule
WebhookModule
```

AI must communicate with commerce modules through service interfaces rather than direct database access.

---

# 54. Suggested AI Module Structure

```text
ai/
├── ai.gateway.ts
├── ai.orchestrator.ts
├── ai.router.ts
├── ai.context-builder.ts
├── ai.action-validator.ts
├── ai.response-generator.ts
├── ai.escalation.ts
├── providers/
│   ├── nile-chat.provider.ts
│   └── deepseek.provider.ts
├── actions/
│   ├── search-products.action.ts
│   ├── get-product.action.ts
│   ├── add-to-cart.action.ts
│   ├── update-cart.action.ts
│   ├── remove-from-cart.action.ts
│   ├── checkout.action.ts
│   └── search-knowledge.action.ts
└── telemetry/
    └── ai-usage.service.ts
```

---

# 55. Recommended Processing Flow

```text
1. Receive webhook
2. Validate webhook
3. Deduplicate message
4. Persist message
5. Acquire conversation lock
6. Load conversation state
7. Run L0 router
8. If L0 succeeds:
      execute action
9. Otherwise build AI context
10. Call Nile-Chat
11. Validate structured output
12. If ambiguous/invalid:
      call DeepSeek
13. Validate L2 output
14. Execute commerce action
15. Recalculate authoritative state
16. Generate final response
17. Send response
18. Persist AI telemetry
19. Update conversation state
20. Release lock
```

---

# 56. Architectural Invariants

The following rules must never be violated:

1. AI cannot directly modify database records.
2. AI cannot determine authoritative prices.
3. AI cannot determine authoritative stock.
4. AI cannot bypass checkout validation.
5. AI cannot access another tenant.
6. Customer messages are untrusted input.
7. Human takeover disables AI customer-facing responses.
8. External messaging fees are separate from subscription revenue.
9. AI provider implementations remain replaceable.
10. Every AI action must be observable and auditable.

---

# 57. Future Technical Extensions

Potential future additions:

- Vector embeddings for semantic product search
- Fine-tuned Nile-Chat ecommerce model
- RAG over merchant knowledge
- Voice transcription
- Image understanding
- Product image search
- Multimodal product recommendation
- More social channels
- Shipping provider adapters
- Payment provider adapters
- AI sales analytics

These must not compromise the deterministic commerce core.
