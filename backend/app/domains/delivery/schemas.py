from pydantic import BaseModel


class DeliveryAreaRead(BaseModel):
    id: str
    merchant_id: str
    area: str
    delivery_fee: str
    estimated_delivery: str | None
    status: str


class DeliveryAreaCreate(BaseModel):
    area: str
    delivery_fee: float
    estimated_delivery: str | None = None


class DeliveryAreaUpdate(BaseModel):
    area: str | None = None
    delivery_fee: float | None = None
    estimated_delivery: str | None = None
