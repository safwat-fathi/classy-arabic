# Roadmap

Sourced from `TijaratkBot_PRD.md` (§4–§5, §35, §37) and `TijaratkBot_SRD.md` (§57), reconciled against what's actually in this repo today. See the main [`README.md`](./README.md#status) for the detailed status breakdown.

## Now — built today

- Two-stage AI classification + extraction pipeline (Tier 0 rules + DeepSeek), with escalation telemetry fields (`Message.escalation_reason`)
- Core models: `merchant`, `conversation`, `message`, `product`, `order`, `labeled_example`
- API domains: `health`, `messages` (message ingest → full pipeline), `products`, `conversations`
- Offline clustering job, seed/dev scripts
- Demo frontend workspace (`/demo`): product catalog, message composer, AI insights panel
- **Channel/webhook ingestion** — Facebook, Instagram, WhatsApp (via Twilio) text webhooks with signature verification, deduplication, and an arq worker queue. `ChannelConnection` provisioned manually; outbound replies not implemented. (SRD §7, §35–§37)

## Near-term — MVP gap-closers

Everything below is in the PRD's MVP scope (§4) or Success Criteria (§35) but not yet in this repo:

- **AI action validator + tool layer** — `search_products`, `get_product`, `add_to_cart`, `update_cart`, `remove_from_cart`, `get_checkout_state`, `update_customer_info`, `create_order`, `search_store_knowledge` (SRD §21, PRD §15)
- **Cart & checkout services** — `Cart`, `CartItem` entities and the deterministic cart/checkout flow (SRD §25)
- **Order service hardening** — validate customer info/delivery area, order snapshotting, order numbers (SRD §26–§27); the `Order` model exists but the surrounding service layer doesn't yet
- **Multi-tenancy** — `Tenant` entity and enforced isolation across all tenant-owned records (SRD §4, §6)
- **Delivery service** — merchant-configured delivery areas/fees (SRD §29)
- **Store knowledge retrieval** — FAQ/shipping/returns content, keyword/full-text retrieval (SRD §23)
- **Human handoff** — `HumanHandoff` entity, AI-disable-on-takeover behavior (SRD §31, PRD §13)
- **Merchant dashboard** — conversation inbox, product CRUD UI, order management, AI settings, human takeover controls (PRD §32) — currently only the `/demo` page exists
- **Billing** — base plans, AI add-on, fair-use tracking/enforcement (SRD §50–§41, PRD §7, §34)
- **Security baseline** — RBAC for the dashboard, webhook signature validation, secrets management, audit logging (SRD §42)

## Phase 2 (per PRD §37)

- WhatsApp channel
- Online payment integrations
- Shipping integrations
- Semantic/vector product search
- Better AI recommendations
- Advanced analytics
- Coupons
- More merchant knowledge tools

## Phase 3 (per PRD §37)

- Voice-message understanding
- Image-based product search
- AI sales analytics and customer segmentation
- Automated follow-up
- AI marketing campaigns

## Explicitly out of scope for now (PRD §5)

Not to be pulled forward without a deliberate decision: advanced shipping-company integrations, large-scale marketing/broadcast automation, an advanced coupon/discount engine, a complex VAT engine, QR/web menu, a full web storefront, a large payment-provider ecosystem, advanced analytics, automated marketing campaigns, multi-country localization, enterprise permissions, voice AI, image-generation AI, AI-generated product descriptions, AI-generated advertisements.
