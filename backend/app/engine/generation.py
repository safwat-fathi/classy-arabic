from app.engine.gateway import CallUsage, complete, deepseek_provider
from app.engine.prompts import GENERATION_TASK_BLOCK, build_system_prompt
from app.engine.schemas import GeneratedReply
from app.models.enums import ConvState


async def generate_reply(
    *,
    user_prompt: str,
    merchant_name: str,
    conv_state: ConvState,
    slots: dict,
) -> tuple[str, CallUsage]:
    result, usage = await complete(
        deepseek_provider(),
        system_prompt=build_system_prompt(
            task_block=GENERATION_TASK_BLOCK,
            merchant_name=merchant_name,
            conv_state=conv_state,
            slots=slots,
        ),
        user_prompt=user_prompt,
        schema_model=GeneratedReply,
        parse_model=GeneratedReply,
        schema_name="generated_reply",
    )
    return result.reply, usage
