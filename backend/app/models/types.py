from typing import Any

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.types import String, TypeDecorator

from app.core.config import settings


class EncryptedString(TypeDecorator):
    """
    A SQLAlchemy TypeDecorator that transparently encrypts strings on the way in
    and decrypts them on the way out using Fernet symmetric encryption.
    """

    impl = String
    cache_ok = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not settings.ENCRYPTION_KEY:
            raise ValueError("ENCRYPTION_KEY must be set in settings to use EncryptedString")
        self.fernet = Fernet(settings.ENCRYPTION_KEY.encode())

    def process_bind_param(self, value: str | None, dialect: Any) -> str | None:
        if value is None:
            return None
        return self.fernet.encrypt(value.encode()).decode()

    def process_result_value(self, value: str | None, dialect: Any) -> str | None:
        if value is None:
            return None
        try:
            return self.fernet.decrypt(value.encode()).decode()
        except InvalidToken:
            return value
