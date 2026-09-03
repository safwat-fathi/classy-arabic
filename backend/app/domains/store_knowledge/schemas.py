from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StoreKnowledgeRead(BaseModel):
    id: str
    merchant_id: str
    knowledge_type: str
    title: str
    content: str
    keywords: list[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StoreKnowledgeCreate(BaseModel):
    knowledge_type: str
    title: str
    content: str
    keywords: list[str] = Field(default_factory=list)


class StoreKnowledgeUpdate(BaseModel):
    knowledge_type: str | None = None
    title: str | None = None
    content: str | None = None
    keywords: list[str] | None = None
