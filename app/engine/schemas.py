from pydantic import BaseModel, Field


class IntentClassification(BaseModel):
    intent: str
    confidence: float = Field(ge=0.0, le=1.0)


class ExtractedLineItem(BaseModel):
    product_name: str
    quantity: float
    notes: str | None = None


class ExtractionResult(BaseModel):
    line_items: list[ExtractedLineItem] = Field(default_factory=list)
    address: str | None = None
    phone: str | None = None
    payment_method: str | None = None
    ambiguous_fields: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


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
