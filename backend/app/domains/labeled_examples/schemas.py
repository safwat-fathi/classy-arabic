import re
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator

_INTENT_RE = re.compile(r"^[a-z][a-z0-9_]{0,49}$")


def _validate_intent(v: str) -> str:
    if not _INTENT_RE.match(v):
        raise ValueError("intent must be snake_case (lowercase letters, digits, underscores, max 50 chars)")
    return v


class LabeledExampleRead(BaseModel):
    id: str
    merchant_id: str | None
    normalized_text: str
    intent: str
    extraction: dict[str, Any] | None
    source: str

    model_config = ConfigDict(from_attributes=True)


class LabeledExampleCreate(BaseModel):
    normalized_text: str
    intent: str
    extraction: dict[str, Any] | None = None

    @field_validator("intent")
    @classmethod
    def intent_format(cls, v: str) -> str:
        return _validate_intent(v)


class LabeledExampleUpdate(BaseModel):
    normalized_text: str | None = None
    intent: str | None = None
    extraction: dict[str, Any] | None = None

    @field_validator("intent")
    @classmethod
    def intent_format(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _validate_intent(v)
