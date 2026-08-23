import asyncio
from app.core.config import settings
from app.engine.clients import get_nilechat_client
from app.engine.extraction import EXTRACTION_SYSTEM_PROMPT
from app.engine.schemas import ExtractionResult, json_schema_response_format

async def test():
    client = get_nilechat_client()
    print("Testing extraction with json_schema...")
    try:
        kwargs = {
            "model": settings.NILECHAT_MODEL,
            "messages": [
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": "عايزة فستان كتان بيج على العنوان ١٥ مايو طريق التحرير عمارة ١٢٣ فون ٠١١٥٨٨٧٨٤٥٢٤"},
            ],
            "response_format": json_schema_response_format(ExtractionResult, "order_extraction"),
            "temperature": 0.1
        }
        res = await asyncio.wait_for(client.chat.completions.create(**kwargs), timeout=10)
        print("Success:", res.choices[0].message.content)
    except Exception as e:
        print("Error with json_schema:", e)

    print("\nTesting extraction with json_object...")
    try:
        kwargs["response_format"] = {"type": "json_object"}
        res = await asyncio.wait_for(client.chat.completions.create(**kwargs), timeout=10)
        print("Success:", res.choices[0].message.content)
    except Exception as e:
        print("Error with json_object:", e)

asyncio.run(test())
