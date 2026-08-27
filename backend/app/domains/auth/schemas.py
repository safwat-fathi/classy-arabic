from pydantic import BaseModel


class FacebookCallbackRequest(BaseModel):
    access_token: str


class AuthTokenResponse(BaseModel):
    access_token: str
    merchant_id: str
    merchant_name: str
