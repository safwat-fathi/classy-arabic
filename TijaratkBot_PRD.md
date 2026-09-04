# TijaratkBot — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Product Definition

---

## 1. Product Overview

TijaratkBot is a social-commerce automation platform for Egyptian online sellers.

The core product lets a merchant connect their social channels and expose their product catalog through customer DMs. Customers can discover products and interact with the catalog directly inside the conversation.

The primary differentiator is an optional AI layer:

> **TijaratkBot AI understands Egyptian Arabic and Arabizi, answers customer questions from the merchant's actual catalog and business knowledge, and can turn natural-language requests into validated cart and order actions.**

AI is an **add-on**, not mandatory.

A merchant can therefore use TijaratkBot in two modes:

1. **Catalog Mode:** structured catalog experience through DMs without AI.
2. **AI Commerce Mode:** Catalog Mode + AI conversational understanding, product discovery, recommendations, cart actions, checkout/order extraction, and escalation.

The product is initially focused on Egyptian social sellers.

---

# 2. Product Positioning

## Core promise

> Turn social-media DMs into a shopping and ordering experience.

## AI promise

> Let customers talk naturally in Egyptian Arabic or Arabizi instead of forcing them through rigid menus.

TijaratkBot should not be positioned as a generic chatbot.

It is a **commerce system with an AI interaction layer**.

---

# 3. Target Customers

Primary customers:

- Egyptian sellers operating through Facebook
- Instagram sellers
- Small and medium online stores
- Social-commerce brands
- Fashion sellers
- Beauty and skincare sellers
- Home products sellers
- Consumer electronics/accessories sellers
- Gift sellers
- Other merchants whose sales conversations happen through DMs

The strongest initial customer is a seller who:

- Has an established product catalog.
- Receives meaningful DM volume.
- Uses Facebook/Instagram as a sales channel.
- Currently answers product questions manually.
- Loses time converting conversations into orders.

---

# 4. Product Scope

## MVP Scope

### Merchant

- Merchant account
- Store profile
- Product catalog
- Categories
- Products
- Product images
- Prices
- Variants
- Availability/stock status
- Product descriptions
- Product attributes
- Delivery areas and fees
- Store FAQ/knowledge
- Connected social channels
- Conversation inbox
- Order management
- AI settings
- Human takeover

### Customer

- Discover merchant catalog through DMs
- Browse categories/products
- View product details
- Select variants
- Add products to cart
- Modify cart
- Start checkout
- Provide customer details
- Confirm order
- Ask natural-language questions when AI is enabled

---

# 5. Explicitly Out of Scope for MVP

The following should not block MVP:

- Advanced shipping-company integrations
- Large-scale marketing/broadcast automation
- Advanced coupon/discount engine
- Complex VAT engine
- QR/web menu
- Full web storefront
- Large payment-provider ecosystem
- Advanced analytics
- Automated marketing campaigns
- Multi-country localization
- Enterprise permissions
- Voice AI
- Image-generation AI
- AI-generated product descriptions
- AI-generated advertisements

These can be considered after product-market validation.

---

# 6. Core Product Modes

## 6.1 Catalog Mode

Available in the base subscription.

The merchant can expose the catalog through supported DM channels.

Customer can:

1. Open the catalog experience.
2. Browse categories.
3. Browse products.
4. View product information.
5. Select variants.
6. Add products to cart.
7. Review cart.
8. Start checkout.
9. Submit an order.

No generative AI is required.

The system uses deterministic catalog and commerce logic.

---

## 6.2 AI Commerce Mode

AI is an optional paid add-on.

AI adds:

- Egyptian Arabic understanding
- Arabizi understanding
- Natural-language product search
- Product questions
- Product recommendations
- Natural-language variant selection
- Natural-language cart modification
- Natural-language order extraction
- Conversational checkout
- Merchant knowledge/FAQ answering
- AI escalation
- Human handoff

Example:

Customer:

> "3ayz 2 tshirt aswd xl"

AI interprets the request, searches the catalog, resolves the actual variant, validates availability, and adds it to the cart.

Customer:

> "عايز حاجة شبهه بس أرخص"

AI searches relevant products and recommends alternatives.

Customer:

> "محمد أحمد 01012345678، 15 شارع التحرير الدقي الدور التالت"

AI extracts customer information, then the deterministic checkout system validates and stores it.

---

# 7. AI Is an Add-On

AI must not be bundled into the lowest base plan.

The merchant first chooses a normal TijaratkBot plan.

Then they can enable:

> **TijaratkBot AI**

The AI add-on price depends on the merchant's selected base plan.

Example pricing structure:

