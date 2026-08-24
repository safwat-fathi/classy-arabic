from app.engine.prompts import CLASSIFICATION_TASK_BLOCK, build_system_prompt
from app.models.enums import ConvState


def test_includes_merchant_name_and_dialect_guidance():
    prompt = build_system_prompt(
        task_block="TASK_BLOCK_MARKER", merchant_name="Cairo Threads", conv_state=ConvState.GATHERING, slots={}
    )
    assert "Cairo Threads" in prompt
    assert "Arabizi" in prompt
    assert "TASK_BLOCK_MARKER" in prompt


def test_state_gloss_is_included():
    prompt = build_system_prompt(task_block="x", merchant_name="M", conv_state=ConvState.CONFIRMING, slots={})
    assert "CONFIRMING" in prompt


def test_empty_slots_says_nothing_gathered():
    prompt = build_system_prompt(task_block="x", merchant_name="M", conv_state=ConvState.NEW, slots={})
    assert "nothing gathered yet" in prompt


def test_nonempty_slots_are_serialized_without_ascii_escaping():
    prompt = build_system_prompt(
        task_block="x", merchant_name="M", conv_state=ConvState.GATHERING, slots={"product": "تيشيرت"}
    )
    assert "تيشيرت" in prompt


def test_classification_task_block_lists_known_intents():
    block = CLASSIFICATION_TASK_BLOCK.format(known_intents="greeting, purchase_intent")
    assert "greeting, purchase_intent" in block
