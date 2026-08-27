from pydantic import BaseModel, ConfigDict
from datetime import datetime

class StoreKnowledgeRead(BaseModel):
    id: str
    merchant_id: str
    knowledge_type: str
    title: str
    content: str
    keywords: list[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
