import asyncio

from app.clustering.job import run_clustering
from app.core.database import async_session_maker


async def main():
    async with async_session_maker() as session:
        created = await run_clustering(session)
        print(f"Clustering complete. Created {created} labeled examples.")


if __name__ == "__main__":
    asyncio.run(main())