| Base Plan | Base Price | AI Add-on | Combined |
|---|---:|---:|---:|
| Starter | 499 EGP | +250 EGP | 749 EGP |
| Growth | 749 EGP | +350 EGP | 1,099 EGP |
| Pro | 1,199 EGP | +450 EGP | 1,649 EGP |

These values are initial pricing hypotheses and should be validated with real merchants.

### AI usage policy

AI is included under a clear fair-use policy.

There is no per-message AI charge during normal usage.

Extremely high-volume, abusive, or automated usage outside normal ecommerce behavior may require a higher plan or additional commercial arrangement.

---

# 8. Messaging Fees

Meta/WhatsApp platform messaging fees are separate from TijaratkBot subscription pricing.

TijaratkBot does not guarantee that third-party messaging fees are included in the subscription.

Where TijaratkBot incurs WhatsApp/Meta messaging costs on behalf of the merchant, those costs should be passed through transparently without an initial markup.

The product must maintain separate accounting for:

- TijaratkBot subscription revenue
- AI infrastructure cost
- Meta/WhatsApp messaging cost
- Other third-party API costs

---

# 9. AI Architecture — Product Requirement

AI architecture is a core product capability.

The system must use a tiered AI architecture:

```text
Customer Message
       |
       v
  AI Router
       |
       +------------------+
       |                  |
       v                  v
 L0 Deterministic     L1 Nile-Chat 4B
       |                  |
       |                  +------+
       |                         |
       |                    Escalation
       |                         |
       |                         v
       |                 L2 DeepSeek V4 Flash
       |                         |
       +------------+------------+
                    |
                    v
             Action Validator
                    |
                    v
             Commerce Engine
                    |
                    v
             Response Generator
                    |
                    v
                Customer
```

A final L3 escalation goes to a human merchant/operator when AI cannot safely resolve the request.

---

# 10. L0 — Deterministic Layer

The system should avoid using an LLM when the request can be resolved deterministically.

Examples:

- "Show cart"
- "Remove this product"
- "Increase quantity"
- "Decrease quantity"
- Selecting a product button
- Selecting a category
- Selecting a known variant
- Viewing product details

The goal is:

- Lower latency
- Lower AI cost
- Higher reliability
- Predictable behavior

---

# 11. L1 — Nile-Chat 4B

Nile-Chat 4B is the primary AI model for normal Egyptian ecommerce conversations.

Its responsibilities include:

- Egyptian Arabic understanding
- Egyptian Arabic generation
- Arabizi understanding
- Intent classification
- Product-search query extraction
- Variant extraction
- Quantity extraction
- Customer-data extraction
- Normal FAQ handling
- Normal conversational responses
- Basic cart actions

The model must not be trusted as the source of truth for:

- Price
- Stock
- Product ID
- Variant ID
- Discount
- Delivery fee
- Order total
- Payment status

Those values always come from deterministic backend services.

---

# 12. L2 — DeepSeek V4 Flash

DeepSeek V4 Flash is the Tier-2 reasoning model.

It is used when Nile-Chat cannot safely or confidently resolve a request.

Typical escalation triggers:

- Ambiguous product request
- Multiple products in one natural-language request
- Complex product recommendation
- Complex multi-turn reasoning
- Ambiguous references to previous products
- Complicated cart changes
- Difficult customer-data extraction
- Failed structured output
- Repeated L1 failures
- Complex customer intent

DeepSeek should not be called for every conversation.

The system should optimize for the majority of traffic to be handled by L0/L1.

---

# 13. L3 — Human Escalation

The system must be able to hand a conversation to a human.

Automatic escalation should occur when:

- Customer explicitly asks for a human.
- Customer has a complaint.
- Refund/return dispute occurs.
- Payment dispute occurs.
- AI cannot resolve the request after retries.
- Address remains ambiguous.
- Product intent remains unresolved.
- Merchant has configured an intent as human-only.
- Safety/business rules prevent AI completion.

When human mode is active:

- AI must stop sending customer-facing messages.
- Merchant sees the conversation.
- Merchant can respond manually.
- Merchant can return the conversation to AI.

---

# 14. AI Action Architecture

The AI must never directly mutate the database.

AI produces a structured action.

Example:

```json
{
  "action": "search_products",
  "query": "تيشيرت",
  "filters": {
    "color": "black",
    "size": "XL",
    "max_price": null
  }
}
```

The backend validates and executes the action.

For cart actions:

```json
{
  "action": "add_to_cart",
  "variant_id": "validated-variant-id",
  "quantity": 2
}
```

The backend validates:

- Variant exists
- Variant belongs to merchant
- Product is active
- Variant is available
- Quantity is valid

Only then is the cart modified.

---

# 15. AI Tool/Action Set

Initial actions:

### Catalog

- `search_products`
- `get_product`
- `get_product_variants`

### Cart

