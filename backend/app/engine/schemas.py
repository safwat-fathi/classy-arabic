from typing import Annotated, Literal

from pydantic import BaseModel, Field, RootModel, field_validator


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
    address: str | None = Field(default=None, description="The shipping address explicitly mentioned in the message.")
    phone: str | None = Field(default=None, description="The phone number explicitly mentioned in the message.")
    payment_method: str | None = Field(
        default=None,
        description="The payment method explicitly mentioned in the message (e.g. 'InstaPay', 'Vodafone Cash', 'Cash on Delivery'). Watch out for slang like 'Insta', 'انستا', 'كاش', 'vf cash'.",
    )
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


class _ActionBase(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, v: float) -> float:
        if v > 1.0:
            return min(v / 100, 1.0)
        return v


class SearchProductsAction(_ActionBase):
    action: Literal["search_products"]
    query: str = Field(min_length=1)
    filters: dict[str, str | float | None] = Field(default_factory=dict)


class GetProductAction(_ActionBase):
    action: Literal["get_product"]
    product_id: str


class AddToCartAction(_ActionBase):
    action: Literal["add_to_cart"]
    product_id: str
    variant_id: str | None = None
    quantity: float = Field(gt=0)
    notes: str | None = None


class UpdateCartAction(_ActionBase):
    action: Literal["update_cart"]
    line_item_id: str
    quantity: float = Field(gt=0)


class RemoveFromCartAction(_ActionBase):
    action: Literal["remove_from_cart"]
    line_item_id: str


class GetCheckoutStateAction(_ActionBase):
    action: Literal["get_checkout_state"]


class UpdateCustomerInfoAction(_ActionBase):
    action: Literal["update_customer_info"]
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class CreateOrderAction(_ActionBase):
    action: Literal["create_order"]
    confirm: bool = True


class SearchStoreKnowledgeAction(_ActionBase):
    action: Literal["search_store_knowledge"]
    query: str = Field(min_length=1)
    knowledge_type: Literal["faq", "shipping", "returns", "exchange", "payment", "general"] | None = None


ProposedAction = Annotated[
    SearchProductsAction
    | GetProductAction
    | AddToCartAction
    | UpdateCartAction
    | RemoveFromCartAction
    | GetCheckoutStateAction
    | UpdateCustomerInfoAction
    | CreateOrderAction
    | SearchStoreKnowledgeAction,
    Field(discriminator="action"),
]


class ProposedActionEnvelope(RootModel[ProposedAction]):
    pass
