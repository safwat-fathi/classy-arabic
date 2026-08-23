from pydantic import BaseModel, Field, field_validator


class IntentClassification(BaseModel):
    intent: str
    confidence: float = Field(ge=0.0, le=1.0)

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, v: float | int) -> float:
        if isinstance(v, (int, float)) and v > 1.0:
            return min(v / 100.0, 1.0)
        return v


class ExtractedLineItem(BaseModel):
    product_name: str
    quantity: float
    notes: str | None = None
    product_id: str | None = None


class ExtractionResult(BaseModel):
    line_items: list[ExtractedLineItem] = Field(default_factory=list)
    address: str | None = None
    phone: str | None = None
    payment_method: str | None = None
    ambiguous_fields: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, v: float | int) -> float:
        if isinstance(v, (int, float)) and v > 1.0:
            return min(v / 100.0, 1.0)
        return v

    from pydantic import model_validator

    @model_validator(mode="after")
    def cleanup_ambiguous_fields(self):
        cleaned = []
        for field in self.ambiguous_fields:
            if field == "address" and self.address:
                continue
            if field == "phone" and self.phone:
                continue
            if field == "payment_method" and self.payment_method:
                continue
            if field in ("line_items", "product", "size", "color") and self.line_items:
                continue
            cleaned.append(field)
        self.ambiguous_fields = cleaned
        return self


def json_schema_response_format(model: type[BaseModel], name: str) -> dict:
    # "strict" mode is intentionally omitted: it's an OpenAI-specific
    # validation mode and its behavior through vLLM/OpenRouter/TEI isn't
    # guaranteed — verify empirically against live endpoints before opting in.
    return {
        "type": "json_schema",
        "json_schema": {
            "name": name,
            "schema": model.model_json_schema(),
        },
    }