- `get_cart`
- `add_to_cart`
- `update_cart`
- `remove_from_cart`

### Checkout

- `get_checkout_state`
- `update_customer_info`
- `create_order`

### Knowledge

- `search_store_knowledge`

The action set should remain intentionally small.

---

# 16. Catalog Retrieval

Catalog retrieval must be separate from the LLM.

Initial implementation:

- PostgreSQL
- Exact matching
- Normalized Arabic search
- Arabizi normalization
- PostgreSQL full-text search
- `pg_trgm`
- Category filters
- Price filters
- Variant filters
- Availability filters

Vector search is not required for MVP.

It may be introduced later for semantic product discovery.

---

# 17. Egyptian Arabic and Arabizi Normalization

The system should support:

- Arabic script
- Arabizi/Franco
- Mixed Arabic/English
- Common Egyptian spelling variations
- Numbers written using Arabic numerals
- Numbers written using Arabic-Indic numerals
- Common voice-to-text patterns

Examples:

```text
عايز
عاوز
محتاج
3ayz
3awez
m7tag
```

Normalization should assist retrieval without destroying the original customer message.

The original message must always be preserved.

---

# 18. Conversation State

Conversation state must be stored separately from raw message history.

Example:

```json
{
  "intent": "product_purchase",
  "current_product_id": "...",
  "selected_variant_id": "...",
  "selected_color": "black",
  "selected_size": "XL",
  "last_search": "tshirt",
  "cart_id": "...",
  "checkout_stage": "customer_information"
}
```

This prevents the AI from reconstructing the entire conversation on every turn.

---

# 19. Context Management

Do not send the entire conversation or entire catalog to the model.

Context should contain only:

- Relevant recent messages
- Structured conversation state
- Relevant catalog results
- Relevant store knowledge
- Available actions
- Necessary business rules

This is required for:

- Lower token usage
- Lower latency
- Better model accuracy
- Better GPU utilization
- Better unit economics

---

# 20. Store Knowledge

Merchant knowledge is separate from the product catalog.

Examples:

- Shipping policy
- Returns
- Exchanges
- Payment methods
- Working hours
- Delivery times
- Store policies
- FAQs
- Brand information

The AI may answer these questions only using configured merchant information.

Example:

> "لو المقاس طلع مش مناسب أعمل إيه؟"

The AI searches the merchant's return/exchange knowledge and answers naturally.

---

# 21. Commerce Truth Rules

The following values must always be retrieved from backend services:

- Product price
- Variant availability
- Stock
- Discount
- Delivery fee
- Tax
- Order total
- Payment status
- Order status

AI may explain these values but must not invent them.

---

# 22. Conversational Ordering

The system must support multi-item natural-language requests.

Example:

> "عايز 2 تيشيرت أسود XL وواحد أبيض L"

The AI extracts the requested items.

Backend resolves the actual product variants.

Backend validates availability.

The cart is updated.

The AI summarizes the verified cart.

---

# 23. Conversational Checkout

Customer may provide information naturally:

> "محمد أحمد، 01012345678، 15 شارع التحرير الدقي، الدور التالت."

The AI extracts:

- Name
- Phone
- Address
- Area
- Building
- Floor
- Apartment
- Notes

The backend validates the phone and delivery area.

The customer receives a final verified summary before order creation.

---

# 24. Phone Normalization

Phone numbers must be normalized independently of AI.

Supported formats include:

- `01012345678`
- `+201012345678`
- `201012345678`
- Arabic-Indic digits

The system stores a canonical representation.

---

# 25. Address Handling

The AI may extract address components.

A deterministic address/delivery service validates:

- Governorate
- City/area
- Merchant service area
- Delivery fee
- Delivery availability

Ambiguous addresses require clarification or human takeover.

---

# 26. AI Response Generation

The final customer response should be generated from verified system state.

Example backend result:

```json
{
  "cart_total": 1500,
  "delivery_fee": 50,
  "grand_total": 1550
}
```

AI may respond:

> "تمام، المنتجات 1500 جنيه والتوصيل 50 جنيه، الإجمالي 1550 جنيه. أأكد الأوردر؟"

The AI must not independently calculate the total.

---

# 27. Human Takeover

Merchant UI must provide:

- AI active indicator
- Human active indicator
- Take over conversation
- Return to AI
- Conversation history
- AI actions performed
- Order associated with conversation

---

# 28. AI Observability

Every AI turn should record:

- Merchant ID
- Conversation ID
- Message ID
- Model
- Model version
- Input tokens
- Output tokens
- Latency
- AI tier
- Intent
- Action
- Action success/failure
- Retrieval results
- Escalation reason
- Human handoff
- Order created
- Estimated AI cost

This data is required for unit economics and model evaluation.

