# Implementation Plan: SQLAlchemy Models & DB Seeding

This detailed plan covers creating the SQLAlchemy models, running Alembic migrations (including adding the `pgvector` extension), and creating an async seeder script populated with "Fashion & Apparel" dummy data.

## Proposed Changes

### 1. Create SQLAlchemy Models
We will create `app/models.py` to mirror the Prisma schema defined in the technical spec. 

#### [NEW] `app/models.py`

```python
import enum
from datetime import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy import String, ForeignKey, DateTime, Float, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.core.database import Base

# Enums
class ConvState(str, enum.Enum):
    NEW = "NEW"
    GATHERING = "GATHERING"
    CONFIRMING = "CONFIRMING"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"

class Direction(str, enum.Enum):
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"

class ModelTier(str, enum.Enum):
    RULE = "RULE"
    NILECHAT = "NILECHAT"
    ESCALATED = "ESCALATED"

class OrderStatus(str, enum.Enum):
    AUTO_CONFIRMED = "AUTO_CONFIRMED"
    PENDING_REVIEW = "PENDING_REVIEW"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"

# Models
class Merchant(Base):
    __tablename__ = "merchants"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    
    products: Mapped[List["Product"]] = relationship(back_populates="merchant")
    conversations: Mapped[List["Conversation"]] = relationship(back_populates="merchant")

class Product(Base):
    __tablename__ = "products"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"))
    name: Mapped[str] = mapped_column(String)
    aliases: Mapped[List[str]] = mapped_column(JSON) # Storing array of strings as JSON
    variants: Mapped[Dict[str, Any]] = mapped_column(JSON)
    embedding = mapped_column(Vector(1024), nullable=True)
    
    merchant: Mapped["Merchant"] = relationship(back_populates="products")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"))
    customer_ref: Mapped[str] = mapped_column(String)
    state: Mapped[ConvState] = mapped_column(Enum(ConvState))
    slots: Mapped[Dict[str, Any]] = mapped_column(JSON)
    last_message_at: Mapped[datetime] = mapped_column(DateTime)
    
    merchant: Mapped["Merchant"] = relationship(back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship(back_populates="conversation")
    orders: Mapped[List["Order"]] = relationship(back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    direction: Mapped[Direction] = mapped_column(Enum(Direction))
    raw_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    normalized_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    intent: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    intent_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model_tier: Mapped[Optional[ModelTier]] = mapped_column(Enum(ModelTier), nullable=True)
    escalation_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    embedding = mapped_column(Vector(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    conversation: Mapped["Conversation"] = relationship(back_populates="messages")

class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    extracted_payload: Mapped[Dict[str, Any]] = mapped_column(JSON)
    confirmed_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus))
    confidence_score: Mapped[float] = mapped_column(Float)
    extracted_by_tier: Mapped[ModelTier] = mapped_column(Enum(ModelTier))
    
    conversation: Mapped["Conversation"] = relationship(back_populates="orders")

class LabeledExample(Base):
    __tablename__ = "labeled_examples"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    merchant_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    normalized_text: Mapped[str] = mapped_column(String)
    intent: Mapped[str] = mapped_column(String)
    extraction: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    embedding = mapped_column(Vector(1024), nullable=True)
    source: Mapped[str] = mapped_column(String)
```

### 2. Alembic Migrations

We will:
1. Update `alembic/env.py` to import `app.models.Base` so Alembic can discover the metadata.
2. Run `alembic revision --autogenerate -m "Add core models"` to create the migration file.
3. **Important**: Since you aren't sure if `pgvector` is enabled, we will manually inject `op.execute("CREATE EXTENSION IF NOT EXISTS vector;")` at the very beginning of the `upgrade()` function in the generated migration file.
4. Run `alembic upgrade head`.

### 3. Create Seeder Script

We will write an async python script that uses `SQLAlchemy` to populate the DB with raw data.

