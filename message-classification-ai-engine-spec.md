# Classy Arabic: Message Classification & AI Engine — Technical Spec (Core)

Scope: storage → normalization → classification → structured extraction, with NileChat-4B as the primary model from huggingface and a defined escalation path to a higher-tier model (DeepSeek v4 Flash via OpenRouter API). Embeddings use a self-hosted multilingual model (`BAAI/bge-m3`). No channel/webhook integration in this doc — starts from "a message has arrived and is ready to be processed."

---

## 1. Model References

### 1.1 Primary Model (Tier 1): MBZUAI-Paris/Nile-Chat-4B

Grounding the spec in what this model actually is, since the routing design depends on its real limits:

| Property                         | Value                                                                                                                  | Design implication                                                                                                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base architecture                | Gemma 3 4B (`gemma3_text`)                                                                                             | Standard transformer, served like any Gemma 3 model                                                                                                                                                                                                  |
| Parameters                       | 4B, BF16                                                                                                               | Fits on a single modest GPU (~8–10GB VRAM in bf16; less with quantized GGUF builds)                                                                                                                                                                  |
| Scripts supported                | Arabic script + Arabizi (Latin script), natively — not via translation                                                 | No separate Arabizi→Arabic pre-translation step needed before this model; feed it either script directly                                                                                                                                             |
| **Training max sequence length** | **2048 tokens** (continual pretrain + SFT + DPO)                                                                       | **Hard practical context budget.** The Gemma 3 architecture may accept longer inputs, but Egyptian-dialect tuning was never validated past this — treat 2048 tokens as your working ceiling until you've empirically tested longer inputs yourself   |
| Serving                          | Transformers, vLLM, SGLang, Docker Model Runner; GGUF quantizations available for llama.cpp/Ollama/LM Studio           | vLLM/SGLang expose an OpenAI-compatible `/v1/chat/completions` endpoint — call it via standard client, just point the base URL at your own host                                                                                                    |
| License                          | Gemma license                                                                                                          | Check commercial-use terms before shipping                                                                                                                                                                                                           |
| Strength profile                 | Beats general 7B–14B models on Egyptian benchmarks; dominant specifically on transliteration (Arabic script ↔ Arabizi) | Best-fit for normalization-adjacent tasks and dialect-fluent generation; **not evaluated for general multi-step reasoning at frontier-model levels** — a 4B model's reasoning ceiling is lower than a frontier model's regardless of dialect fluency |
| Structured output                | No native function-calling/tool-use interface documented                                                               | Must enforce JSON schema via constrained/guided decoding (e.g., vLLM guided decoding, `outlines`, or grammar-constrained sampling) rather than assuming native structured output support                                                             |
| Embedding capability             | **None** — this is a generative chat model, not an embedding model                                                     | Embeddings need a dedicated model — see §1.3 and §5                                                                                                                                                                                                  |

### 1.2 Escalated Model (Tier 2): DeepSeek v4 Flash (via OpenRouter API)

| Property             | Value                                                              | Design implication                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role                 | Tier-2 Escalated AI Model                                          | Handles high-reasoning tasks, context overflows, ambiguous extractions, and low-confidence classifications                                                                   |
| Context capacity     | Large context window (128k+ tokens)                                | Ingests full thread histories + slot states without truncation when exceeding NileChat's 2048-token limit                                                                    |
| Reasoning & Tool use | Frontier-grade multi-step reasoning & structured output capability | Handles complex cross-referencing, multi-intent resolution, and edge-case field extractions                                                                                  |
| Serving & Provider   | **OpenRouter API** (`https://openrouter.ai/api/v1`)                | Accessible via standard OpenAI SDK/HTTP client (`deepseek/deepseek-chat` or provider alias on OpenRouter). Requires `OPENROUTER_API_KEY`, eliminating direct GPU self-hosting |

### 1.3 Embedding Model: BAAI/bge-m3 (Self-Hosted Multilingual)

> [!NOTE]
> **Model Selection Note:** `BAAI/bge-base-en-v1.5` is strictly English-only (`-en-`) and will fail on Arabic script and Arabizi. The proper multilingual model from BAAI is **`BAAI/bge-m3`** (or alternatively **`intfloat/multilingual-e5-base`** if 768-dim vectors are preferred).

| Property       | Value                                                         | Design implication                                                                                                  |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Model ID       | `BAAI/bge-m3`                                                 | True multilingual support for 100+ languages including Arabic (MSA + dialect vocabulary) and Latin-script Arabizi   |
| Dimensions     | **1024 dimensions**                                           | Vector dimension for PostgreSQL `pgvector` columns (`vector(1024)`)                                                 |
| Serving Method | Self-hosted (e.g., Hugging Face TEI container, FastEmbed, ONNX)| Low-latency local embedding generation with zero per-token third-party API costs                                    |
| Max Sequence   | 8192 tokens                                                   | Ample capacity for whole messages, turn histories, and labeled examples                                             |

