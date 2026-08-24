from datetime import UTC, datetime

import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.engine import gateway
from app.models import LabeledExample, Message

FALLBACK_LABEL_PREFIX = "unknown_intent"


async def fetch_embedded_messages(session: AsyncSession, limit: int) -> list[Message]:
    # clustered_at.is_(None) — a message already folded into a labeled cluster
    # (or, correctly, left out of one for being too small a group) is not
    # re-fetched on the next run: without this, every run re-inserts the same
    # LabeledExample rows for the same representative messages. order_by makes
    # which `limit` messages get sampled deterministic instead of arbitrary.
    result = await session.execute(
        select(Message)
        .where(Message.embedding.is_not(None), Message.clustered_at.is_(None))
        .options(selectinload(Message.conversation))
        .order_by(Message.created_at)
        .limit(limit)
    )
    return list(result.scalars().all())


def cluster_messages(messages: list[Message], distance_threshold: float) -> dict[int, list[Message]]:
    if len(messages) < 2:
        return {}
    vectors = np.array([m.embedding for m in messages])
    clustering = AgglomerativeClustering(
        n_clusters=None, distance_threshold=distance_threshold, metric="cosine", linkage="average"
    )
    labels = clustering.fit_predict(vectors)
    clusters: dict[int, list[Message]] = {}
    for label, message in zip(labels, messages):
        clusters.setdefault(int(label), []).append(message)
    return clusters


def representative_messages(cluster: list[Message], top_n: int = 5) -> list[Message]:
    vectors = np.array([m.embedding for m in cluster])
    centroid = vectors.mean(axis=0)
    norms = np.linalg.norm(vectors, axis=1) * np.linalg.norm(centroid) + 1e-9
    similarities = (vectors @ centroid) / norms
    order = np.argsort(-similarities)
    return [cluster[i] for i in order[:top_n]]


async def label_cluster(representatives: list[Message], cluster_size: int, cluster_id: int) -> str:
    texts = "\n".join(f"- {m.normalized_text}" for m in representatives)
    system_prompt = 'You classify user messages into a 1-3 word intent. You also provide a very brief summary of the user messages. Respond with json: {"intent": snake_case_label, "summary": one_sentence}.'  # noqa: E501
    user_prompt = f"Cluster size: {cluster_size}\nMessages:\n{texts}"
    try:
        data = await gateway.complete_json(
            gateway.escalated_provider(), system_prompt=system_prompt, user_prompt=user_prompt
        )
        return data["intent"]
    except Exception:
        return f"{FALLBACK_LABEL_PREFIX}_{cluster_id}"


async def run_clustering(
    session: AsyncSession, distance_threshold: float = 0.3, min_cluster_size: int = 3, limit: int = 1000
) -> int:
    messages = await fetch_embedded_messages(session, limit)
    clusters = cluster_messages(messages, distance_threshold)
    created = 0
    for cluster_id, members in clusters.items():
        if len(members) < min_cluster_size:
            continue
        representatives = representative_messages(members)
        intent = await label_cluster(representatives, len(members), cluster_id)
        for message in representatives:
            merchant_id = message.conversation.merchant_id if message.conversation else None
            session.add(
                LabeledExample(
                    merchant_id=merchant_id,
                    normalized_text=message.normalized_text or "",
                    intent=intent,
                    embedding=message.embedding,
                    source="cluster_labeling",
                )
            )
            created += 1
        clustered_at = datetime.now(UTC)
        for message in members:
            message.clustered_at = clustered_at
    await session.flush()
    return created
