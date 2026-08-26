from pydantic import BaseModel


class ProductRead(BaseModel):
    id: str
    merchant_id: str
    name: str
    aliases: list[str]
    variants: dict
    price: float | None = None