---

## 2. Data Model

```prisma
model Merchant {
  id            String   @id @default(cuid())
  name          String
  products      Product[]
  conversations Conversation[]
}

model Conversation {
  id            String   @id @default(cuid())
  merchantId    String
  merchant      Merchant @relation(fields: [merchantId], references: [id])
  customerRef   String
  state         ConvState      // NEW | GATHERING | CONFIRMING | COMPLETED | ABANDONED
  slots         Json           // { line_items: [], address?, phone?, payment_method? }
  lastMessageAt DateTime
  messages      Message[]
  orders        Order[]
}

model Message {
  id                 String   @id @default(cuid())
  conversationId     String
  conversation       Conversation @relation(fields: [conversationId], references: [id])
  direction          Direction        // INBOUND | OUTBOUND
  rawText            String?
  normalizedText     String?
  intent             String?
  intentConfidence   Float?
  modelTier          ModelTier?       // RULE | NILECHAT | ESCALATED
  escalationReason   String?          // populated only if modelTier = ESCALATED
  embedding          Unsupported("vector(1024)")?  // 1024-dim dense vector from BAAI/bge-m3
  createdAt          DateTime @default(now())
}

model Product {
  id            String   @id @default(cuid())
  merchantId    String
  merchant      Merchant @relation(fields: [merchantId], references: [id])
  name          String
  aliases       String[]
  variants      Json
  embedding     Unsupported("vector(1024)")?  // 1024-dim dense vector from BAAI/bge-m3
}

model Order {
  id                String   @id @default(cuid())
  conversationId    String
  conversation      Conversation @relation(fields: [conversationId], references: [id])
  extractedPayload  Json
  confirmedPayload  Json?
  status            OrderStatus     // AUTO_CONFIRMED | PENDING_REVIEW | CONFIRMED | REJECTED
  confidenceScore   Float
  extractedByTier   ModelTier
}

model LabeledExample {
  id             String   @id @default(cuid())
  merchantId     String?
  normalizedText String
  intent         String
  extraction     Json?
  embedding      Unsupported("vector(1024)")?  // 1024-dim dense vector from BAAI/bge-m3
  source         String          // "merchant_correction" | "cluster_labeling"
}

enum ModelTier {
  RULE
  NILECHAT
  ESCALATED
}
```

`modelTier` and `escalationReason` are not optional extras — they're what let you later answer "how often am I escalating, and why," which is your main cost and quality signal.

---

## 3. Pipeline

```
Message (already stored, normalizedText populated)
        │
        ▼
[Tier 0: Rule-based short-circuit]
   keyword/regex check for greeting, obvious spam, single-emoji reactions
        │ (no match)
        ▼
[Context Budget Assembler]
   builds prompt: last N turns + slot state, trimmed to fit NileChat's
   2048-token training ceiling
        │
        ▼
[Tier 1: NileChat-4B — Intent Classification]
   constrained decoding → one of the fixed intent labels + confidence
        │
        ├─ confidence ≥ threshold ────────────────► proceed with intent
        │
        └─ confidence < threshold ──► [Tier 2: DeepSeek v4 Flash (OpenRouter)] ──► intent
        │
        ▼ (if intent == purchase_intent AND state ∈ {GATHERING, CONFIRMING})
[Tier 1: NileChat-4B — Structured Extraction]
   schema-constrained JSON output (line_items, address, phone, payment_method,
   ambiguous_fields)
        │
        ├─ ambiguous_fields empty AND confidence ≥ threshold ──► use as-is
        │
        └─ ambiguous_fields non-empty OR confidence < threshold
           OR prompt exceeded context budget
           OR 2nd correction on this conversation thread
                  │
                  ▼
           [Tier 2: DeepSeek v4 Flash (OpenRouter) — re-run extraction with full context]
```

---

## 4. Model Routing / Escalation Policy

This is the part that needs to be exact, since "escalate when needed" is meaningless without hard triggers. Escalate from NileChat-4B to the Tier-2 model (**DeepSeek v4 Flash via OpenRouter**) when **any** of the following hold:

