import asyncio
import selectors

from sqlalchemy import text
from app.core.database import engine


async def main():
    async with engine.connect() as connection:
        result = await connection.execute(text("SELECT 1"))
        print(result.scalar())


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=lambda: asyncio.SelectorEventLoop(
            selectors.SelectSelector()
        ),
    )