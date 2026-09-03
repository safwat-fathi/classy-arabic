from pydantic import BaseModel, Field


class ManualOrderLineItem(BaseModel):
    product_id: str
    variant_id: str | None = None
    quantity: float = 1.0


class ManualOrderCreate(BaseModel):
    conversation_id: str
    line_items: list[ManualOrderLineItem] = Field(..., min_length=1)
    customer_name: str | None = None
    customer_phone: str | None = None
    delivery_address: str | None = None


class ManualOrderRead(BaseModel):
    id: str
    order_number: int | None
    status: str
    subtotal: float | None
    total: float | None