#### [NEW] `scripts/seed.py`

```python
import asyncio
from datetime import datetime, timedelta
import cuid

from app.core.database import async_session_maker
from app.models import Merchant, Product, Conversation, Message, ConvState, Direction

async def seed_data():
    async with async_session_maker() as session:
        # Create Merchant
        merchant_id = cuid.cuid()
        merchant = Merchant(id=merchant_id, name="Classy Boutique")
        session.add(merchant)
        
        # Create Products
        p1 = Product(id=cuid.cuid(), merchant_id=merchant_id, name="Summer Linen Dress", aliases=["فستان صيفي", "فستان كتان"], variants={"sizes": ["S", "M", "L"], "colors": ["White", "Beige"]})
        p2 = Product(id=cuid.cuid(), merchant_id=merchant_id, name="Classic Denim Jacket", aliases=["جاكيت جينز", "جاكيت ازرق"], variants={"sizes": ["M", "L", "XL"]})
        session.add_all([p1, p2])

        # Conversation 1: Incomplete / Gathering
        # User asks for a dress, gives height, but hasn't finalized size.
        c1 = Conversation(
            id=cuid.cuid(), merchant_id=merchant_id, customer_ref="cust_111",
            state=ConvState.GATHERING, slots={"line_items": [{"product": "Summer Linen Dress"}]},
            last_message_at=datetime.utcnow()
        )
        c1_m1 = Message(
            id=cuid.cuid(), conversation_id=c1.id, direction=Direction.INBOUND,
            raw_text="بكام الفستان الكتان الصيفي؟", # "How much is the summer linen dress?"
            created_at=datetime.utcnow() - timedelta(minutes=5)
        )
        c1_m2 = Message(
            id=cuid.cuid(), conversation_id=c1.id, direction=Direction.OUTBOUND,
            raw_text="اهلا يا فندم! بـ 500 جنيه. تحبي مقاس ايه؟",
            created_at=datetime.utcnow() - timedelta(minutes=4)
        )
        c1_m3 = Message( # Engine needs to process this one
            id=cuid.cuid(), conversation_id=c1.id, direction=Direction.INBOUND,
            raw_text="طولي ١٦٠ ووزني ٦٠ البس مقاس ايه؟", # "My height is 160 and weight is 60, what size fits?"
            created_at=datetime.utcnow()
        )
        
        # Conversation 2: Ready to Confirm
        c2 = Conversation(
            id=cuid.cuid(), merchant_id=merchant_id, customer_ref="cust_222",
            state=ConvState.CONFIRMING, slots={"line_items": [{"product": "Classic Denim Jacket", "size": "L"}], "address": "Cairo, Nasr City"},
            last_message_at=datetime.utcnow()
        )
        c2_m1 = Message( # Engine needs to process this to confirm the order
            id=cuid.cuid(), conversation_id=c2.id, direction=Direction.INBOUND,
            raw_text="تمام ابعتلي الجاكيت لارج على مدينة نصر، هدفع كاش", # "Ok send me the Large jacket to Nasr City, cash"
            created_at=datetime.utcnow()
        )

        session.add_all([c1, c1_m1, c1_m2, c1_m3, c2, c2_m1])
        
        await session.commit()
        print("✅ Database seeded with raw messages successfully.")

if __name__ == "__main__":
    asyncio.run(seed_data())
```

**Notice:** All analytical fields (like `intent`, `embedding`, `normalized_text`, `model_tier`) are intentionally left out (`None`) in the seeded `Messages`. This creates the exact conditions needed to test the engine's processing loop.

## Execution Steps

Once you approve this plan, I will:
1. Ensure the `pgvector` python package is installed (`uv add pgvector cuid`).
2. Write `app/models.py`.
3. Update `alembic/env.py` to recognize `app.models`.
4. Generate the Alembic migration, inject the `CREATE EXTENSION` command, and apply it.
5. Create and run `scripts/seed.py`.
