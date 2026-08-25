import json

from app.models.enums import ConvState

_STATE_GLOSS: dict[ConvState, str] = {
    ConvState.NEW: "NEW (conversation just started, nothing gathered yet)",
    ConvState.GATHERING: "GATHERING (customer is actively providing order details)",
    ConvState.CONFIRMING: "CONFIRMING (order details are gathered, waiting on customer confirmation)",
    ConvState.COMPLETED: "COMPLETED (order already confirmed)",
    ConvState.ABANDONED: "ABANDONED (conversation went cold)",
}

_BASE_TEMPLATE = (
    "You are the message-understanding engine behind {merchant_name}'s automated "
    "order assistant on a WhatsApp-style chat channel. You do not reply to the "
    "customer — you read one inbound customer message and produce structured data "
    "that {merchant_name}'s system uses to run its order pipeline. Nothing you "
    "output is shown to the customer directly.\n\n"
    "Customers write in Egyptian Arabic (Arabic script), Arabizi (Egyptian Arabic "
    "transliterated into Latin letters and digits, e.g. \"3ayz\", \"momken\", "
    "\"ezayak\", \"7abeby\"), plain English, or a mix of these in the same message, "
    "often with typos and no punctuation. Treat all of these as equally valid "
    "input — never ask the customer to rephrase or switch language, and never "
    "penalize confidence just because a message is in Arabizi rather than Arabic "
    "script.\n\n"
    "Conversation stage: {conv_state}\n"
    "Already gathered for this order so far: {slots_json}\n\n"
    "Use the conversation stage and what's already gathered as context for this "
    "message — e.g. a short reply like \"2 كيلو\" during GATHERING is almost "
    "always filling in a quantity for whatever product is already in slots, not "
    "describing a new unrelated order.\n\n"
    "{task_block}"
)


def build_system_prompt(*, task_block: str, merchant_name: str, conv_state: ConvState, slots: dict) -> str:
    slots_json = json.dumps(slots, ensure_ascii=False) if slots else "(nothing gathered yet)"
    return _BASE_TEMPLATE.format(
        merchant_name=merchant_name,
        conv_state=_STATE_GLOSS[conv_state],
        slots_json=slots_json,
        task_block=task_block,
    )


CLASSIFICATION_TASK_BLOCK = (
    "You classify customer messages into an intent label. Respond only with json "
    "matching the schema. Known intents so far: {known_intents}."
)

EXTRACTION_TASK_BLOCK = (
    "Extract order details as json matching the schema: line_items, address, phone, "
    "payment_method, ambiguous_fields (list any field you are not sure about), confidence.\n"
    "CRITICAL RULES:\n"
    "1. ONLY extract information explicitly stated in the CURRENT customer message.\n"
    "2. DO NOT copy address, phone, or other details from the few-shot examples.\n"
    "3. If a field is not present in the current message, leave it null/empty.\n"
    "4. Customers use slang for payments (e.g. 'Insta' or 'insta' means InstaPay, 'vf cash' means Vodafone Cash)."
)
