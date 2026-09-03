from pydantic import BaseModel, Field

from app.models.enums import HandoffReason


class HandoffTakeoverRequest(BaseModel):
    reason: HandoffReason = Field(default=HandoffReason.MERCHANT_TAKEOVER)
    notes: str | None = None


class HandoffReturnRequest(BaseModel):
    notes: str | None = None
