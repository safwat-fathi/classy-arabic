# Implement AI-Driven Response Generation

You are completely right. Right now, the AI is only being used to **classify** what the user wants (e.g., "this is a greeting" or "this is an order"), and to **extract** order details. But it is _not_ being used to actually write the text of the reply.

For things like greetings, it was falling back to the hardcoded string I just added. For questions, it would just spit out the raw text from your knowledge base without formatting it naturally.

We need the bot to actually talk like an AI assistant.

## Proposed Changes

We will introduce a third AI step in the pipeline specifically for generating natural, conversational Arabic replies.

### 1. `backend/app/engine/generation.py` [NEW]

- Create a new function `generate_reply(intent, user_text, knowledge_context)`.
- This function will call the DeepSeek LLM with a specific prompt: "You are a helpful customer service assistant for an Egyptian merchant..."
- For `greeting`, it will dynamically generate a friendly welcome.
- For `question`, it will take the retrieved `knowledge_context` and synthesize a polite, natural answer.
- For `other`, it will ask for clarification.

### 2. `backend/app/engine/pipeline.py` [MODIFY]

- After classification (and after searching the knowledge base if it's a question), we will call `generate_reply`.
- The `PipelineResult.answer_text` will now be the dynamically generated string from the LLM, rather than raw knowledge text or `None`.

### 3. `backend/app/worker.py` [MODIFY]

- Remove the hardcoded `"أهلاً بك..."` string.
- Simply pass through the AI-generated `result.answer_text` to Facebook.

## Verification Plan

1. Send a greeting ("Hi" or "هاللل") and verify the AI replies with a dynamic, natural response (not a hardcoded string).
2. Ask a question and verify the AI answers using the knowledge base but formats it as a conversational sentence.
3. Check the `ai_usage_events` table to ensure the new LLM generation calls are being tracked for cost/analytics.

## Open Questions

- Do you want the AI to also generate the confirmation message when an order is placed (e.g., instead of the hardcoded `"تم استلام طلبك #1234"`), or should we keep order confirmations strict and hardcoded to avoid AI hallucinations with order numbers? (I recommend keeping order confirmations hardcoded for safety, but generating everything else with AI).