1. **Confidence threshold breach** — classification or extraction confidence below a tuned cutoff (start at 0.7, adjust empirically per merchant/label once you have data).
2. **Non-empty `ambiguous_fields`** in the extraction output — NileChat is explicitly telling you it wasn't sure.
3. **Context budget overflow** — assembled prompt (conversation history + slot state + any retrieved examples) exceeds the ~2048-token working ceiling. Don't silently truncate and hope; route to DeepSeek v4 Flash via OpenRouter (Tier 2), which has a much larger context window and can use the full thread.
4. **Repeated correction** — the merchant has rejected/edited NileChat's extraction twice already in the same conversation. Escalate the rest of that thread automatically rather than repeating the same failure mode a third time.
5. **Reasoning-heavy content, not just dialect-heavy content** — messages that require multi-step reasoning, cross-referencing past orders, or resolving a genuine ambiguity in intent (not just vocabulary) rather than fluent-but-simple dialect. Flag this heuristically at first (e.g., message length + question-mark density + presence of conditional language "لو... يبقى...") and refine once you see real escalation patterns.

Everything that doesn't hit a trigger stays on NileChat-4B. The goal is that DeepSeek v4 Flash (Tier 2) handles a small minority of traffic — if you find yourself escalating most messages, that's a signal your thresholds are miscalibrated, not that NileChat is the wrong choice.

**Track every escalation** with its reason in `Message.escalationReason`. This is your prioritized signal for what to fine-tune NileChat on next — if 40% of escalations are the same failure pattern, that's a targeted LoRA fine-tune, not a permanent DeepSeek v4 Flash dependency.

---

## 5. Embeddings

**NileChat-4B does not produce embeddings as a supported feature** — it's a generative chat model. Two real options, not interchangeable in reliability:

**Option A (recommended default): self-hosted multilingual embedding model (`BAAI/bge-m3`) + normalization bridge.**
Use a dedicated multilingual embedding model (`BAAI/bge-m3` or `intfloat/multilingual-e5-base`) served locally (e.g., via Text Embeddings Inference / TEI or FastEmbed) on the **normalized** text — Arabizi already converted, spelling already canonicalized.
- *Why `BAAI/bge-m3` instead of `bge-base-en-v1.5`?* `bge-base-en-v1.5` has an English-only tokenizer and vocabulary, making it ineffective for Arabic or transliterated Egyptian dialects. `bge-m3` natively handles 100+ languages including Arabic.
- The normalization step you have in place canonicalizes Egyptian dialect and Arabizi before embedding, ensuring high-quality semantic similarity search.

**Option B (experimental, don't build this first): hidden-state extraction from NileChat itself.**
Since NileChat is open-weights, you can technically mean-pool a hidden layer's activations as a pseudo-embedding. This is unvalidated for this model — it was never trained as an embedding model (no contrastive/similarity objective), so retrieval quality is unknown until you benchmark it yourself against Option A on your own labeled pairs. Worth a side experiment once you have real data, not something to depend on for MVP.

**Storage/retrieval:** pgvector column (`vector(1024)`) on `Message` and `LabeledExample`, cosine similarity (`<=>`), merchant-scoped query first with fallback to the global `LabeledExample` pool when a merchant has too little history of their own.

---

## 6. Clustering (offline, not in the request path)

Real, embedding-based clustering of accumulated messages to discover new user intents and build few-shot examples. 

- **Pure Local Computation:** The actual grouping uses `AgglomerativeClustering` over the dense embeddings (`BAAI/bge-m3`) already attached to the messages. This groups messages by true semantic similarity without requiring an LLM call.
- **Representative Extraction:** For each discovered cluster, we find the messages closest to its own centroid (via cosine similarity) to serve as the highly representative examples.
- **Batched LLM Labeling:** Only the human-readable intent label and one-sentence summary per cluster come from a single, batched LLM call to DeepSeek v4 Flash (via OpenRouter API). The LLM is provided the size of the cluster and its top representative messages.
- **Graceful Degradation:** The pipeline never loses the underlying local grouping. If the OpenRouter API fails or is unavailable, it degrades gracefully to generic fallback labels (e.g., "unknown_intent_0") rather than failing outright.
- **Persistence:** The top representative messages from these labeled clusters are written to `LabeledExample` (`source = "cluster_labeling"`), making them immediately available as few-shot context for NileChat's real-time extraction.

---

## 7. Serving Notes

- **Tier 1 (NileChat-4B):** Run NileChat-4B behind vLLM with guided/structured decoding enabled for the extraction schema — this is what makes "no native function calling" a non-issue.
- **Tier 2 (DeepSeek v4 Flash):** Point your AI-client module at the OpenRouter API (`https://openrouter.ai/api/v1`) using `OPENROUTER_API_KEY` with OpenAI-compatible payload structure — same client interface, different base URL/model name.
- **Embeddings (`BAAI/bge-m3`):** Run self-hosted embedding inference via Hugging Face TEI (Text Embeddings Inference) Docker container or local ONNX/FastEmbed runtime for low latency and zero per-token cost.
- **Observability:** Log token counts and latencies per call regardless of tier — this lets you catch context-budget overflows (§4, trigger 3) before they degrade output quality.
