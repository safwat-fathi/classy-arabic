import asyncio
from app.core.database import async_session_maker
from app.engine.embeddings import embed_text
from app.models import Product
from sqlalchemy import select

async def main():
    async with async_session_maker() as session:
        result = await session.execute(select(Product))
        products = result.scalars().all()
        for p in products:
            text = f"{p.name} " + " ".join(p.aliases)  # type: ignore[arg-type]
            print(f"Re-embedding: {text}")
            p.embedding = await embed_text(text)
            
        await session.commit()
        print("Done re-embedding all products with new model.")

if __name__ == "__main__":
    asyncio.run(main())