---

# 29. AI Quality Metrics

Track:

- AI resolution rate
- Human handoff rate
- Product resolution rate
- Action success rate
- Invalid action rate
- Order completion rate
- AI turns/order
- AI cost/order
- p50 latency
- p95 latency
- Tier distribution: L0/L1/L2/L3
- Customer correction rate

---

# 30. AI Cost Optimization

The system should optimize in this order:

1. Avoid LLM for deterministic interactions.
2. Use Nile-Chat for normal conversations.
3. Escalate only difficult cases to DeepSeek.
4. Keep context small.
5. Retrieve only relevant catalog items.
6. Cache repeated information where practical.
7. Use structured state instead of long conversation history.
8. Measure actual cost before changing public limits.

---

# 31. AI Model Abstraction

The application must not hard-code business logic around Nile-Chat.

Create an AI Gateway abstraction.

Example:

```text
AI Gateway
 ├── NileChatProvider
 ├── DeepSeekProvider
 └── FutureProvider
```

The rest of the application communicates with the AI Gateway.

This allows future model replacement without rewriting the commerce system.

---

# 32. Merchant Dashboard Requirements

## Conversations

- Unified conversation list
- Channel
- Customer
- Last message
- AI/Human status
- Order association
- Search/filter

## Products

- Product CRUD
- Categories
- Variants
- Price
- Availability
- Images
- Attributes

## Orders

- Order number
- Customer
- Products
- Total
- Address
- Status
- Conversation link
- Created time

## AI

- Enable/disable
- AI status
- Store knowledge
- FAQ
- Human takeover
- AI behavior settings
- Custom AI Learning (UI for adding `labeled_examples` for custom intents)
- Continuous Learning settings (from previous conversations)

---

# 33. Onboarding

Merchant onboarding should be short.

### Step 1

Create account.

### Step 2

Add/import catalog.

### Step 3

Connect social channel.

### Step 4

Choose Catalog Mode or enable AI.

### Step 5

Configure delivery areas.

### Step 6

Test customer conversation.

The merchant should be able to receive a first catalog interaction quickly.

AI configuration should not be required for merchants who don't want AI.

---

# 34. Pricing Requirements

The pricing system must support:

- Base plan subscription
- AI add-on subscription
- Channel entitlements
- Fair-use AI policy
- Third-party usage charges
- Plan upgrades
- Plan downgrades
- Add-on cancellation
- Usage telemetry

Initial pricing hypothesis:

| Plan | Base | AI Add-on | Total with AI |
|---|---:|---:|---:|
| Starter | 499 EGP | +250 | 749 EGP |
| Growth | 749 EGP | +350 | 1,099 EGP |
| Pro | 1,199 EGP | +450 | 1,649 EGP |

These prices must remain configurable rather than hard-coded.

---

# 35. Success Criteria

The MVP is successful if a merchant can:

1. Import/create a catalog.
2. Connect a supported social channel.
3. Customer can browse products through DM.
4. Customer can select variants.
5. Customer can add products to cart.
6. Customer can place an order.
7. Merchant sees the order.
8. AI can be enabled independently.
9. AI understands Egyptian Arabic.
10. AI understands Arabizi.
11. AI can search the catalog naturally.
12. AI can answer product questions.
13. AI can build a cart from natural language.
14. AI can collect customer information.
15. Backend validates every commerce action.
16. Difficult conversations escalate to Tier 2 or a human.
17. AI usage and cost are measurable.

---

# 36. Product Principles

1. **Commerce first, AI second.**
2. **AI never becomes the source of truth.**
3. **Natural language should simplify commerce, not complicate it.**
4. **Egyptian Arabic and Arabizi are first-class inputs.**
5. **Use deterministic systems whenever possible.**
6. **Escalate intelligently rather than making AI answer everything.**
7. **No per-message AI billing for normal use.**
8. **Third-party messaging costs remain separate.**
9. **Human takeover must always be available.**
10. **Measure real AI economics before imposing restrictive limits.**

---

# 37. Future Roadmap

### Phase 2

- WhatsApp
- Online payment integrations
- Shipping integrations
- Semantic product search
- Better AI recommendations
- Advanced analytics
- Coupons
- More merchant knowledge tools

### Phase 3

- Fine-tuned Nile-Chat ecommerce model
- Voice-message understanding
- Image-based product search
- AI sales analytics
- AI customer segmentation
- Automated follow-up
- AI marketing campaigns

---

# 38. Key Product Differentiator

TijaratkBot should not compete on:

> "We have a chatbot."

It should compete on:

> **"Your customer can speak naturally in Egyptian Arabic or Arabizi, ask about your products, choose what they want, and place an order without having to understand how your bot works."**

That is the core product thesis.
