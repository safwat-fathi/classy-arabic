import httpx

from app.clustering.job import run_clustering
from app.models import Direction, LabeledExample, Message


def _labeling_response(intent: str, summary: str) -> dict:
    import json

    return {
        "id": "chatcmpl-1",
        "object": "chat.completion",
        "created": 0,
        "model": "test",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": json.dumps({"intent": intent, "summary": summary})},
                "finish_reason": "stop",
            }
        ],
    }


async def test_run_clustering_labels_a_tight_cluster(db_session, conversation, mock_ai):
    mock_ai.post("https://openrouter.ai/api/v1/chat/completions").mock(
        return_value=httpx.Response(200, json=_labeling_response("delivery_question", "asks about delivery time"))
    )

    conversation.merchant.auto_learning_enabled = True
    vec = [1.0] * 1024
    for i in range(4):
        db_session.add(
            Message(
                conversation_id=conversation.id,
                direction=Direction.INBOUND,
                normalized_text=f"message {i}",
                embedding=vec,
            )
        )
    await db_session.flush()

    created = await run_clustering(db_session, distance_threshold=0.3, min_cluster_size=3, limit=100)
    assert created > 0

    from sqlalchemy import select

    result = await db_session.execute(select(LabeledExample).where(LabeledExample.source == "cluster_labeling"))
    examples = result.scalars().all()
    assert all(e.intent == "delivery_question" for e in examples)


async def test_run_clustering_falls_back_on_labeling_failure(db_session, conversation, mock_ai):
    mock_ai.post("https://openrouter.ai/api/v1/chat/completions").mock(return_value=httpx.Response(500))

    conversation.merchant.auto_learning_enabled = True
    vec = [1.0] * 1024
    for i in range(4):
        db_session.add(
            Message(
                conversation_id=conversation.id,
                direction=Direction.INBOUND,
                normalized_text=f"message {i}",
                embedding=vec,
            )
        )
    await db_session.flush()

    created = await run_clustering(db_session, distance_threshold=0.3, min_cluster_size=3, limit=100)
    assert created > 0

    from sqlalchemy import select

    result = await db_session.execute(select(LabeledExample).where(LabeledExample.source == "cluster_labeling"))
    examples = result.scalars().all()
    assert all(e.intent.startswith("unknown_intent") for e in examples)
