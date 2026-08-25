import enum


class Direction(enum.StrEnum):
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"


class ModelTier(enum.StrEnum):
    RULE = "RULE"
    DEEPSEEK = "DEEPSEEK"


class ConvState(enum.StrEnum):
    NEW = "NEW"
    GATHERING = "GATHERING"
    CONFIRMING = "CONFIRMING"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class OrderStatus(enum.StrEnum):
    AUTO_CONFIRMED = "AUTO_CONFIRMED"
    PENDING_REVIEW = "PENDING_REVIEW"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"


class Channel(enum.StrEnum):
    FACEBOOK = "FACEBOOK"
    INSTAGRAM = "INSTAGRAM"
    WHATSAPP = "WHATSAPP"
