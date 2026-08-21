import enum


class Direction(str, enum.Enum):
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"


class ModelTier(str, enum.Enum):
    RULE = "RULE"
    NILECHAT = "NILECHAT"
    ESCALATED = "ESCALATED"


class ConvState(str, enum.Enum):
    NEW = "NEW"
    GATHERING = "GATHERING"
    CONFIRMING = "CONFIRMING"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class OrderStatus(str, enum.Enum):
    AUTO_CONFIRMED = "AUTO_CONFIRMED"
    PENDING_REVIEW = "PENDING_REVIEW"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
