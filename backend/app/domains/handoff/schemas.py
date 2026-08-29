from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import HandoffReason


class HandoffTakeoverRequest(BaseModel):
    reason: HandoffReason = Field(default=HandoffReason.MERCHANT_TAKEOVER)
    notes: Optional[str] = None


class HandoffReturnRequest(BaseModel):
    notes: Optional[str] = None
