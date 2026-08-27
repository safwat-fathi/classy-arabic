from pydantic import BaseModel


class ProductVariantRead(BaseModel):
    id: str
    product_id: str
    label: str
    sku: str | None
    price: float | None
    stock: int | None
    status: str
    attributes: dict


class ProductRead(BaseModel):
    id: str
    merchant_id: str
    name: str
    aliases: list[str]
    variants: list[ProductVariantRead]
    price: float | None = None
